import { MailFolder, MailThread } from '../types/mail';
import { CalendarEvent } from '../types/calendar';
import { Contact } from '../types/contacts';
import { TaskItem } from '../types/tasks';

export const initialFolders: MailFolder[] = [
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', unreadCount: 3, totalCount: 42, system: true },
  { id: 'sent', name: 'Sent Items', icon: 'Send', unreadCount: 0, totalCount: 128, system: true },
  { id: 'drafts', name: 'Drafts', icon: 'FileText', unreadCount: 1, totalCount: 3, system: true },
  { id: 'archive', name: 'Archive', icon: 'Archive', unreadCount: 0, totalCount: 894, system: true },
  { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon', unreadCount: 4, totalCount: 12, system: true },
  { id: 'trash', name: 'Deleted Items', icon: 'Trash2', unreadCount: 0, totalCount: 19, system: true },
];

export const initialThreads: MailThread[] = [
  {
    id: 'th-1',
    folderId: 'inbox',
    subject: 'Q3 Enterprise Architecture & Wayland Linux Client Rollout',
    snippet: 'Hi team, please find attached the revised technical proposal for our enterprise Linux email client deployment...',
    participants: [
      { name: 'Elena Rostova', email: 'elena.rostova@enterprise.corp' },
      { name: 'DevOps Lead', email: 'alex.chen@enterprise.corp' }
    ],
    lastDate: '10:42 AM',
    messageCount: 3,
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    category: 'focused',
    messages: [
      {
        id: 'msg-101',
        threadId: 'th-1',
        senderName: 'Elena Rostova',
        senderEmail: 'elena.rostova@enterprise.corp',
        recipientNames: ['Touhidur Rahman', 'Engineering Core'],
        recipientEmails: ['touhidur@enterprise.corp', 'eng-core@enterprise.corp'],
        subject: 'Q3 Enterprise Architecture & Wayland Linux Client Rollout',
        snippet: 'Initial rollout plan and architectural milestones...',
        bodyHtml: `<p>Hello Touhidur,</p>
<p>We completed the architectural review for the upcoming Linux email client migration across all developer and finance workstations. The primary priorities remain:</p>
<ul>
  <li>Native Wayland and X11 compositor support without scaling artifacts.</li>
  <li>Hardware-backed credential isolation via GNOME Keyring & KWallet.</li>
  <li>Instant sub-5ms local search over millions of cached emails using SQLite FTS5.</li>
</ul>
<p>Please review the attached timeline and let us know your team's feedback before Thursday's executive sign-off.</p>
<p>Best regards,<br/><strong>Elena Rostova</strong><br/>VP of Enterprise Technology</p>`,
        date: 'Oct 21, 2026, 09:15 AM',
        isRead: true,
        isStarred: true,
        hasAttachments: true,
        folderId: 'inbox',
        category: 'focused',
        attachments: [
          { id: 'att-1', name: 'Linux_Architecture_Roadmap_2026.pdf', size: 2457600, mimeType: 'application/pdf', extension: 'pdf' },
          { id: 'att-2', name: 'Security_Compliance_Matrix.xlsx', size: 1048576, mimeType: 'application/vnd.ms-excel', extension: 'xlsx' }
        ]
      },
      {
        id: 'msg-102',
        threadId: 'th-1',
        senderName: 'Alex Chen',
        senderEmail: 'alex.chen@enterprise.corp',
        recipientNames: ['Elena Rostova', 'Touhidur Rahman'],
        recipientEmails: ['elena.rostova@enterprise.corp', 'touhidur@enterprise.corp'],
        subject: 'Re: Q3 Enterprise Architecture & Wayland Linux Client Rollout',
        snippet: 'Security team has cleared the libsecret credential storage module...',
        bodyHtml: `<p>Hi Elena & Touhidur,</p>
<p>The SecOps team has cleared the <code>libsecret</code> integration. The zero-trust OAuth 2.0 PKCE flow conforms with company policy. Benchmarks indicate that the local SQLite FTS5 index yields 1.8ms queries on 15GB mailboxes.</p>
<p>We are ready for canary testing.</p>
<p>Thanks,<br/>Alex Chen</p>`,
        date: 'Oct 21, 2026, 10:42 AM',
        isRead: false,
        isStarred: true,
        hasAttachments: false,
        folderId: 'inbox',
        category: 'focused'
      }
    ]
  },
  {
    id: 'th-2',
    folderId: 'inbox',
    subject: 'Executive Board Meeting: Quarterly Technology Forecast',
    snippet: 'The board prep packet has been finalized. Review slide deck 4 for cloud infrastructure projections...',
    participants: [
      { name: 'Sarah Sterling', email: 'sarah.sterling@enterprise.corp' }
    ],
    lastDate: 'Yesterday',
    messageCount: 1,
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    category: 'focused',
    messages: [
      {
        id: 'msg-201',
        threadId: 'th-2',
        senderName: 'Sarah Sterling',
        senderEmail: 'sarah.sterling@enterprise.corp',
        recipientNames: ['Executive Committee'],
        recipientEmails: ['exec@enterprise.corp'],
        subject: 'Executive Board Meeting: Quarterly Technology Forecast',
        snippet: 'The board prep packet has been finalized...',
        bodyHtml: `<p>Colleagues,</p>
<p>The agenda for tomorrow's Board of Directors meeting has been finalized. We will focus our session on our Linux ecosystem productivity gains and our consolidated mail infrastructure.</p>
<p>Please review slide 8 regarding cost reduction through custom local caching and reduced Exchange license overhead.</p>
<p>Warmly,<br/>Sarah Sterling<br/>Chief Operating Officer</p>`,
        date: 'Oct 20, 2026, 04:30 PM',
        isRead: false,
        isStarred: false,
        hasAttachments: true,
        folderId: 'inbox',
        category: 'focused',
        attachments: [
          { id: 'att-3', name: 'Q4_Board_Deck_Final.pdf', size: 8388608, mimeType: 'application/pdf', extension: 'pdf' }
        ]
      }
    ]
  },
  {
    id: 'th-3',
    folderId: 'inbox',
    subject: 'Security Alert: Quarterly Key Rotation & S/MIME Certificates',
    snippet: 'Reminder: Enterprise S/MIME encryption keys will be renewed automatically at midnight UTC...',
    participants: [
      { name: 'SecOps Automated Bot', email: 'secops-no-reply@enterprise.corp' }
    ],
    lastDate: 'Oct 19',
    messageCount: 1,
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    category: 'other',
    messages: [
      {
        id: 'msg-301',
        threadId: 'th-3',
        senderName: 'SecOps Automated Bot',
        senderEmail: 'secops-no-reply@enterprise.corp',
        recipientNames: ['All Employees'],
        recipientEmails: ['all@enterprise.corp'],
        subject: 'Security Alert: Quarterly Key Rotation & S/MIME Certificates',
        snippet: 'Reminder: Enterprise S/MIME encryption keys...',
        bodyHtml: `<p>All personnel,</p>
<p>This is an automated notification that cryptographic certificates for S/MIME signing and message encryption have been automatically synchronized with your workstation via PKCS#11 hardware tokens.</p>
<p>No manual action is required on your part.</p>`,
        date: 'Oct 19, 2026, 08:00 AM',
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        folderId: 'inbox',
        category: 'other'
      }
    ]
  }
];

export const initialEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Weekly Executive Technology Review',
    description: 'Weekly sync with engineering leadership regarding Linux client deployments and infrastructure.',
    location: 'Microsoft Teams / Room 402B',
    startTime: '2026-10-22T14:00:00.000Z',
    endTime: '2026-10-22T15:00:00.000Z',
    isAllDay: false,
    category: 'meeting',
    attendees: [
      { name: 'Elena Rostova', email: 'elena@enterprise.corp', rsvpStatus: 'accepted' },
      { name: 'Touhidur Rahman', email: 'touhidur@enterprise.corp', rsvpStatus: 'accepted' },
      { name: 'Alex Chen', email: 'alex@enterprise.corp', rsvpStatus: 'tentative' }
    ],
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/exec-tech-review'
  },
  {
    id: 'ev-2',
    title: 'Q4 Budget Allocation Finalization',
    description: 'Reviewing departmental expenditures and software license budgets.',
    location: 'Conference Hall A',
    startTime: '2026-10-23T16:00:00.000Z',
    endTime: '2026-10-23T17:30:00.000Z',
    isAllDay: false,
    category: 'work',
    attendees: [
      { name: 'Sarah Sterling', email: 'sarah@enterprise.corp', rsvpStatus: 'accepted' }
    ]
  }
];

export const initialContacts: Contact[] = [
  {
    id: 'cnt-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.corp',
    phone: '+1 (555) 349-8821',
    role: 'VP of Technology',
    department: 'Engineering',
    company: 'Enterprise Systems Global',
    avatarColor: '#0a84ff',
    isFavorite: true,
    notes: 'Primary sponsor for the Linux Workstation modernization project.'
  },
  {
    id: 'cnt-2',
    name: 'Alex Chen',
    email: 'alex.chen@enterprise.corp',
    phone: '+1 (555) 892-1200',
    role: 'Principal Security Architect',
    department: 'SecOps',
    company: 'Enterprise Systems Global',
    avatarColor: '#30d158',
    isFavorite: true,
    notes: 'Point of contact for S/MIME, GPG, and Secret Service keyring integrations.'
  },
  {
    id: 'cnt-3',
    name: 'Sarah Sterling',
    email: 'sarah.sterling@enterprise.corp',
    phone: '+1 (555) 124-7749',
    role: 'Chief Operating Officer',
    department: 'Executive Office',
    company: 'Enterprise Systems Global',
    avatarColor: '#bf5af2',
    isFavorite: false,
    notes: 'Direct report to CEO. Handles board presentations.'
  }
];

export const initialTasks: TaskItem[] = [
  {
    id: 'tsk-1',
    title: 'Review Wayland client packaging & AppImage spec',
    dueDate: 'Today',
    isCompleted: false,
    isImportant: true,
    category: 'work',
    linkedEmailId: 'th-1'
  },
  {
    id: 'tsk-2',
    title: 'Send feedback on Q4 Board presentation slides',
    dueDate: 'Tomorrow',
    isCompleted: false,
    isImportant: true,
    category: 'follow-up',
    linkedEmailId: 'th-2'
  },
  {
    id: 'tsk-3',
    title: 'Verify SQLite FTS5 search index benchmarking report',
    dueDate: 'Oct 25',
    isCompleted: true,
    isImportant: false,
    category: 'work'
  }
];

export const emptyFolders: MailFolder[] = [
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', unreadCount: 0, totalCount: 0, system: true },
  { id: 'sent', name: 'Sent Items', icon: 'Send', unreadCount: 0, totalCount: 0, system: true },
  { id: 'drafts', name: 'Drafts', icon: 'FileText', unreadCount: 0, totalCount: 0, system: true },
  { id: 'archive', name: 'Archive', icon: 'Archive', unreadCount: 0, totalCount: 0, system: true },
  { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon', unreadCount: 0, totalCount: 0, system: true },
  { id: 'trash', name: 'Deleted Items', icon: 'Trash2', unreadCount: 0, totalCount: 0, system: true },
];

export function getInitialData(withSeed: boolean = true) {
  return {
    folders: withSeed ? initialFolders : emptyFolders,
    threads: withSeed ? initialThreads : [],
    events: withSeed ? initialEvents : [],
    contacts: withSeed ? initialContacts : [],
    tasks: withSeed ? initialTasks : [],
  };
}
