/**
 * notificationService.ts
 * Cross-platform desktop notification service for Linux and desktop environments.
 * Dispatches native system notifications via Electron Notification API with
 * automatic fallback to FreeDesktop notify-send on Linux desktop environments.
 * Handles window restore/focus and deep-linking into incoming mail threads on click.
 */

import { Notification, BrowserWindow } from 'electron';
import { execFile } from 'node:child_process';

export interface EmailNotificationPayload {
  senderName: string;
  senderEmail?: string;
  subject: string;
  snippet?: string;
  threadId?: string;
}

export function showDesktopNotification(
  payload: EmailNotificationPayload,
  getMainWindow: () => BrowserWindow | null
): void {
  const title = payload.senderName || payload.senderEmail || 'New Message';
  const subtitle = payload.subject || '(No Subject)';
  const bodyText = payload.snippet
    ? `${subtitle}\n${payload.snippet.slice(0, 140)}`
    : subtitle;

  const handleNotificationClick = () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
      if (payload.threadId) {
        win.webContents.send('mail:navigate-to-thread', { threadId: payload.threadId });
      }
    }
  };

  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        subtitle,
        body: bodyText,
        urgency: 'normal',
        silent: false,
      });

      notification.on('click', handleNotificationClick);
      notification.show();
      return;
    }
  } catch (err) {
    console.warn('[NotificationService] Electron notification failed, trying notify-send:', err);
  }

  // Linux FreeDesktop notify-send fallback
  if (process.platform === 'linux') {
    try {
      execFile(
        'notify-send',
        ['-a', 'Aura Mail', '-u', 'normal', title, bodyText],
        (error) => {
          if (error) {
            console.warn('[NotificationService] notify-send fallback failed:', error.message);
          }
        }
      );
    } catch (e) {
      console.warn('[NotificationService] Failed to execute notify-send:', e);
    }
  }
}
