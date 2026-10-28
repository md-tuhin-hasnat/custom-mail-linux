/**
 * MessengerChatBubble Component
 * 
 * Renders an individual message within an email thread as a messenger chat bubble.
 * Right-aligned for outgoing messages ("You") and left-aligned for incoming messages,
 * with smart historical quote extraction and collapsible history disclosure.
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Reply, Star } from 'lucide-react';
import { MailMessage, Attachment } from '@/types/mail';
import { splitMessageBody } from '@/utils/messageQuoteParser';
import { sanitizeEmailHtml } from '@/utils/sanitizeHtml';
import { AttachmentList } from '@/components/mail/AttachmentList/AttachmentList';
import styles from './MessengerChatBubble.module.css';

export interface MessengerChatBubbleProps {
  message: MailMessage;
  activeAccountEmail?: string;
  onReply?: () => void;
  onPreviewAttachment?: (att: Attachment, all: Attachment[], msgId: string) => void;
  accountId?: string;
}

export const MessengerChatBubble = React.memo(function MessengerChatBubble({
  message,
  activeAccountEmail,
  onReply,
  onPreviewAttachment,
  accountId,
}: MessengerChatBubbleProps) {
  const [showQuoted, setShowQuoted] = useState(false);

  const isMe = useMemo(() => {
    if (!activeAccountEmail) {
      return message.folderId === 'sent' || message.senderName.toLowerCase() === 'me';
    }
    const cleanActive = activeAccountEmail.toLowerCase().trim();
    const cleanSender = message.senderEmail.toLowerCase().trim();
    return cleanSender === cleanActive || message.folderId === 'sent';
  }, [message.senderEmail, message.folderId, message.senderName, activeAccountEmail]);

  const initials = useMemo(() => {
    if (isMe) return 'You';
    const name = message.senderName || message.senderEmail || '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [isMe, message.senderName, message.senderEmail]);

  const { directContent, quotedContent } = useMemo(() => {
    return splitMessageBody(message.bodyHtml);
  }, [message.bodyHtml]);

  const cleanDirectHtml = useMemo(() => {
    return sanitizeEmailHtml(directContent, { allowImages: true });
  }, [directContent]);

  const cleanQuotedHtml = useMemo(() => {
    if (!quotedContent) return '';
    return sanitizeEmailHtml(quotedContent, { allowImages: true });
  }, [quotedContent]);

  return (
    <div className={`${styles.row} ${isMe ? styles.me : styles.other}`}>
      <div
        className={`${styles.avatar} ${isMe ? styles.meAvatar : styles.otherAvatar}`}
        title={message.senderName || message.senderEmail}
      >
        {initials}
      </div>

      <div className={styles.bubbleWrapper}>
        <div className={styles.metaHeader}>
          <span className={styles.senderName}>{isMe ? 'You' : message.senderName}</span>
          {!isMe && message.senderEmail ? (
            <span className={styles.senderEmail}>&lt;{message.senderEmail}&gt;</span>
          ) : null}
          <span className={styles.timestamp}>{message.date}</span>
        </div>

        <div className={styles.bubble}>
          <div
            className={styles.bodyContent}
            dangerouslySetInnerHTML={{ __html: cleanDirectHtml }}
          />

          {quotedContent ? (
            <div>
              <button
                type="button"
                className={styles.quoteToggleBtn}
                onClick={() => setShowQuoted((prev) => !prev)}
              >
                {showQuoted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>{showQuoted ? 'Hide previous email history' : 'Show quoted reply text'}</span>
              </button>

              {showQuoted ? (
                <div
                  className={styles.quotedArea}
                  dangerouslySetInnerHTML={{ __html: cleanQuotedHtml }}
                />
              ) : null}
            </div>
          ) : null}

          {message.attachments && message.attachments.length > 0 ? (
            <AttachmentList
              attachments={message.attachments}
              messageId={message.id}
              accountId={accountId}
              onPreviewAttachment={
                onPreviewAttachment
                  ? (att, all) => onPreviewAttachment(att, all, message.id)
                  : undefined
              }
            />
          ) : null}

          <div className={styles.bubbleFooter}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={onReply}
              title="Reply to this message"
            >
              <Reply size={12} />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
