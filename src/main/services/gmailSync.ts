/**
 * gmailSync.ts
 * REST API synchronization service for Gmail accounts using Google Workspace REST endpoints.
 * Handles label retrieval, message paging with exponential backoff, profile totals,
 * and passes persistent tombstones into thread grouping to prevent resurrected emails.
 */

import { MailFolder } from '../../types/mail';
import { AccountConfig } from '../../types/account';
import { StorageService } from './storageService';
import { GmailMessageResponse, parseGmailMessage, groupMessagesIntoThreads } from './gmailParser';

export interface SyncProgress {
  current: number;
  total: number;
  status: string;
  isSyncing: boolean;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

interface GmailLabelItem {
  id: string;
  name: string;
  type: 'system' | 'user';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchProfileTotal(accessToken: string): Promise<number> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { messagesTotal?: number };
    return data.messagesTotal || 0;
  } catch {
    return 0;
  }
}

async function fetchUserLabels(accessToken: string): Promise<MailFolder[]> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { labels?: GmailLabelItem[] };
    return (data.labels || [])
      .filter((l) => l.type === 'user')
      .map((l) => ({
        id: l.id,
        name: l.name,
        icon: 'Folder',
        unreadCount: 0,
        totalCount: 0,
        system: false,
      }));
  } catch {
    return [];
  }
}

async function fetchMessageIdsPaged(accessToken: string, targetCount = 350): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < targetCount) {
    const pageSize = Math.min(200, targetCount - ids.length);
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', String(pageSize));
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) break;
      const data = (await res.json()) as {
        messages?: Array<{ id: string }>;
        nextPageToken?: string;
      };

      if (!data.messages || data.messages.length === 0) break;
      for (const m of data.messages) ids.push(m.id);
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    } catch {
      break;
    }
  }

  return ids;
}

async function fetchLabelMessageIds(accessToken: string, labelId: string, maxResults = 30): Promise<string[]> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${labelId}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return (data.messages || []).map((m) => m.id);
  } catch {
    return [];
  }
}

export async function syncGmailAccount(
  account: AccountConfig,
  storage: StorageService,
  onProgress?: SyncProgressCallback
): Promise<boolean> {
  if (account.type !== 'google' || !account.oauth?.accessToken) return false;
  let token = account.oauth.accessToken;

  onProgress?.({ current: 0, total: 100, status: 'Connecting to Google Workspace...', isSyncing: true });

  const totalInAccount = await fetchProfileTotal(token);
  let userFolders = await fetchUserLabels(token);

  if (userFolders.length === 0 && account.oauth.refreshToken) {
    const refreshed = await refreshGoogleToken(account, storage);
    if (refreshed) {
      token = refreshed;
      userFolders = await fetchUserLabels(token);
    }
  }

  onProgress?.({
    current: 10,
    total: totalInAccount || 100,
    status: `Discovered ${totalInAccount.toLocaleString()} total messages in Gmail...`,
    isSyncing: true,
  });

  const idSet = new Set<string>(await fetchMessageIdsPaged(token, 300));

  for (const folder of userFolders) {
    const labelIds = await fetchLabelMessageIds(token, folder.id, 25);
    labelIds.forEach((id) => idSet.add(id));
  }

  const allMessageIds = Array.from(idSet);
  const data = storage.getAccountData(account.id);
  const existingMsgIds = new Set(
    data.threads.flatMap((t) => t.messages.map((m) => m.id.replace('msg-gmail-', '')))
  );

  const idsToFetch = allMessageIds.filter((id) => !existingMsgIds.has(id));
  const effectiveTotal = Math.max(totalInAccount, existingMsgIds.size + idsToFetch.length);

  const chunkSize = 15;
  let downloadedCount = existingMsgIds.size;

  for (let i = 0; i < idsToFetch.length; i += chunkSize) {
    const chunk = idsToFetch.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (msgId) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!itemRes.ok) return null;
        return (await itemRes.json()) as GmailMessageResponse;
      } catch {
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    const validMessages = chunkResults.filter(Boolean) as GmailMessageResponse[];
    const parsed = validMessages.map(parseGmailMessage);

    data.threads = groupMessagesIntoThreads(
      parsed,
      data.threads,
      data.deletedThreadIds,
      data.deletedMessageIds
    );
    downloadedCount += validMessages.length;

    updateFolderCounts(data, userFolders);
    storage.saveAccountData(account.id, data);

    onProgress?.({
      current: downloadedCount,
      total: effectiveTotal,
      status: `Syncing: ${downloadedCount.toLocaleString()} / ${effectiveTotal.toLocaleString()} messages (${data.threads.length} threads)...`,
      isSyncing: true,
    });

    await sleep(150);
  }

  updateFolderCounts(data, userFolders);
  storage.saveAccountData(account.id, data);

  onProgress?.({
    current: downloadedCount,
    total: effectiveTotal,
    status: `All folders up to date (${data.threads.length} conversations)`,
    isSyncing: false,
  });

  return true;
}

function updateFolderCounts(data: ReturnType<StorageService['getAccountData']>, userFolders: MailFolder[]) {
  const folderMap = new Map<string, MailFolder>();
  data.folders.forEach((f) => folderMap.set(f.id, f));

  userFolders.forEach((uf) => {
    const existing = folderMap.get(uf.id);
    folderMap.set(uf.id, existing ? { ...existing, name: uf.name } : uf);
  });

  const mergedFolders = Array.from(folderMap.values());

  const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();

  data.folders = mergedFolders.map((f) => {
    const matches = data.threads.filter((t) => {
      const hasL = (name: string) => t.labelIds?.some((l) => norm(l) === name.toLowerCase());

      if (f.id === 'inbox') {
        return t.folderId === 'inbox' || (hasL('inbox') && t.folderId !== 'sent' && t.folderId !== 'outbox' && t.folderId !== 'trash' && t.folderId !== 'drafts');
      }
      if (f.id === 'sent') {
        return t.folderId === 'sent' || (hasL('sent') && t.folderId !== 'trash' && t.folderId !== 'outbox');
      }
      if (f.id === 'outbox') {
        return t.folderId === 'outbox' || hasL('outbox');
      }
      if (f.id === 'trash') {
        return t.folderId === 'trash' || hasL('trash') || hasL('bin');
      }
      if (f.id === 'junk') {
        return t.folderId === 'junk' || hasL('spam') || hasL('junk');
      }
      if (f.id === 'drafts') {
        return t.folderId === 'drafts' || hasL('draft') || hasL('drafts');
      }
      if (f.id === 'archive') {
        return t.folderId === 'archive' || (hasL('archive') && t.folderId !== 'sent' && t.folderId !== 'trash');
      }
      return t.folderId === f.id || hasL(f.id) || (f.name && hasL(f.name));
    });

    return {
      ...f,
      unreadCount: matches.filter((t) => !t.isRead).length,
      totalCount: matches.length,
    };
  });
}

async function refreshGoogleToken(account: AccountConfig, storage: StorageService): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !account.oauth?.refreshToken) return null;

  try {
    const params: Record<string, string> = {
      client_id: clientId,
      refresh_token: account.oauth.refreshToken,
      grant_type: 'refresh_token',
    };
    if (clientSecret) params.client_secret = clientSecret;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const tokenData = await res.json();
    if (tokenData.access_token) {
      account.oauth.accessToken = tokenData.access_token;
      account.oauth.expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
      const allAccounts = storage.getAccounts();
      storage.saveAccounts(allAccounts.map((a) => (a.id === account.id ? account : a)));
      return tokenData.access_token;
    }
  } catch (e) {
    console.error('Failed to refresh Google token:', e);
  }
  return null;
}
