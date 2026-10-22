/**
 * mailIpc.ts
 * Electron IPC handlers for core email operations and persistent state.
 * Manages folder retrieval, thread listing with label normalization, full message body fetching,
 * IMAP synchronizations, resync all cache purges, draft sending, star/lock toggles,
 * and deletion tombstones to permanently prevent deleted emails from returning after sync.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { StorageService } from '../services/storageService';
import { MailThread, MailMessage } from '../../types/mail';
import { parseGmailMessage } from '../services/gmailParser';
import { syncGmailAccountImap } from '../services/gmailImapSync';
import { sendEmailMessage } from '../services/emailSendService';

export function registerMailIpc(
  storage: StorageService,
  getTargetAccountId: (id?: string) => string,
  getMainWindow: () => BrowserWindow | null
) {
  // Folder listing per account
  ipcMain.handle('mail:get-folders', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    return storage.getAccountData(id).folders;
  });

  // Thread listing with folder / label matching
  ipcMain.handle(
    'mail:get-threads',
    async (_, { folderId, accountId }: { folderId?: string; accountId?: string } = {}) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      if (!folderId || folderId === 'all') {
        return data.threads;
      }
      const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();

      return data.threads.filter((t) => {
        const hasL = (name: string) => t.labelIds?.some((l) => norm(l) === name.toLowerCase());

        if (folderId === 'inbox') return t.folderId === 'inbox' || hasL('inbox');
        if (folderId === 'sent') return t.folderId === 'sent' || hasL('sent');
        if (folderId === 'trash') return t.folderId === 'trash' || hasL('trash') || hasL('bin');
        if (folderId === 'junk') return t.folderId === 'junk' || hasL('spam') || hasL('junk');
        if (folderId === 'drafts') return t.folderId === 'drafts' || hasL('draft') || hasL('drafts');
        if (folderId === 'archive') {
          return t.folderId === 'archive' || (!hasL('inbox') && !hasL('trash') && !hasL('spam'));
        }
        return t.folderId === folderId || hasL(folderId);
      });
    }
  );

  // Full thread message bodies with on-demand fallback fetch
  ipcMain.handle(
    'mail:get-thread-messages',
    async (_, { threadId, accountId }: { threadId: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const thread = data.threads.find((t) => t.id === threadId);
      if (!thread) return [];

      const needsFullFetch = thread.messages.some((m) => {
        if (m.bodyHtml.startsWith('<p><strong>') && m.bodyHtml.includes('&lt;') && m.bodyHtml.includes('From:')) {
          return true;
        }
        if (
          !m.bodyHtml.includes('<br') &&
          !m.bodyHtml.includes('<div') &&
          !m.bodyHtml.includes('<table') &&
          !m.bodyHtml.includes('<span') &&
          !m.bodyHtml.includes('<ul')
        ) {
          return true;
        }
        return false;
      });

      if (!needsFullFetch && thread.messages.length > 0 && thread.messages[0].bodyHtml.length > 250) {
        return thread.messages;
      }

      const accounts = storage.getAccounts();
      const acc = accounts.find((a) => a.id === id);

      if (acc?.type === 'google' && acc.oauth?.accessToken) {
        try {
          let rawId = threadId.replace(/^th-gmail-/, '');
          if (/^\d+$/.test(rawId)) {
            try {
              rawId = BigInt(rawId).toString(16);
            } catch {}
          }

          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${rawId}?format=full`,
            {
              headers: { Authorization: `Bearer ${acc.oauth.accessToken}` },
            }
          );

          if (res.ok) {
            const threadData = (await res.json()) as { messages?: any[] };
            if (threadData.messages && threadData.messages.length > 0) {
              const parsedMsgs = threadData.messages.map(parseGmailMessage);
              thread.messages = parsedMsgs;
              if (parsedMsgs[0]?.snippet) thread.snippet = parsedMsgs[0].snippet;
              storage.saveAccountData(id, data);
              return parsedMsgs;
            }
          }
        } catch (err) {
          console.warn('Failed to fetch full thread messages:', err);
        }
      }

      return thread.messages;
    }
  );

  // Sync account
  ipcMain.handle('mail:sync', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    const accounts = storage.getAccounts();
    const acc = accounts.find((a) => a.id === id);
    if (acc?.type === 'google' && acc.oauth?.accessToken) {
      const win = getMainWindow();
      const sendProgress = (p: any) => win?.webContents.send('mail:sync-progress', p);
      const sendBatch = (threads: any[], folders: any[]) =>
        win?.webContents.send('mail:threads-updated', { threads, folders });
      await syncGmailAccountImap(acc, storage, sendProgress, sendBatch).catch(() => {});
    }
    return storage.getAccountData(id);
  });

  // Resync all: wipe local mailbox and refetch fresh
  ipcMain.handle('mail:resync-all', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    const accounts = storage.getAccounts();
    const acc = accounts.find((a) => a.id === id);
    const win = getMainWindow();

    const cleanData = storage.clearAccountMailbox(id);
    win?.webContents.send('mail:threads-updated', { threads: [], folders: cleanData.folders });

    if (acc?.type === 'google' && acc.oauth?.accessToken) {
      const sendProgress = (p: any) => win?.webContents.send('mail:sync-progress', p);
      const sendBatch = (threads: any[], folders: any[]) =>
        win?.webContents.send('mail:threads-updated', { threads, folders });
      await syncGmailAccountImap(acc, storage, sendProgress, sendBatch, true).catch((err) => {
        console.error('Error in resync-all:', err);
      });
    }
    return storage.getAccountData(id);
  });

  // Send email
  ipcMain.handle(
    'mail:send-mail',
    async (_, { draft, accountId }: { draft: Partial<MailMessage>; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const accounts = storage.getAccounts();
      const currentAccount = accounts.find((a) => a.id === id);

      const newMsg: MailMessage = {
        id: `msg-${Date.now()}`,
        threadId: `th-${Date.now()}`,
        senderName: currentAccount?.name || 'Me',
        senderEmail: currentAccount?.email || 'me@corp.com',
        recipientNames: draft.recipientNames || [draft.recipientEmails?.[0] || 'recipient@corp.com'],
        recipientEmails: draft.recipientEmails || ['recipient@corp.com'],
        subject: draft.subject || '(No Subject)',
        snippet: draft.snippet || draft.bodyHtml?.replace(/<[^>]+>/g, '').slice(0, 100) || '',
        bodyHtml: draft.bodyHtml || '',
        date: 'Just now',
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        folderId: 'sent',
        category: 'focused',
      };

      const newThread: MailThread = {
        id: newMsg.threadId,
        folderId: 'sent',
        subject: newMsg.subject,
        snippet: newMsg.snippet,
        participants: [{ name: newMsg.senderName, email: newMsg.senderEmail }],
        lastDate: 'Just now',
        messageCount: 1,
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        category: 'focused',
        messages: [newMsg],
      };

      data.threads = [newThread, ...data.threads];
      storage.saveAccountData(id, data);
      return { success: true, id: newThread.id };
    }
  );

  // Toggle star
  ipcMain.handle(
    'mail:toggle-star',
    async (_, { threadId, accountId }: { threadId: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      let isStarred = false;
      data.threads = data.threads.map((t) => {
        if (t.id === threadId) {
          isStarred = !t.isStarred;
          return { ...t, isStarred };
        }
        return t;
      });
      storage.saveAccountData(id, data);
      return isStarred;
    }
  );

  // Toggle lock
  ipcMain.handle(
    'mail:toggle-lock',
    async (_, { threadId, accountId }: { threadId: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      let isLocked = false;
      data.threads = data.threads.map((t) => {
        if (t.id === threadId) {
          isLocked = !t.isLocked;
          return {
            ...t,
            isLocked,
            messages: t.messages.map((m) => ({ ...m, isLocked })),
          };
        }
        return t;
      });
      storage.saveAccountData(id, data);
      return isLocked;
    }
  );

  // Delete thread with tombstone recording
  ipcMain.handle(
    'mail:delete-thread',
    async (_, { threadId, accountId }: { threadId: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const target = data.threads.find((t) => t.id === threadId);
      if (target && !target.isLocked) {
        data.deletedThreadIds = Array.from(new Set<string>([...(data.deletedThreadIds || []), threadId]));
        const msgIds = target.messages.map((m) => m.id);
        data.deletedMessageIds = Array.from(new Set<string>([...(data.deletedMessageIds || []), ...msgIds]));

        data.threads = data.threads.map((t) => (t.id === threadId ? { ...t, folderId: 'trash' } : t));
        storage.saveAccountData(id, data);
      }
    }
  );

  // Batch actions (mark read, unread, star, unstar, lock, unlock, archive, delete)
  ipcMain.handle(
    'mail:batch-action',
    async (
      _,
      {
        threadIds,
        action,
        accountId,
      }: {
        threadIds: string[];
        action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'delete' | 'archive' | 'lock' | 'unlock';
        accountId?: string;
      }
    ) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const idSet = new Set(threadIds);

      if (action === 'delete') {
        const unlockedThreads = data.threads.filter((t) => idSet.has(t.id) && !t.isLocked);
        const unlockedIds = unlockedThreads.map((t) => t.id);
        const unlockedMsgIds = unlockedThreads.flatMap((t) => t.messages.map((m) => m.id));

        data.deletedThreadIds = Array.from(new Set<string>([...(data.deletedThreadIds || []), ...unlockedIds]));
        data.deletedMessageIds = Array.from(new Set<string>([...(data.deletedMessageIds || []), ...unlockedMsgIds]));
      }

      data.threads = data.threads.map((t) => {
        if (!idSet.has(t.id)) return t;
        switch (action) {
          case 'markRead':
            return { ...t, isRead: true, messages: t.messages.map((m) => ({ ...m, isRead: true })) };
          case 'markUnread':
            return { ...t, isRead: false, messages: t.messages.map((m) => ({ ...m, isRead: false })) };
          case 'star':
            return { ...t, isStarred: true, messages: t.messages.map((m) => ({ ...m, isStarred: true })) };
          case 'unstar':
            return { ...t, isStarred: false, messages: t.messages.map((m) => ({ ...m, isStarred: false })) };
          case 'delete':
            if (t.isLocked) return t;
            return { ...t, folderId: 'trash' };
          case 'archive':
            return { ...t, folderId: 'archive' };
          case 'lock':
            return { ...t, isLocked: true, messages: t.messages.map((m) => ({ ...m, isLocked: true })) };
          case 'unlock':
            return { ...t, isLocked: false, messages: t.messages.map((m) => ({ ...m, isLocked: false })) };
          default:
            return t;
        }
      });

      storage.saveAccountData(id, data);
      return { success: true, count: threadIds.length };
    }
  );
}
