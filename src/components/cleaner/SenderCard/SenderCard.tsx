/**
 * SenderCard.tsx
 * Individual sender card component displaying unique email address, contact name, domain badge,
 * conversation volume pill, attachment indicators, lock protection controls, and review action.
 */

'use client';

import React from 'react';
import { Check, Lock, Unlock, Paperclip, ChevronRight, Mail } from 'lucide-react';
import { UniqueSenderStats } from '@/types/mail';
import { Avatar } from '@/components/common/Avatar/Avatar';
import styles from './SenderCard.module.css';

interface SenderCardProps {
  sender: UniqueSenderStats;
  isChecked: boolean;
  onToggleCheck: (email: string) => void;
  onInspect: (sender: UniqueSenderStats) => void;
  onToggleLockAll: (sender: UniqueSenderStats) => void;
}

export const SenderCard = React.memo(function SenderCard({
  sender,
  isChecked,
  onToggleCheck,
  onInspect,
  onToggleLockAll,
}: SenderCardProps) {
  const isFullyLocked = sender.lockedCount > 0 && sender.lockedCount === sender.threadCount;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCheck(sender.email);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLockAll(sender);
  };

  return (
    <div
      className={`${styles.card} ${isChecked ? styles.cardChecked : ''}`}
      onClick={() => onInspect(sender)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onInspect(sender);
      }}
    >
      <div className={styles.leftArea}>
        <button
          type="button"
          className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}
          onClick={handleCheckboxClick}
          aria-label={isChecked ? `Unmark ${sender.name}` : `Mark ${sender.name} for deletion`}
        >
          {isChecked ? <Check size={12} strokeWidth={3} /> : null}
        </button>

        <Avatar name={sender.name || sender.email} size="md" />

        <div className={styles.senderDetails}>
          <div className={styles.nameRow}>
            <span className={styles.senderName}>{sender.name}</span>
            {sender.domain ? (
              <span className={styles.domainBadge}>@{sender.domain}</span>
            ) : null}
          </div>
          <span className={styles.email}>{sender.email}</span>
        </div>
      </div>

      <div className={styles.rightArea}>
        <div className={styles.metricsPills}>
          <span className={styles.pill} title="Total conversations from this sender">
            <Mail size={11} />
            <span>{sender.threadCount} {sender.threadCount === 1 ? 'thread' : 'threads'}</span>
          </span>

          {sender.hasAttachments ? (
            <span className={styles.pill} title="Contains attachments">
              <Paperclip size={11} />
            </span>
          ) : null}

          {sender.lockedCount > 0 ? (
            <span
              className={`${styles.pill} ${styles.lockedPill}`}
              title={`${sender.lockedCount} conversation(s) are locked and protected from deletion`}
            >
              <Lock size={11} />
              <span>{sender.lockedCount} protected</span>
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.lockActionBtn}
          onClick={handleLockClick}
          title={
            isFullyLocked
              ? 'Unlock all conversations from this sender'
              : 'Lock and protect all conversations from this sender'
          }
        >
          {isFullyLocked ? <Unlock size={12} /> : <Lock size={12} />}
          <span>{isFullyLocked ? 'Unlock All' : 'Lock All'}</span>
        </button>

        <button
          type="button"
          className={styles.inspectBtn}
          onClick={(e) => {
            e.stopPropagation();
            onInspect(sender);
          }}
          title="Review individual conversations"
        >
          <span>Review</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
});
