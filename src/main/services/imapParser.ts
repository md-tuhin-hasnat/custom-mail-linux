/**
 * imapParser.ts
 * Low-level RFC3501 IMAP response parser.
 * Parses LIST responses into user-friendly MailFolders, extracts envelope tokens
 * (UID, X-GM-THRID, X-GM-LABELS, FLAGS, ENVELOPE, BODYSTRUCTURE), and maps them into MailMessage structures.
 */

import { MailFolder, MailMessage, Attachment } from '../../types/mail';

export interface ParsedImapEnvelope {
  threadId: string;
  uid: string;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string[];
  subject: string;
  senderName: string;
  senderEmail: string;
  dateStr: string;
  hasAttachments: boolean;
  attachments?: Attachment[];
}

export function parseImapFolders(listLines: string[]): MailFolder[] {
  const folders: MailFolder[] = [];
  const systemMap: Record<string, { id: string; name: string; icon: string }> = {
    inbox: { id: 'inbox', name: 'Inbox', icon: 'Inbox' },
    '[gmail]/sent mail': { id: 'sent', name: 'Sent Items', icon: 'Send' },
    sent: { id: 'sent', name: 'Sent Items', icon: 'Send' },
    '[gmail]/drafts': { id: 'drafts', name: 'Drafts', icon: 'FileText' },
    drafts: { id: 'drafts', name: 'Drafts', icon: 'FileText' },
    outbox: { id: 'outbox', name: 'Outbox', icon: 'SendHorizontal' },
    '[gmail]/all mail': { id: 'archive', name: 'Archive', icon: 'Archive' },
    archive: { id: 'archive', name: 'Archive', icon: 'Archive' },
    '[gmail]/spam': { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon' },
    junk: { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon' },
    spam: { id: 'junk', name: 'Junk Email', icon: 'AlertOctagon' },
    '[gmail]/trash': { id: 'trash', name: 'Deleted Items', icon: 'Trash2' },
    trash: { id: 'trash', name: 'Deleted Items', icon: 'Trash2' },
  };

  for (const line of listLines) {
    const match = line.match(/^\*\s+LIST\s+\((.*?)\)\s+"([^"]*)"\s+"?([^"\r\n]+)"?/i);
    if (!match) continue;

    const flags = match[1];
    const rawName = match[3].trim();
    const lower = rawName.toLowerCase();

    if (flags.includes('\\Noselect')) continue;

    const sys = systemMap[lower];
    if (sys) {
      folders.push({
        id: sys.id,
        name: sys.name,
        icon: sys.icon,
        unreadCount: 0,
        totalCount: 0,
        system: true,
      });
    } else if (!lower.startsWith('[gmail]')) {
      folders.push({
        id: rawName,
        name: rawName,
        icon: 'Folder',
        unreadCount: 0,
        totalCount: 0,
        system: false,
      });
    }
  }

  if (!folders.some((f) => f.id === 'outbox')) {
    folders.push({
      id: 'outbox',
      name: 'Outbox',
      icon: 'SendHorizontal',
      unreadCount: 0,
      totalCount: 0,
      system: true,
    });
  }

  return folders;
}

export function parseImapEnvelopeLine(str: string): ParsedImapEnvelope | null {
  const thridMatch = str.match(/X-GM-THRID\s+(\d+)/);
  const uidMatch = str.match(/UID\s+(\d+)/);
  if (!uidMatch) return null;

  const uid = uidMatch[1];
  const threadId = thridMatch ? thridMatch[1] : uid;

  const flagsMatch = str.match(/FLAGS\s+\(([^)]*)\)/);
  const flagsStr = flagsMatch ? flagsMatch[1] : '';
  const isRead = flagsStr.includes('\\Seen');
  const isStarred = flagsStr.includes('\\Flagged');

  const labelsMatch = str.match(/X-GM-LABELS\s+\(([^)]*)\)/);
  let labelIds: string[] = [];
  if (labelsMatch && labelsMatch[1]) {
    const rawLabels = labelsMatch[1].match(/"([^"]+)"|(\S+)/g) || [];
    labelIds = rawLabels.map((l) => l.replace(/^["\s\\]+|["\s\\]+$/g, ''));
  }

  let subject = '(No Subject)';
  let senderName = 'Sender';
  let senderEmail = 'sender@domain.com';
  let dateStr = 'Recent';

  const envIndex = str.indexOf('ENVELOPE (');
  if (envIndex !== -1) {
    const envSub = str.slice(envIndex + 10);
    const tokens: string[] = [];
    let cur = '';
    let inQuote = false;
    let inParen = 0;

    for (let i = 0; i < envSub.length; i++) {
      const c = envSub[i];
      if (c === '"' && envSub[i - 1] !== '\\') {
        inQuote = !inQuote;
      } else if (!inQuote && c === '(') {
        inParen++;
        if (inParen === 2) {
          let senderChunk = '';
          i++;
          while (i < envSub.length && envSub[i] !== ')') {
            senderChunk += envSub[i];
            i++;
          }
          const sTokens = senderChunk.match(/"([^"]*)"|NIL/g) || [];
          if (sTokens[0] && sTokens[0] !== 'NIL') senderName = sTokens[0].replace(/^"|"$/g, '');
          const u = sTokens[2] && sTokens[2] !== 'NIL' ? sTokens[2].replace(/^"|"$/g, '') : '';
          const h = sTokens[3] && sTokens[3] !== 'NIL' ? sTokens[3].replace(/^"|"$/g, '') : '';
          if (u && h) senderEmail = `${u}@${h}`;
          if (!senderName || senderName === 'NIL') senderName = senderEmail;
          break;
        }
      } else if (!inQuote && inParen === 0 && c === ' ') {
        if (cur) {
          tokens.push(cur.replace(/^"|"$/g, ''));
          cur = '';
        }
      } else if (inParen === 0) {
        cur += c;
      }
    }
    if (tokens[0]) dateStr = tokens[0];
    if (tokens[1]) subject = cleanEmailSubject(tokens[1]);
  }

  // Detect attachments from IMAP BODYSTRUCTURE
  const hasAttachmentMatch = /BODYSTRUCTURE\s+\(.*?(?:"attachment"|"filename"|"name"|"APPLICATION"|"IMAGE"|"OCTET-STREAM")/i.test(str);
  const filenameMatches = Array.from(str.matchAll(/(?:"FILENAME"|"NAME")\s+"([^"]+)"/gi));
  const attachments: Attachment[] = [];
  const seenNames = new Set<string>();

  for (const m of filenameMatches) {
    const rawName = cleanEmailSubject(m[1]);
    if (!rawName || seenNames.has(rawName)) continue;
    seenNames.add(rawName);
    const ext = rawName.includes('.') ? rawName.split('.').pop()?.toLowerCase() || '' : '';
    attachments.push({
      id: `att-${uid}-${attachments.length}`,
      name: rawName,
      size: 1024 * 75,
      mimeType: ext === 'pdf' ? 'application/pdf' : ext.match(/png|jpg|jpeg|gif/i) ? `image/${ext}` : 'application/octet-stream',
      extension: ext,
    });
  }

  const hasAttachments = hasAttachmentMatch || attachments.length > 0;

  return {
    threadId,
    uid,
    isRead,
    isStarred,
    labelIds,
    subject: cleanEmailSubject(subject),
    senderName: cleanEmailSubject(senderName),
    senderEmail,
    dateStr,
    hasAttachments,
    attachments,
  };
}

export function cleanEmailSubject(raw: string): string {
  if (!raw) return '(No Subject)';
  let cleaned = raw.trim();

  // Decode MIME encoded-words: =?charset?B|Q?encoded_text?=
  cleaned = cleaned.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, data) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(data, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'latin1');
      } else if (encoding.toUpperCase() === 'Q') {
        return data
          .replace(/_/g, ' ')
          .replace(/=([0-9A-Fa-f]{2})/g, (__: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
          );
      }
    } catch {
      return data;
    }
    return data;
  });

  // Remove IMAP escape slashes: \" -> " and \\ -> \
  cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return cleaned;
}

export function envelopeToMailMessage(env: ParsedImapEnvelope): MailMessage {
  const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();
  const hasLabel = (name: string) =>
    env.labelIds.some((l) => {
      const nl = norm(l);
      return nl === name || nl.includes(name);
    });

  let folderId = 'archive';
  if (hasLabel('trash') || hasLabel('bin')) folderId = 'trash';
  else if (hasLabel('spam') || hasLabel('junk')) folderId = 'junk';
  else if (hasLabel('draft')) folderId = 'drafts';
  else if (hasLabel('sent')) folderId = 'sent';
  else if (hasLabel('outbox')) folderId = 'outbox';
  else if (hasLabel('inbox')) folderId = 'inbox';

  return {
    id: `msg-gmail-${env.uid}`,
    threadId: `th-gmail-${env.threadId}`,
    senderName: env.senderName,
    senderEmail: env.senderEmail,
    recipientNames: ['Me'],
    recipientEmails: ['me'],
    subject: env.subject,
    snippet: env.subject,
    bodyHtml: `<p><strong>${env.subject}</strong></p><p>From: ${env.senderName} &lt;${env.senderEmail}&gt;</p><p>Date: ${env.dateStr}</p>`,
    date: env.dateStr,
    isRead: env.isRead,
    isStarred: env.isStarred,
    hasAttachments: env.hasAttachments,
    attachments: env.attachments || [],
    folderId,
    category: env.labelIds.includes('Promotions') || env.labelIds.includes('Updates') ? 'other' : 'focused',
    labelIds: env.labelIds,
  };
}
