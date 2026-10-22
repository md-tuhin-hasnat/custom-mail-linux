import { MailThread, MailFolder, MailMessage } from './mail';
import { CalendarEvent } from './calendar';
import { Contact } from './contacts';
import { TaskItem } from './tasks';
import { AccountConfig, AuthResult, ManualServerConfig } from './account';

export interface DesktopAPI {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    openExternal: (url: string) => Promise<boolean>;
  };
  auth: {
    loginGoogle: () => Promise<AuthResult>;
    loginMicrosoft: () => Promise<AuthResult>;
    loginManual: (config: {
      email: string;
      name: string;
      server: ManualServerConfig;
    }) => Promise<AuthResult>;
  };
  account: {
    getAccounts: () => Promise<AccountConfig[]>;
    getActiveAccount: () => Promise<AccountConfig | null>;
    switchAccount: (accountId: string) => Promise<AccountConfig | null>;
    removeAccount: (accountId: string) => Promise<boolean>;
  };
  mail: {
    getFolders: (accountId?: string) => Promise<MailFolder[]>;
    getThreads: (folderId: string, accountId?: string) => Promise<MailThread[]>;
    getThreadMessages: (threadId: string, accountId?: string) => Promise<MailMessage[]>;
    sendMail: (draft: Partial<MailMessage>, accountId?: string) => Promise<{ success: boolean; id: string }>;
    markAsRead: (threadIds: string[], isRead: boolean, accountId?: string) => Promise<void>;
    toggleStar: (threadId: string, accountId?: string) => Promise<boolean>;
    toggleLock: (threadId: string, accountId?: string) => Promise<boolean>;
    deleteThread: (threadId: string, accountId?: string) => Promise<void>;
    batchAction: (
      threadIds: string[],
      action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'delete' | 'archive' | 'lock' | 'unlock',
      accountId?: string
    ) => Promise<{ success: boolean; count: number }>;
    previewCleanMailbox: (
      criteria: any,
      accountId?: string
    ) => Promise<{
      matchedCount: number;
      eligibleCount: number;
      lockedProtectedCount: number;
      sampleSenders: string[];
      sampleSubjects: string[];
    }>;
    cleanMailbox: (
      criteria: any,
      accountId?: string
    ) => Promise<{
      matchedCount: number;
      deletedCount: number;
      lockedProtectedCount: number;
    }>;
    getUniqueSenders: (accountId?: string) => Promise<import('./mail').UniqueSenderStats[]>;
    sync: (accountId?: string) => Promise<any>;
    resyncAll: (accountId?: string) => Promise<any>;
    getAttachmentData: (params: {
      messageId?: string;
      attachmentId: string;
      name: string;
      mimeType: string;
      accountId?: string;
    }) => Promise<{ base64?: string; dataUrl?: string; size?: number; error?: string }>;
    downloadAttachment: (params: {
      messageId?: string;
      attachmentId: string;
      name: string;
      mimeType: string;
      accountId?: string;
    }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
    onSyncProgress: (callback: (data: { current: number; total: number; status: string; isSyncing: boolean }) => void) => () => void;
    onThreadsUpdated: (callback: (data: { threads: MailThread[]; folders: MailFolder[] }) => void) => () => void;
  };
  calendar: {
    getEvents: (accountId?: string) => Promise<CalendarEvent[]>;
    createEvent: (event: Partial<CalendarEvent>, accountId?: string) => Promise<CalendarEvent>;
  };
  contacts: {
    getContacts: (accountId?: string) => Promise<Contact[]>;
  };
  tasks: {
    getTasks: (accountId?: string) => Promise<TaskItem[]>;
    toggleTask: (taskId: string, accountId?: string) => Promise<boolean>;
    createTask: (title: string, accountId?: string) => Promise<TaskItem>;
  };
}

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}
