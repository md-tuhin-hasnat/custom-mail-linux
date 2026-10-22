export interface Account {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  type: 'exchange' | 'office365' | 'imap';
}

export interface MailFolder {
  id: string;
  name: string;
  icon: string;
  unreadCount: number;
  totalCount: number;
  system: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  messageId?: string;
  dataUrl?: string;
}

export interface MailMessage {
  id: string;
  threadId: string;
  senderName: string;
  senderEmail: string;
  recipientNames: string[];
  recipientEmails: string[];
  subject: string;
  snippet: string;
  bodyHtml: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  isLocked?: boolean;
  folderId: string;
  category?: 'primary' | 'focused' | 'other';
  labelIds?: string[];
  attachments?: Attachment[];
}

export interface MailThread {
  id: string;
  folderId: string;
  subject: string;
  snippet: string;
  participants: { name: string; email: string }[];
  lastDate: string;
  messageCount: number;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  isLocked?: boolean;
  category?: 'primary' | 'focused' | 'other';
  labelIds?: string[];
  messages: MailMessage[];
}

export interface MailCleanerCriteria {
  senderEmail?: string;
  senderEmails?: string[]; // Multiple marked sender addresses
  senderDomain?: string;
  startDate?: string;
  endDate?: string;
  olderThanDays?: number;
  folderId?: string;
  category?: 'all' | 'focused' | 'other';
  onlyRead?: boolean;
  onlyWithAttachments?: boolean;
  deletePermanently?: boolean;
}

export interface UniqueSenderStats {
  email: string;
  name: string;
  domain: string;
  threadCount: number;
  messageCount: number;
  unreadCount: number;
  hasAttachments: boolean;
  lockedCount: number;
  lastDate: string;
  threadIds: string[];
}

export interface MailCleanerPreviewResult {
  matchedCount: number;
  eligibleCount: number;
  lockedProtectedCount: number;
  sampleSenders: string[];
  sampleSubjects: string[];
}

export interface MailCleanerExecuteResult {
  matchedCount: number;
  deletedCount: number;
  lockedProtectedCount: number;
}
