/**
 * useCleanerActions.ts
 * Custom hook for bulk cleaning actions and lock protection coordination in MailboxCleanerView.
 * Handles bulk locking, bulk unlocking, permanent deletion execution,
 * user confirmation dialogs, and success notifications.
 */

'use client';

import { useState, useCallback } from 'react';
import { MailThread, UniqueSenderStats, MailCleanerExecuteResult } from '@/types/mail';
import { CleanerDatePreset } from './CleanerFilterBar/CleanerFilterBar';

interface UseCleanerActionsProps {
  threads: MailThread[];
  markedEmails: Set<string>;
  markedStats: { eligible: number; locked: number };
  deletePermanently: boolean;
  datePreset: CleanerDatePreset;
  startDate: string;
  endDate: string;
  activeAccountId?: string;
  onRefreshMailbox: () => void;
  onClearMarked: () => void;
  onCloseInspectedSender: () => void;
}

export function useCleanerActions({
  threads,
  markedEmails,
  markedStats,
  deletePermanently,
  datePreset,
  startDate,
  endDate,
  activeAccountId,
  onRefreshMailbox,
  onClearMarked,
  onCloseInspectedSender,
}: UseCleanerActionsProps) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLockAllFromSender = useCallback(
    async (sender: UniqueSenderStats) => {
      const isFullyLocked = sender.lockedCount > 0 && sender.lockedCount === sender.threadCount;
      const action = isFullyLocked ? 'unlock' : 'lock';
      if (window.desktopAPI?.mail?.batchAction) {
        await window.desktopAPI.mail.batchAction(sender.threadIds, action, activeAccountId);
        onRefreshMailbox();
      }
    },
    [activeAccountId, onRefreshMailbox]
  );

  const handleLockAllMarked = useCallback(async () => {
    const threadIds = threads
      .filter((t) => t.participants.some((p) => markedEmails.has(p.email.toLowerCase())))
      .map((t) => t.id);
    if (threadIds.length === 0) return;
    if (window.desktopAPI?.mail?.batchAction) {
      await window.desktopAPI.mail.batchAction(threadIds, 'lock', activeAccountId);
      onRefreshMailbox();
    }
  }, [threads, markedEmails, activeAccountId, onRefreshMailbox]);

  const handleUnlockAllMarked = useCallback(async () => {
    const threadIds = threads
      .filter((t) => t.participants.some((p) => markedEmails.has(p.email.toLowerCase())))
      .map((t) => t.id);
    if (threadIds.length === 0) return;
    if (window.desktopAPI?.mail?.batchAction) {
      await window.desktopAPI.mail.batchAction(threadIds, 'unlock', activeAccountId);
      onRefreshMailbox();
    }
  }, [threads, markedEmails, activeAccountId, onRefreshMailbox]);

  const handleExecuteClean = useCallback(async () => {
    if (markedEmails.size === 0 || !window.desktopAPI?.mail?.cleanMailbox) return;

    const prompt = deletePermanently
      ? `Permanently delete ${markedStats.eligible} conversations from ${markedEmails.size} senders? This cannot be undone.`
      : `Move ${markedStats.eligible} conversations from ${markedEmails.size} senders to Trash?`;
    if (!window.confirm(prompt)) return;

    setIsCleaning(true);
    try {
      const criteria: any = {
        senderEmails: Array.from(markedEmails),
        deletePermanently,
      };
      if (datePreset === 'custom') {
        if (startDate) criteria.startDate = startDate;
        if (endDate) criteria.endDate = endDate;
      } else if (datePreset !== 'all') {
        criteria.olderThanDays = parseInt(datePreset, 10);
      }

      const res: MailCleanerExecuteResult = await window.desktopAPI.mail.cleanMailbox(
        criteria,
        activeAccountId
      );
      setSuccessMsg(
        `Cleaned ${res.deletedCount} conversations from ${markedEmails.size} senders. ${res.lockedProtectedCount} locked conversations were protected.`
      );
      onClearMarked();
      onCloseInspectedSender();
      onRefreshMailbox();
    } catch (err) {
      console.error('Failed to clean marked senders:', err);
    } finally {
      setIsCleaning(false);
    }
  }, [
    markedEmails,
    deletePermanently,
    markedStats,
    datePreset,
    startDate,
    endDate,
    activeAccountId,
    onRefreshMailbox,
    onClearMarked,
    onCloseInspectedSender,
  ]);

  return {
    isCleaning,
    successMsg,
    setSuccessMsg,
    handleLockAllFromSender,
    handleLockAllMarked,
    handleUnlockAllMarked,
    handleExecuteClean,
  };
}
