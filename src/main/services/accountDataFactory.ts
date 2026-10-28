/**
 * accountDataFactory.ts
 * Factory for creating initial empty or welcome data stores for newly authenticated accounts.
 * Generates default system folders (Inbox, Sent, Drafts, Archive, Junk, Trash), welcome threads,
 * and default productivity collections.
 */

import { AccountConfig } from '../../types/account';
import { MailFolder, MailThread, MailMessage } from '../../types/mail';
import { CalendarEvent } from '../../types/calendar';
import { Contact } from '../../types/contacts';
import { TaskItem } from '../../types/tasks';
import { AccountDataStore } from './storageService';

export function createInitialAccountData(account?: AccountConfig): AccountDataStore {
  const userName = account?.name || 'Enterprise User';
  const userEmail = account?.email || 'user@domain.corp';
  const providerType = account?.type || 'google';

  const defaultFolders: MailFolder[] = [
    { id: 'inbox', name: 'Inbox', icon: 'Inbox', unreadCount: 1, totalCount: 1, system: true },
    { id: 'sent', name: 'Sent Items', icon: 'Send', unreadCount: 0, totalCount: 0, system: true },
    { id: 'drafts', name: 'Drafts', icon: 'FileText', unreadCount: 0, totalCount: 0, system: true },
    { id: 'outbox', name: 'Outbox', icon: 'SendHorizontal', unreadCount: 0, totalCount: 0, system: true },
    { id: 'archive', name: 'Archive', icon: 'Archive', unreadCount: 0, totalCount: 0, system: true },
    { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon', unreadCount: 0, totalCount: 0, system: true },
    { id: 'trash', name: 'Deleted Items', icon: 'Trash2', unreadCount: 0, totalCount: 0, system: true },
  ];

  const welcomeMsg: MailMessage = {
    id: `msg-welcome-${Date.now()}`,
    threadId: `th-welcome-${Date.now()}`,
    senderName: 'Custom Mail Team',
    senderEmail: 'welcome@custom-mail.internal',
    recipientNames: [userName],
    recipientEmails: [userEmail],
    subject: `Welcome ${userName} - Your ${providerType.toUpperCase()} Account is Connected`,
    snippet: `Your email account ${userEmail} is successfully connected with secure desktop authentication...`,
    bodyHtml: `
      <h2>Welcome to Custom Mail Linux</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your <strong>${providerType.toUpperCase()}</strong> account (<code>${userEmail}</code>) is securely connected to Custom Mail Linux.</p>
      <h3>⚡ Features Ready to Use:</h3>
      <ul>
        <li><strong>Unified Offline Storage:</strong> Your emails and drafts are cached locally on Linux with hardware-level encryption.</li>
        <li><strong>Hardware Keyring:</strong> Credentials and OAuth refresh tokens are secured via FreeDesktop Secret Service.</li>
        <li><strong>Calendar & Tasks:</strong> Create and manage schedules and action items seamlessly.</li>
      </ul>
      <h3>💡 Live Cloud Synchronization:</h3>
      <p>If you're using Google Workspace, ensure you have enabled the <strong>Gmail API</strong> in your Google Cloud Console to sync live inbox messages automatically.</p>
      <p>Best regards,<br/><strong>Custom Mail Linux Team</strong></p>
    `,
    date: 'Just now',
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    folderId: 'inbox',
    category: 'focused',
  };

  const welcomeThread: MailThread = {
    id: welcomeMsg.threadId,
    folderId: 'inbox',
    subject: welcomeMsg.subject,
    snippet: welcomeMsg.snippet,
    participants: [
      { name: 'Custom Mail Team', email: 'welcome@custom-mail.internal' },
      { name: userName, email: userEmail },
    ],
    lastDate: 'Just now',
    messageCount: 1,
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    category: 'focused',
    messages: [welcomeMsg],
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const initialEvents: CalendarEvent[] = [
    {
      id: `evt-1-${Date.now()}`,
      title: 'Welcome Tour & Client Overview',
      startTime: `${todayStr}T10:00:00.000Z`,
      endTime: `${todayStr}T10:30:00.000Z`,
      isAllDay: false,
      location: 'Custom Mail Desktop',
      category: 'work',
      attendees: [{ name: userName, email: userEmail, rsvpStatus: 'accepted' }],
    },
    {
      id: `evt-2-${Date.now()}`,
      title: 'Weekly Roadmap Sync',
      startTime: `${todayStr}T14:00:00.000Z`,
      endTime: `${todayStr}T15:00:00.000Z`,
      isAllDay: false,
      location: 'Meeting Room 4B',
      category: 'work',
      attendees: [{ name: userName, email: userEmail, rsvpStatus: 'accepted' }],
    },
  ];

  const initialTasks: TaskItem[] = [
    {
      id: `tsk-1-${Date.now()}`,
      title: 'Enable Gmail API in Google Cloud Console for live sync',
      dueDate: 'Today',
      isCompleted: false,
      isImportant: true,
      category: 'work',
    },
    {
      id: `tsk-2-${Date.now()}`,
      title: 'Try sending a test email from the Composer',
      dueDate: 'Today',
      isCompleted: false,
      isImportant: false,
      category: 'work',
    },
    {
      id: `tsk-3-${Date.now()}`,
      title: 'Customize notification sounds and Wayland shortcuts',
      dueDate: 'Tomorrow',
      isCompleted: true,
      isImportant: false,
      category: 'personal',
    },
  ];

  const initialContacts: Contact[] = [
    {
      id: `cnt-1-${Date.now()}`,
      name: 'Elena Rostova',
      email: 'elena.rostova@enterprise.corp',
      role: 'VP of Technology',
      department: 'Executive',
      avatarColor: '#5856d6',
      isFavorite: true,
    },
    {
      id: `cnt-2-${Date.now()}`,
      name: 'Alex Chen',
      email: 'alex.chen@enterprise.corp',
      role: 'Lead Infrastructure Engineer',
      department: 'Engineering',
      avatarColor: '#34c759',
      isFavorite: false,
    },
  ];

  return {
    folders: defaultFolders,
    threads: [welcomeThread],
    events: initialEvents,
    contacts: initialContacts,
    tasks: initialTasks,
  };
}
