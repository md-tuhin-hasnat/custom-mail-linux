/**
 * gmailParser.ts
 * Parser utilities for decoding Gmail and IMAP MIME structures.
 * Extracts headers, participants, snippet preview, HTML/plain-text bodies, attachment metadata,
 * groups messages into threads, and applies tombstone filtering so deleted messages never resurface.
 */

import { MailMessage, MailThread, Attachment } from '../../types/mail';

export interface GmailMessagePayload {
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: Array<{
    mimeType: string;
    filename?: string;
    body?: { data?: string; size?: number; attachmentId?: string };
    parts?: any[];
  }>;
}

export interface GmailMessageResponse {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: GmailMessagePayload;
  internalDate?: string;
  labelIds?: string[];
}

export function decodeBase64Url(data?: string): string {
  if (!data) return '';
  try {
    return Buffer.from(data, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

export function extractAttachments(parts?: any[], messageId?: string): Attachment[] {
  if (!parts) return [];
  const attachments: Attachment[] = [];
  const seenIds = new Set<string>();

  function walk(partList: any[]) {
    for (const part of partList) {
      if (part.filename && part.filename.trim().length > 0) {
        const id = part.body?.attachmentId || `att-${attachments.length}-${part.filename}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          const ext = part.filename.includes('.') ? part.filename.split('.').pop()?.toLowerCase() || '' : '';
          attachments.push({
            id,
            name: part.filename,
            size: part.body?.size || 1024 * 50,
            mimeType: part.mimeType || 'application/octet-stream',
            extension: ext,
            messageId,
          });
        }
      }
      if (part.parts && Array.isArray(part.parts)) {
        walk(part.parts);
      }
    }
  }

  walk(parts);
  return attachments;
}

export function extractBody(payload?: GmailMessagePayload): string {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64Url(payload.body.data);

  let htmlBody = '';
  let textBody = '';

  function findParts(parts?: any[]) {
    if (!parts || !Array.isArray(parts)) return;
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data && !htmlBody) {
        htmlBody = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/plain' && part.body?.data && !textBody) {
        textBody = decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        findParts(part.parts);
      }
    }
  }

  if (payload.parts) {
    findParts(payload.parts);
  }

  if (htmlBody) return htmlBody;
  if (textBody) {
    const formatted = textBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
    return `<div style="white-space: pre-wrap; line-height: 1.6;">${formatted}</div>`;
  }
  return '';
}

export function parseGmailMessage(msg: GmailMessageResponse): MailMessage {
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const from = getHeader('From') || 'Google Sender';
  const subject = getHeader('Subject') || '(No Subject)';
  const dateStr = getHeader('Date') || new Date(Number(msg.internalDate || Date.now())).toLocaleDateString();

  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  const senderName = match ? match[1].replace(/^["']|["']$/g, '') : from;
  const senderEmail = match ? match[2] : from;
  const fallbackSnippet = (msg.snippet || subject || '').replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>');
  const bodyHtml = extractBody(msg.payload) || `<p style="white-space: pre-wrap;">${fallbackSnippet}</p>`;
  const isRead = !msg.labelIds?.includes('UNREAD');
  const isStarred = Boolean(msg.labelIds?.includes('STARRED'));

  const attachments = extractAttachments(msg.payload?.parts, msg.id);
  const hasAttachments =
    attachments.length > 0 ||
    Boolean(
      msg.payload?.parts?.some(
        (p) => p.mimeType !== 'text/plain' && p.mimeType !== 'text/html' && !p.mimeType.startsWith('multipart/')
      )
    );

  let folderId = 'inbox';
  if (msg.labelIds?.includes('SENT')) folderId = 'sent';
  else if (msg.labelIds?.includes('DRAFT')) folderId = 'drafts';
  else if (msg.labelIds?.includes('TRASH')) folderId = 'trash';
  else if (msg.labelIds?.includes('SPAM')) folderId = 'junk';
  else if (!msg.labelIds?.includes('INBOX')) folderId = 'archive';

  return {
    id: `msg-gmail-${msg.id}`,
    threadId: `th-gmail-${msg.threadId}`,
    senderName,
    senderEmail,
    recipientNames: ['Me'],
    recipientEmails: ['me'],
    subject,
    snippet: msg.snippet || '',
    bodyHtml,
    date: dateStr,
    isRead,
    isStarred,
    hasAttachments,
    attachments,
    folderId,
    category: msg.labelIds?.includes('CATEGORY_PROMOTIONS') || msg.labelIds?.includes('CATEGORY_UPDATES') ? 'other' : 'focused',
    labelIds: msg.labelIds || [],
  };
}

export function groupMessagesIntoThreads(
  messages: MailMessage[],
  existingThreads: MailThread[] = [],
  deletedThreadIds: string[] = [],
  deletedMessageIds: string[] = []
): MailThread[] {
  const deletedThreadSet = new Set(deletedThreadIds);
  const deletedMessageSet = new Set(deletedMessageIds);
  const threadMap = new Map<string, MailThread>();

  for (const t of existingThreads) {
    if (deletedThreadSet.has(t.id)) continue;
    threadMap.set(t.id, {
      ...t,
      participants: [...t.participants],
      labelIds: t.labelIds ? [...t.labelIds] : [],
      messages: t.messages.filter((m) => !deletedMessageSet.has(m.id)),
    });
  }

  for (const newMsg of messages) {
    // If message or thread was deleted, strictly discard it so sync will NEVER resurrect it
    if (deletedThreadSet.has(newMsg.threadId) || deletedMessageSet.has(newMsg.id)) {
      continue;
    }

    const existing = threadMap.get(newMsg.threadId);
    if (existing) {
      if (!existing.messages.some((m) => m.id === newMsg.id)) {
        existing.messages.push(newMsg);
        existing.messageCount = existing.messages.length;
      }
      if (!newMsg.isRead) existing.isRead = false;
      if (newMsg.isStarred) existing.isStarred = true;
      if (newMsg.hasAttachments) existing.hasAttachments = true;

      // Never revert trash back to inbox
      if (existing.folderId !== 'trash') {
        if (newMsg.folderId === 'inbox') existing.folderId = 'inbox';
        if (newMsg.labelIds) {
          const mergedLabels = new Set([...(existing.labelIds || []), ...newMsg.labelIds]);
          existing.labelIds = Array.from(mergedLabels);
          if (existing.labelIds.some((l) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase() === 'inbox')) {
            existing.folderId = 'inbox';
          }
        }
      }

      if (!existing.participants.some((p) => p.email === newMsg.senderEmail)) {
        existing.participants.push({ name: newMsg.senderName, email: newMsg.senderEmail });
      }
    } else {
      const isInbox =
        newMsg.folderId === 'inbox' ||
        newMsg.labelIds?.some((l) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase() === 'inbox');

      threadMap.set(newMsg.threadId, {
        id: newMsg.threadId,
        folderId: isInbox ? 'inbox' : newMsg.folderId,
        subject: newMsg.subject,
        snippet: newMsg.snippet,
        participants: [{ name: newMsg.senderName, email: newMsg.senderEmail }],
        lastDate: newMsg.date,
        messageCount: 1,
        isRead: newMsg.isRead,
        isStarred: newMsg.isStarred,
        hasAttachments: newMsg.hasAttachments,
        category: newMsg.category,
        labelIds: newMsg.labelIds ? [...newMsg.labelIds] : [],
        messages: [newMsg],
      });
    }
  }

  return Array.from(threadMap.values());
}
