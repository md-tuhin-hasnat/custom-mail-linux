/**
 * SenderThreadsDrawer.tsx
 * Slide-out review sheet displaying all conversations associated with a specific sender.
 * Provides granular inspection of message subjects, snippets, dates, and per-thread lock toggles.
 * Features a dimmed backdrop overlay to prevent background overlap.
 */

'use client';

import React from 'react';
import { X, Lock, Unlock, Mail } from 'lucide-react';
import { UniqueSenderStats, MailThread } from '@/types/mail';
import styles from './SenderThreadsDrawer.module.css';

interface SenderThreadsDrawerProps {
  sender: UniqueSenderStats | null;
  threads: MailThread[];
  onClose: () => void;
  onToggleLock: (threadId: string) => void;
}

export const SenderThreadsDrawer = React.memo(function SenderThreadsDrawer({
  sender,
  threads,
  onClose,
  onToggleLock,
}: SenderThreadsDrawerProps) {
  if (!sender) return null;

  const senderThreads = threads.filter((t) => sender.threadIds.includes(t.id));

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.drawer} role="complementary" aria-label="Sender conversations drawer">
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>{sender.name}</h2>
          <p className={styles.subtitle}>{sender.email}</p>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          title="Close review panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.threadList}>
        {senderThreads.map((thread) => (
          <div key={thread.id} className={styles.threadItem}>
            <div className={styles.threadTopRow}>
              <span className={styles.threadSubject} title={thread.subject}>
                {thread.subject || '(No subject)'}
              </span>
              <span className={styles.threadDate}>{thread.lastDate}</span>
            </div>

            <p className={styles.threadSnippet}>{thread.snippet}</p>

            <div className={styles.threadActions}>
              <button
                type="button"
                className={`${styles.lockBtn} ${thread.isLocked ? styles.lockActive : ''}`}
                onClick={() => onToggleLock(thread.id)}
                title={thread.isLocked ? 'Protected (Locked). Click to unlock.' : 'Lock and protect this conversation'}
              >
                {thread.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span>{thread.isLocked ? 'Protected' : 'Lock'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
});
