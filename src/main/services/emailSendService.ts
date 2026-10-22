/**
 * emailSendService.ts
 * 
 * Handles constructing RFC 2822 MIME email messages with UTF-8 encoding,
 * multipart alternative/mixed boundary support for HTML and attachments,
 * and dispatching emails directly via the Gmail REST API (or SMTP fallback).
 */

import { AccountConfig } from '../../types/account';
import { MailMessage, MailThread, Attachment } from '../../types/mail';
import { StorageService } from './storageService';
import { refreshGoogleToken } from './googleAuth';

export interface SendMailParams {
  draft: Partial<MailMessage> & {
    cc?: string;
    bcc?: string;
    attachments?: Array<{
      id: string;
      name: string;
      size: number;
      contentBase64?: string;
      mimeType?: string;
    }>;
  };
  accountId?: string;
  storage: StorageService;
}

export interface SendMailResult {
  success: boolean;
  id?: string;
  threadId?: string;
  error?: string;
}

/**
 * Constructs an RFC 2822 compliant MIME email string.
 */
export function buildMimeMessage({
  fromName,
  fromEmail,
  to,
  cc,
  bcc,
  subject,
  bodyHtml,
  attachments,
}: {
  fromName: string;
  fromEmail: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: Array<{ name: string; contentBase64?: string; mimeType?: string }>;
}): string {
  const boundary = `===boundary_${Date.now()}_${Math.random().toString(36).slice(2)}===`;
  const fromHeader = fromName ? `"${fromName.replace(/"/g, '')}" <${fromEmail}>` : fromEmail;
  const domain = fromEmail.split('@')[1] || 'custommail.local';

  const headers: string[] = [
    `From: ${fromHeader}`,
    `To: ${to.join(', ')}`,
  ];

  if (cc && cc.length > 0) headers.push(`Cc: ${cc.join(', ')}`);
  if (bcc && bcc.length > 0) headers.push(`Bcc: ${bcc.join(', ')}`);

  // RFC 2047 encoded subject
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || '(No Subject)', 'utf-8').toString('base64')}?=`;
  headers.push(`Subject: ${encodedSubject}`);
  headers.push(`Date: ${new Date().toUTCString()}`);
  headers.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`);
  headers.push(`MIME-Version: 1.0`);

  const validAttachments = (attachments || []).filter((a) => Boolean(a.contentBase64));

  if (validAttachments.length === 0) {
    headers.push(`Content-Type: text/html; charset=UTF-8`);
    headers.push(`Content-Transfer-Encoding: base64`);
    return `${headers.join('\r\n')}\r\n\r\n${Buffer.from(bodyHtml, 'utf-8').toString('base64')}`;
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  let message = headers.join('\r\n') + '\r\n\r\n';

  // Body part
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset=UTF-8\r\n`;
  message += `Content-Transfer-Encoding: base64\r\n\r\n`;
  message += Buffer.from(bodyHtml, 'utf-8').toString('base64') + '\r\n\r\n';

  // Attachment parts
  for (const att of validAttachments) {
    const mime = att.mimeType || 'application/octet-stream';
    message += `--${boundary}\r\n`;
    message += `Content-Type: ${mime}; name="${att.name}"\r\n`;
    message += `Content-Disposition: attachment; filename="${att.name}"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n\r\n`;
    message += `${att.contentBase64}\r\n\r\n`;
  }

  message += `--${boundary}--\r\n`;
  return message;
}

/**
 * Sends email via Gmail REST API or records local sent message for offline/demo accounts.
 */
export async function sendEmailMessage({
  draft,
  accountId,
  storage,
}: SendMailParams): Promise<SendMailResult> {
  const accounts = storage.getAccounts();
  const id = accountId || storage.getActiveAccountId() || accounts[0]?.id || 'acc-primary-1';
  const currentAccount = accounts.find((a) => a.id === id);

  const senderEmail = currentAccount?.email || 'me@corp.com';
  const senderName = currentAccount?.name || 'Me';
  const recipients = draft.recipientEmails || ['recipient@corp.com'];
  const ccList = draft.cc ? draft.cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const bccList = draft.bcc ? draft.bcc.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const subject = draft.subject || '(No Subject)';
  const bodyHtml = draft.bodyHtml || '<p></p>';

  let remoteMessageId: string | undefined;
  let remoteThreadId: string | undefined;

  // Real Google Workspace / Gmail API transmission
  if (currentAccount?.type === 'google' && currentAccount.oauth?.refreshToken) {
    const token = await refreshGoogleToken(currentAccount, (acc) => storage.saveAccount(acc));

    if (!token) {
      return { success: false, error: 'Google authentication expired. Please reconnect your account.' };
    }

    const mimeMessage = buildMimeMessage({
      fromName: senderName,
      fromEmail: senderEmail,
      to: recipients,
      cc: ccList,
      bcc: bccList,
      subject,
      bodyHtml,
      attachments: draft.attachments,
    });

    const base64UrlRaw = Buffer.from(mimeMessage, 'utf-8').toString('base64url');

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64UrlRaw }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Gmail API HTTP ${response.status}`;
        console.error('Failed to send mail via Gmail API:', errorMsg);
        return { success: false, error: errorMsg };
      }

      remoteMessageId = data.id;
      remoteThreadId = data.threadId;
      console.log(`[EmailSendService] Successfully dispatched message ${remoteMessageId} via Gmail API.`);
    } catch (err: any) {
      console.error('Network error dispatching mail via Gmail API:', err);
      return { success: false, error: err?.message || 'Network error sending email' };
    }
  }

  // Persist sent message in local account store
  const data = storage.getAccountData(id);
  const newMsgId = remoteMessageId || `msg-${Date.now()}`;
  const newThreadId = remoteThreadId ? `th-gmail-${remoteThreadId}` : `th-${Date.now()}`;

  const finalAttachments: Attachment[] = (draft.attachments || []).map((a) => ({
    id: a.id,
    name: a.name,
    size: a.size,
    mimeType: a.mimeType || 'application/octet-stream',
    extension: a.name.split('.').pop() || '',
  }));

  const newMsg: MailMessage = {
    id: newMsgId,
    threadId: newThreadId,
    senderName,
    senderEmail,
    recipientNames: draft.recipientNames || recipients,
    recipientEmails: recipients,
    subject,
    snippet: draft.snippet || bodyHtml.replace(/<[^>]+>/g, '').slice(0, 100),
    bodyHtml,
    date: 'Just now',
    isRead: true,
    isStarred: false,
    hasAttachments: finalAttachments.length > 0,
    folderId: 'sent',
    labelIds: ['SENT', 'sent', '[Gmail]/Sent Mail'],
    category: 'focused',
    attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
  };

  const newThread: MailThread = {
    id: newThreadId,
    folderId: 'sent',
    labelIds: ['SENT', 'sent', '[Gmail]/Sent Mail'],
    subject,
    snippet: newMsg.snippet,
    participants: [
      { name: senderName, email: senderEmail },
      { name: recipients[0], email: recipients[0] },
    ],
    lastDate: 'Just now',
    messageCount: 1,
    isRead: true,
    isStarred: false,
    hasAttachments: newMsg.hasAttachments,
    category: 'focused',
    messages: [newMsg],
  };

  data.threads = [newThread, ...data.threads];

  // Update Sent folder message counts
  const sentFolder = data.folders.find((f) => f.id === 'sent' || f.id.toLowerCase().includes('sent'));
  if (sentFolder) {
    sentFolder.totalCount = (sentFolder.totalCount || 0) + 1;
  }

  storage.saveAccountData(id, data);

  return {
    success: true,
    id: newThread.id,
    threadId: newThread.id,
  };
}
