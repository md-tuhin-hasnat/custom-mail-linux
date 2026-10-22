/**
 * CleanerActionBar.tsx
 * Floating execution bar displayed when one or more senders are marked.
 * Shows marked sender totals, eligible vs protected thread breakdown, bulk lock/unlock toggles,
 * permanent deletion checkbox, and immediate cleaning trigger.
 */

'use client';

import React from 'react';
import { Trash2, Lock, Unlock, X, Loader2 } from 'lucide-react';
import styles from './CleanerActionBar.module.css';

interface CleanerActionBarProps {
  markedSendersCount: number;
  totalEligibleConversations: number;
  totalLockedConversations: number;
  onClearMarked: () => void;
  onLockAllMarked: () => void;
  onUnlockAllMarked: () => void;
  deletePermanently: boolean;
  onToggleDeletePermanently: (val: boolean) => void;
  onExecuteClean: () => void;
  isCleaning: boolean;
}

export const CleanerActionBar = React.memo(function CleanerActionBar({
  markedSendersCount,
  totalEligibleConversations,
  totalLockedConversations,
  onClearMarked,
  onLockAllMarked,
  onUnlockAllMarked,
  deletePermanently,
  onToggleDeletePermanently,
  onExecuteClean,
  isCleaning,
}: CleanerActionBarProps) {
  if (markedSendersCount === 0) return null;

  return (
    <div className={styles.actionBar} role="toolbar" aria-label="Bulk clean actions">
      <div className={styles.leftGroup}>
        <span className={styles.markedBadge}>
          {markedSendersCount} sender{markedSendersCount > 1 ? 's' : ''} marked
        </span>
        <span className={styles.infoText}>
          {totalEligibleConversations.toLocaleString()} conversation{totalEligibleConversations > 1 ? 's' : ''} to clean
        </span>
        {totalLockedConversations > 0 ? (
          <span className={styles.lockedInfo} title="These locked conversations will not be deleted">
            <Lock size={12} />
            <span>{totalLockedConversations} protected</span>
          </span>
        ) : null}
      </div>

      <div className={styles.actionsGroup}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.lockBtn}`}
          onClick={onLockAllMarked}
          title="Protect all marked senders from deletion"
        >
          <Lock size={13} />
          <span>Lock</span>
        </button>

        <button
          type="button"
          className={styles.actionBtn}
          onClick={onUnlockAllMarked}
          title="Unlock marked senders"
        >
          <Unlock size={13} />
          <span>Unlock</span>
        </button>

        <label className={styles.dangerCheck} title="Delete permanently instead of moving to Trash">
          <input
            type="checkbox"
            checked={deletePermanently}
            onChange={(e) => onToggleDeletePermanently(e.target.checked)}
          />
          <span>Permanent</span>
        </label>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onExecuteClean}
          disabled={isCleaning || totalEligibleConversations === 0}
        >
          {isCleaning ? <Loader2 size={14} className={styles.spinning} /> : <Trash2 size={14} />}
          <span>
            {isCleaning
              ? 'Cleaning...'
              : `Delete ${totalEligibleConversations.toLocaleString()}`}
          </span>
        </button>

        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClearMarked}
          title="Clear all marked senders"
          aria-label="Clear selection"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
});
