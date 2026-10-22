import React from 'react';
import { Star, Paperclip, Check, Lock } from 'lucide-react';
import { MailThread } from '@/types/mail';
import styles from './ThreadCard.module.css';

interface ThreadCardProps {
  thread: MailThread;
  isSelected: boolean;
  isChecked?: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onToggleCheck?: (id: string) => void;
}

export const ThreadCard = React.memo(function ThreadCard({
  thread,
  isSelected,
  isChecked = false,
  onSelect,
  onToggleStar,
  onToggleLock,
  onToggleCheck,
}: ThreadCardProps) {
  const senderDisplay = thread.participants.map((p) => p.name).join(', ') || 'Unknown Sender';

  const handleStarClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleStar(thread.id);
    },
    [onToggleStar, thread.id]
  );

  const handleLockClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleLock?.(thread.id);
    },
    [onToggleLock, thread.id]
  );

  const handleCheckClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCheck?.(thread.id);
    },
    [onToggleCheck, thread.id]
  );

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(thread.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(thread.id);
        }
      }}
    >
      <div className={styles.indicatorArea}>
        <button
          type="button"
          className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}
          onClick={handleCheckClick}
          aria-label={isChecked ? 'Deselect conversation' : 'Select conversation'}
          title={isChecked ? 'Deselect' : 'Select'}
        >
          {isChecked ? <Check size={11} strokeWidth={3} /> : null}
        </button>
        {!isChecked ? (
          <div className={styles.unreadDot} style={{ opacity: thread.isRead ? 0 : 1 }} />
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span
            className={`${styles.senderName} ${!thread.isRead ? styles.unreadSender : ''}`}
          >
            {senderDisplay}
          </span>
          <span className={styles.date}>{thread.lastDate}</span>
        </div>

        <div className={styles.subjectRow}>
          <span
            className={`${styles.subject} ${!thread.isRead ? styles.unreadSubject : ''}`}
          >
            {thread.subject}
          </span>
          {thread.messageCount > 1 ? (
            <span className={styles.countPill}>{thread.messageCount}</span>
          ) : null}
        </div>

        <p className={styles.snippet}>{thread.snippet}</p>

        <div className={styles.footerRow}>
          <button
            className={`${styles.starButton} ${thread.isStarred ? styles.starActive : ''}`}
            onClick={handleStarClick}
            title={thread.isStarred ? 'Unstar' : 'Star'}
            type="button"
          >
            <Star size={13} fill={thread.isStarred ? 'currentColor' : 'none'} />
          </button>

          <button
            className={`${styles.lockButton} ${thread.isLocked ? styles.lockActive : ''}`}
            onClick={handleLockClick}
            title={
              thread.isLocked
                ? 'Locked (Protected from mailbox cleaner). Click to unlock.'
                : 'Lock message (Protect from mailbox cleaner)'
            }
            type="button"
          >
            <Lock size={12} />
            {thread.isLocked ? <span className={styles.lockedLabel}>Locked</span> : null}
          </button>

          {thread.hasAttachments ? (
            <span
              className={styles.attachmentChip}
              title={
                thread.messages?.find((m) => m.attachments && m.attachments.length > 0)?.attachments?.[0]?.name
                  ? `Attachment: ${thread.messages.find((m) => m.attachments && m.attachments.length > 0)?.attachments?.[0]?.name}`
                  : 'Contains attachments'
              }
            >
              <Paperclip size={11} />
              <span>
                {thread.messages?.find((m) => m.attachments && m.attachments.length > 0)?.attachments?.[0]?.name ||
                  'Attachment'}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});
