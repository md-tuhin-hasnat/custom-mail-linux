import { contextBridge, ipcRenderer } from 'electron';
import { MailMessage } from '../types/mail';
import { CalendarEvent } from '../types/calendar';
import { ManualServerConfig } from '../types/account';

contextBridge.exposeInMainWorld('desktopAPI', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    openExternal: (url: string) => ipcRenderer.invoke('window:open-external', url),
  },
  auth: {
    loginGoogle: () => ipcRenderer.invoke('auth:login-google'),
    loginMicrosoft: () => ipcRenderer.invoke('auth:login-microsoft'),
    loginManual: (config: { email: string; name: string; server: ManualServerConfig }) =>
      ipcRenderer.invoke('auth:login-manual', config),
  },
  account: {
    getAccounts: () => ipcRenderer.invoke('account:get-accounts'),
    getActiveAccount: () => ipcRenderer.invoke('account:get-active'),
    switchAccount: (accountId: string) => ipcRenderer.invoke('account:switch-account', accountId),
    removeAccount: (accountId: string) => ipcRenderer.invoke('account:remove-account', accountId),
  },
  mail: {
    getFolders: (accountId?: string) => ipcRenderer.invoke('mail:get-folders', accountId),
    getThreads: (folderId: string, accountId?: string) =>
      ipcRenderer.invoke('mail:get-threads', { folderId, accountId }),
    getThreadMessages: (threadId: string, accountId?: string) =>
      ipcRenderer.invoke('mail:get-thread-messages', { threadId, accountId }),
    sendMail: (draft: Partial<MailMessage>, accountId?: string) =>
      ipcRenderer.invoke('mail:send-mail', { draft, accountId }),
    markAsRead: (threadIds: string[], isRead: boolean, accountId?: string) =>
      ipcRenderer.invoke('mail:mark-read', { threadIds, isRead, accountId }),
    toggleStar: (threadId: string, accountId?: string) =>
      ipcRenderer.invoke('mail:toggle-star', { threadId, accountId }),
    toggleLock: (threadId: string, accountId?: string) =>
      ipcRenderer.invoke('mail:toggle-lock', { threadId, accountId }),
    deleteThread: (threadId: string, accountId?: string) =>
      ipcRenderer.invoke('mail:delete-thread', { threadId, accountId }),
    batchAction: (
      threadIds: string[],
      action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'delete' | 'archive' | 'lock' | 'unlock',
      accountId?: string
    ) => ipcRenderer.invoke('mail:batch-action', { threadIds, action, accountId }),
    previewCleanMailbox: (criteria: any, accountId?: string) =>
      ipcRenderer.invoke('mail:preview-clean-mailbox', { criteria, accountId }),
    cleanMailbox: (criteria: any, accountId?: string) =>
      ipcRenderer.invoke('mail:clean-mailbox', { criteria, accountId }),
    getUniqueSenders: (accountId?: string) =>
      ipcRenderer.invoke('mail:get-unique-senders', { accountId }),
    sync: (accountId?: string) => ipcRenderer.invoke('mail:sync', accountId),
    resyncAll: (accountId?: string) => ipcRenderer.invoke('mail:resync-all', accountId),
    getAttachmentData: (params: {
      messageId?: string;
      attachmentId: string;
      name: string;
      mimeType: string;
      accountId?: string;
    }) => ipcRenderer.invoke('mail:get-attachment-data', params),
    downloadAttachment: (params: {
      messageId?: string;
      attachmentId: string;
      name: string;
      mimeType: string;
      accountId?: string;
    }) => ipcRenderer.invoke('mail:download-attachment', params),
    onSyncProgress: (callback: (data: { current: number; total: number; status: string; isSyncing: boolean }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('mail:sync-progress', handler);
      return () => ipcRenderer.removeListener('mail:sync-progress', handler);
    },
    onThreadsUpdated: (callback: (data: { threads: any[]; folders: any[] }) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('mail:threads-updated', handler);
      return () => ipcRenderer.removeListener('mail:threads-updated', handler);
    },
  },
  calendar: {
    getEvents: (accountId?: string) => ipcRenderer.invoke('calendar:get-events', accountId),
    createEvent: (event: Partial<CalendarEvent>, accountId?: string) =>
      ipcRenderer.invoke('calendar:create-event', { event, accountId }),
  },
  contacts: {
    getContacts: (accountId?: string) => ipcRenderer.invoke('contacts:get-contacts', accountId),
  },
  tasks: {
    getTasks: (accountId?: string) => ipcRenderer.invoke('tasks:get-tasks', accountId),
    toggleTask: (taskId: string, accountId?: string) =>
      ipcRenderer.invoke('tasks:toggle-task', { taskId, accountId }),
    createTask: (title: string, accountId?: string) =>
      ipcRenderer.invoke('tasks:create-task', { title, accountId }),
  },
});
