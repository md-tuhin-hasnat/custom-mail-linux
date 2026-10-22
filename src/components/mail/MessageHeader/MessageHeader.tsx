import React from 'react';
import { Reply, ReplyAll, Forward, Trash2, Star, Lock } from 'lucide-react';
import { MailMessage } from '@/types/mail';
import { Avatar } from '@/components/common/Avatar/Avatar';
import styles from './MessageHeader.module.css';

interface MessageHeaderProps {
  message: MailMessage;
  isLocked?: boolean;
  onReply: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  onToggleLock?: () => void;
}

export const MessageHeader = React.memo(function MessageHeader({
  message,
  isLocked = false,
  onReply,
  onDelete,
  onToggleStar,
  onToggleLock,
}: MessageHeaderProps) {
  const recipientStr = `To: ${message.recipientNames.join(', ')}`;

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Avatar name={message.senderName} size="md" color="#0a84ff" />
        <div className={styles.details}>
          <span className={styles.senderName}>{message.senderName}</span>
          <span className={styles.recipients}>{recipientStr}</span>
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.date}>{message.date}</span>
        <div className={styles.actions}>
          {onToggleLock ? (
            <button
              className={styles.actionBtn}
              onClick={onToggleLock}
              title={
                isLocked || message.isLocked
                  ? 'Locked (Protected from mailbox cleaner). Click to unlock.'
                  : 'Lock message (Protect from mailbox cleaner)'
              }
              type="button"
            >
              <Lock
                size={15}
                color={isLocked || message.isLocked ? '#ff9f0a' : 'currentColor'}
              />
            </button>
          ) : null}
          <button
            className={styles.actionBtn}
            onClick={onToggleStar}
            title={message.isStarred ? 'Unstar' : 'Star'}
            type="button"
          >
            <Star size={15} fill={message.isStarred ? '#ff9f0a' : 'none'} color={message.isStarred ? '#ff9f0a' : 'currentColor'} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={onReply}
            title="Reply"
            type="button"
          >
            <Reply size={15} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={onReply}
            title="Reply All"
            type="button"
          >
            <ReplyAll size={15} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={onReply}
            title="Forward"
            type="button"
          >
            <Forward size={15} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={onDelete}
            title="Delete"
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
});
