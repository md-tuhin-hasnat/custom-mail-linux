/**
 * gmailImapSync.ts
 * High-speed direct IMAP TLS synchronization engine for Google Workspace / Gmail.
 * Authenticates using XOAUTH2 SASL tokens, parses raw IMAP folders and RFC822 envelopes,
 * streams batch progress events to renderer, and integrates tombstone filtering.
 */

import tls from 'node:tls';
import { AccountConfig } from '../../types/account';
import { StorageService } from './storageService';
import { MailFolder } from '../../types/mail';
import { groupMessagesIntoThreads } from './gmailParser';
import { parseImapFolders, parseImapEnvelopeLine, envelopeToMailMessage } from './imapParser';

export interface SyncProgress {
  current: number;
  total: number;
  status: string;
  isSyncing: boolean;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

class ImapClient {
  private socket: tls.TLSSocket | null = null;
  private seq = 1;

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false });
      this.socket.setEncoding('utf8');

      this.socket.once('data', (data: string) => {
        if (data.includes('* OK')) {
          resolve();
        } else {
          reject(new Error(`IMAP Greeting failed: ${data}`));
        }
      });

      this.socket.on('error', (err) => reject(err));
    });
  }

  public async executeCommand(cmd: string): Promise<string> {
    if (!this.socket) throw new Error('Socket not connected');
    const tag = `A${String(this.seq++).padStart(2, '0')}`;
    let buffer = '';

    return new Promise((resolve, reject) => {
      const onData = (chunk: string) => {
        buffer += chunk;
        if (buffer.includes(`${tag} OK`)) {
          this.socket?.removeListener('data', onData);
          resolve(buffer);
        } else if (buffer.includes(`${tag} NO`) || buffer.includes(`${tag} BAD`)) {
          this.socket?.removeListener('data', onData);
          reject(new Error(`IMAP error on ${tag}: ${buffer}`));
        }
      };

      this.socket?.on('data', onData);
      this.socket?.write(`${tag} ${cmd}\r\n`);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      try {
        this.socket.write(`A${String(this.seq++).padStart(2, '0')} LOGOUT\r\n`);
        this.socket.end();
      } catch {}
      this.socket = null;
    }
  }
}

export type BatchLoadedCallback = (threads: any[], folders: any[]) => void;

import { refreshGoogleToken } from './googleAuth';

export async function syncGmailAccountImap(
  account: AccountConfig,
  storage: StorageService,
  onProgress?: SyncProgressCallback,
  onBatchLoaded?: BatchLoadedCallback,
  forceFull = false
): Promise<boolean> {
  if (account.type !== 'google') return false;

  const refreshedToken = await refreshGoogleToken(account, (updated) => {
    const all = storage.getAccounts().map((a) => (a.id === updated.id ? updated : a));
    storage.saveAccounts(all);
  });
  const token = refreshedToken || account.oauth?.accessToken;
  if (!token) return false;

  onProgress?.({
    current: 0,
    total: 100,
    status: forceFull ? 'Wiping cache & connecting to Gmail IMAP...' : 'Connecting to Gmail IMAP socket...',
    isSyncing: true,
  });

  const client = new ImapClient();
  try {
    await client.connect();

    const authString = `user=${account.email}\x01auth=Bearer ${token}\x01\x01`;
    const b64Auth = Buffer.from(authString).toString('base64');
    await client.executeCommand(`AUTHENTICATE XOAUTH2 ${b64Auth}`);

    // Discover all IMAP folders and custom Gmail labels
    const listResponse = await client.executeCommand('LIST "" "*"');
    const listLines = listResponse.split('\r\n').filter((l) => l.startsWith('* LIST'));
    const imapFolders = parseImapFolders(listLines);

    // Select All Mail to get full count
    const selResponse = await client.executeCommand('SELECT "[Gmail]/All Mail"');
    const match = selResponse.match(/\*\s+(\d+)\s+EXISTS/);
    const totalExists = match ? parseInt(match[1], 10) : 0;

    if (totalExists === 0) {
      client.disconnect();
      onProgress?.({ current: 0, total: 0, status: 'No messages in mailbox', isSyncing: false });
      return true;
    }

    if (forceFull) {
      storage.clearAccountMailbox(account.id);
      onBatchLoaded?.([], imapFolders);
    }

    const data = storage.getAccountData(account.id);
    const hasExistingData = data.threads.length > 0 || (data.deletedThreadIds && data.deletedThreadIds.length > 0);
    const lastSynced = data.lastSyncedTotalExists || (hasExistingData ? totalExists : 0);

    const getActiveMsgCount = () =>
      data.threads.reduce((acc, t) => acc + (t.messages?.length || t.messageCount || 1), 0);

    // If local mailbox already has all messages up to server sequence, do not re-fetch
    if (!forceFull && lastSynced >= totalExists && hasExistingData) {
      data.lastSyncedTotalExists = totalExists;
      updateFolderCounts(data, imapFolders);
      storage.saveAccountData(account.id, data);
      client.disconnect();
      const activeCount = getActiveMsgCount();
      onProgress?.({
        current: activeCount,
        total: activeCount,
        status: `All folders up to date (${activeCount.toLocaleString()} messages, ${data.threads.length.toLocaleString()} conversations)`,
        isSyncing: false,
      });
      return true;
    }

    // Delta sync: If we already have messages, only download the new ones since lastSynced
    if (!forceFull && lastSynced > 0 && lastSynced < totalExists) {
      const bottom = lastSynced + 1;
      const cmd = `FETCH ${bottom}:${totalExists} (UID FLAGS INTERNALDATE X-GM-THRID X-GM-LABELS BODYSTRUCTURE ENVELOPE)`;
      const fetchResponse = await client.executeCommand(cmd);

      const lines = fetchResponse.split('\r\n').filter((l) => l.startsWith('* '));
      const newMessages = lines
        .map(parseImapEnvelopeLine)
        .filter(Boolean)
        .map((env) => envelopeToMailMessage(env!));

      if (newMessages.length > 0) {
        data.threads = groupMessagesIntoThreads(
          newMessages,
          data.threads,
          data.deletedThreadIds,
          data.deletedMessageIds
        );
      }

      data.lastSyncedTotalExists = totalExists;
      updateFolderCounts(data, imapFolders);
      storage.saveAccountData(account.id, data);
      client.disconnect();
      onBatchLoaded?.(data.threads, data.folders);

      const activeCount = getActiveMsgCount();
      onProgress?.({
        current: activeCount,
        total: activeCount,
        status: `All folders up to date (${activeCount.toLocaleString()} messages, ${data.threads.length.toLocaleString()} conversations)`,
        isSyncing: false,
      });
      return true;
    }

    const blockSize = 1000;
    let downloaded = 0;

    for (let top = totalExists; top >= 1; top -= blockSize) {
      const bottom = Math.max(1, top - blockSize + 1);
      const cmd = `FETCH ${bottom}:${top} (UID FLAGS INTERNALDATE X-GM-THRID X-GM-LABELS BODYSTRUCTURE ENVELOPE)`;
      const fetchResponse = await client.executeCommand(cmd);

      const lines = fetchResponse.split('\r\n').filter((l) => l.startsWith('* '));
      const newMessages = lines
        .map(parseImapEnvelopeLine)
        .filter(Boolean)
        .map((env) => envelopeToMailMessage(env!));

      data.threads = groupMessagesIntoThreads(
        newMessages,
        data.threads,
        data.deletedThreadIds,
        data.deletedMessageIds
      );
      downloaded += newMessages.length;

      updateFolderCounts(data, imapFolders);
      storage.saveAccountData(account.id, data);

      // Real-time batch push to UI renderer
      onBatchLoaded?.(data.threads, data.folders);

      const activeCount = getActiveMsgCount();
      onProgress?.({
        current: downloaded,
        total: totalExists,
        status: `Syncing: ${downloaded.toLocaleString()} / ${totalExists.toLocaleString()} messages via IMAP (${activeCount.toLocaleString()} active)...`,
        isSyncing: true,
      });
    }

    client.disconnect();

    data.lastSyncedTotalExists = totalExists;
    updateFolderCounts(data, imapFolders);
    storage.saveAccountData(account.id, data);
    onBatchLoaded?.(data.threads, data.folders);

    const activeCount = getActiveMsgCount();
    onProgress?.({
      current: activeCount,
      total: activeCount,
      status: `All folders up to date (${activeCount.toLocaleString()} messages, ${data.threads.length.toLocaleString()} conversations)`,
      isSyncing: false,
    });

    return true;
  } catch (err) {
    console.error('Gmail IMAP Sync error:', err);
    client.disconnect();
    return false;
  }
}

export function updateFolderCounts(
  data: ReturnType<StorageService['getAccountData']>,
  imapFolders?: MailFolder[]
) {
  if (imapFolders && imapFolders.length > 0) {
    const folderMap = new Map<string, MailFolder>();
    data.folders.forEach((f) => {
      const key = f.system ? f.id : f.name.toLowerCase();
      folderMap.set(key, f);
    });

    imapFolders.forEach((uf) => {
      const key = uf.system ? uf.id : uf.name.toLowerCase();
      const existing = folderMap.get(key);
      folderMap.set(key, existing ? { ...existing, name: uf.name } : uf);
    });

    data.folders = Array.from(folderMap.values());
  }

  const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();

  data.folders = data.folders.map((f) => {
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
