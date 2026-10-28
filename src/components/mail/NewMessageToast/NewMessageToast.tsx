/**
 * NewMessageToast.tsx
 * Floating real-time in-app notification toast for incoming email messages.
 * Displays sender avatar, subject, snippet preview, and provides quick navigation into the thread.
 * Plays an accessible Web Audio harmonic chime on arrival.
 */

'use client';

import React, { memo, useEffect } from 'react';
import { MailMessage } from '@/types/mail';
import styles from './NewMessageToast.module.css';

interface NewMessageToastProps {
  message: MailMessage;
  onView: () => void;
  onDismiss: () => void;
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio context may require prior user gesture
  }
}

export const NewMessageToast = memo(function NewMessageToast({
  message,
  onView,
  onDismiss,
}: NewMessageToastProps) {
  useEffect(() => {
    playNotificationChime();
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  const initials = (message.senderName || message.senderEmail || 'N')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.toastWrapper} role="alert" aria-live="polite">
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.sender}>{message.senderName}</span>
          <span className={styles.badge}>New Mail</span>
        </div>
        <div className={styles.subject}>{message.subject || '(No Subject)'}</div>
        {message.snippet ? (
          <div className={styles.snippet}>{message.snippet}</div>
        ) : null}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.viewBtn}
          onClick={onView}
          aria-label="View incoming email"
        >
          View
        </button>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
});
