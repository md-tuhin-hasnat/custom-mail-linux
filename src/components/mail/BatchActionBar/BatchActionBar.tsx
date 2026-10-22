import React from 'react';
import { MailOpen, Mail, Star, Trash2, Archive, X, Lock, Unlock } from 'lucide-react';
import styles from './BatchActionBar.module.css';

export type BatchActionType =
  | 'markRead'
  | 'markUnread'
  | 'star'
  | 'unstar'
  | 'delete'
  | 'archive'
  | 'lock'
  | 'unlock';

interface BatchActionBarProps {
  selectedCount: number;
  totalInView: number;
  isAllInViewSelected: boolean;
  onSelectAllInView: () => void;
  onClearSelection: () => void;
  onAction: (action: BatchActionType) => void;
}

export const BatchActionBar = React.memo(function BatchActionBar({
  selectedCount,
  totalInView,
  isAllInViewSelected,
  onSelectAllInView,
  onClearSelection,
  onAction,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.bar} role="toolbar" aria-label="Batch actions">
      <div className={styles.leftGroup}>
        <span className={styles.countBadge}>{selectedCount} selected</span>
        {!isAllInViewSelected ? (
          <button
            type="button"
            className={styles.selectAllLink}
            onClick={onSelectAllInView}
            title={`Select all ${totalInView} in this view`}
          >
            Select all {totalInView}
          </button>
        ) : null}
      </div>

      <div className={styles.actionsGroup}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction('markRead')}
          title="Mark selected as read"
        >
          <MailOpen size={13} />
          <span>Read</span>
        </button>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction('markUnread')}
          title="Mark selected as unread"
        >
          <Mail size={13} />
          <span>Unread</span>
        </button>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction('star')}
          title="Star selected"
        >
          <Star size={13} />
          <span>Star</span>
        </button>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction('archive')}
          title="Archive selected"
        >
          <Archive size={13} />
          <span>Archive</span>
        </button>

        <button
          type="button"
          className={`${styles.actionButton} ${styles.lockButton}`}
          onClick={() => onAction('lock')}
          title="Lock selected (Protect from deletion/cleaner)"
        >
          <Lock size={13} />
          <span>Lock</span>
        </button>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction('unlock')}
          title="Unlock selected"
        >
          <Unlock size={13} />
          <span>Unlock</span>
        </button>

        <button
          type="button"
          className={`${styles.actionButton} ${styles.dangerButton}`}
          onClick={() => onAction('delete')}
          title="Move to trash (Locked messages will be skipped)"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClearSelection}
          title="Deselect all"
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
});
