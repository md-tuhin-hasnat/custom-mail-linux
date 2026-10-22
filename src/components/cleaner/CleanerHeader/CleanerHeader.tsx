/**
 * CleanerHeader.tsx
 * Top header component for the full-page Mailbox Cleaner.
 * Displays title, subtitle, live aggregate statistics (unique senders, total conversations, locked threads),
 * and quick return navigation to the mail inbox.
 */

'use client';

import React from 'react';
import { Sparkles, ArrowLeft, Lock, Mail, Users } from 'lucide-react';
import styles from './CleanerHeader.module.css';

interface CleanerHeaderProps {
  totalSenders: number;
  totalConversations: number;
  totalLocked: number;
  onBackToMail: () => void;
}

export const CleanerHeader = React.memo(function CleanerHeader({
  totalSenders,
  totalConversations,
  totalLocked,
  onBackToMail,
}: CleanerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leftGroup}>
        <div className={styles.iconWrapper}>
          <Sparkles size={20} />
        </div>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Mailbox Cleaner</h1>
          <p className={styles.subtitle}>
            Analyze unique senders, bulk clean clutter, and protect locked messages
          </p>
        </div>
      </div>

      <div className={styles.statsGroup}>
        <div className={styles.statBadge}>
          <Users size={13} />
          <span>Unique Senders:</span>
          <span className={styles.statValue}>{totalSenders.toLocaleString()}</span>
        </div>

        <div className={styles.statBadge}>
          <Mail size={13} />
          <span>Conversations:</span>
          <span className={styles.statValue}>{totalConversations.toLocaleString()}</span>
        </div>

        {totalLocked > 0 ? (
          <div className={`${styles.statBadge} ${styles.lockedStat}`}>
            <Lock size={13} />
            <span>Protected:</span>
            <span className={styles.statValue}>{totalLocked.toLocaleString()} locked</span>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.backBtn}
          onClick={onBackToMail}
          title="Return to Inbox"
        >
          <ArrowLeft size={14} />
          <span>Back to Mail</span>
        </button>
      </div>
    </header>
  );
});
