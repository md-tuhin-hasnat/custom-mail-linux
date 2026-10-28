/**
 * useMailboxData.ts
 * Custom React hook for managing mailbox state, synchronization lifecycles, and persistence.
 * Orchestrates folder and thread collections, real-time sync progress listeners,
 * background idle updates, thread message cache updates, and thread deletion tombstones.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { MailFolder, MailThread, MailMessage } from '@/types/mail';

interface UseMailboxDataProps {
  initialFolders: MailFolder[];
  initialThreads: MailThread[];
  activeAccountId: string;
  onSelectedThreadReset?: () => void;
  onNavigateToThread?: (threadId: string) => void;
}

export function useMailboxData({
  initialFolders,
  initialThreads,
  activeAccountId,
  onSelectedThreadReset,
  onNavigateToThread,
}: UseMailboxDataProps) {
  const [folders, setFolders] = useState<MailFolder[]>(initialFolders);
  const [threads, setThreads] = useState<MailThread[]>(initialThreads);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('All folders up to date');
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | undefined>();
  const [incomingToast, setIncomingToast] = useState<{ message: MailMessage; threadId: string } | null>(null);

  // Concurrently load account folders and threads without waterfalls
  const loadAccountData = useCallback(async (accountId: string) => {
    if (!window.desktopAPI?.mail) return;
    try {
      const [accFolders, accThreads] = await Promise.all([
        window.desktopAPI.mail.getFolders(accountId),
        window.desktopAPI.mail.getThreads('all', accountId),
      ]);

      if (accFolders) setFolders(accFolders);
      if (accThreads) setThreads(accThreads);
    } catch (err) {
      console.warn('Failed to load account data from desktopAPI:', err);
    }
  }, []);

  // Listen to real-time sync progress events from Electron main process
  useEffect(() => {
    if (!window.desktopAPI?.mail?.onSyncProgress) return;

    const unsubscribe = window.desktopAPI.mail.onSyncProgress((progress) => {
      setIsSyncing(progress.isSyncing);
      setSyncStatus(progress.status);
      setSyncProgress({ current: progress.current, total: progress.total });
      if (!progress.isSyncing && progress.current > 0 && activeAccountId) {
        loadAccountData(activeAccountId);
      }
    });

    return unsubscribe;
  }, [activeAccountId, loadAccountData]);

  // Listen to real-time batch thread updates (e.g., during active sync)
  useEffect(() => {
    if (!window.desktopAPI?.mail?.onThreadsUpdated) return;

    const unsubscribe = window.desktopAPI.mail.onThreadsUpdated(({ threads: newThreads, folders: newFolders }) => {
      if (newThreads && newThreads.length > 0) setThreads(newThreads);
      if (newFolders && newFolders.length > 0) setFolders(newFolders);
    });

    return unsubscribe;
  }, []);

  // Listen to real-time incoming messages & navigation events
  useEffect(() => {
    const unsubNew = window.desktopAPI?.mail?.onNewMessage?.(({ message, threadId }) => {
      setIncomingToast({ message, threadId });
    });

    const unsubNav = window.desktopAPI?.mail?.onNavigateToThread?.(({ threadId }) => {
      if (onNavigateToThread) onNavigateToThread(threadId);
    });

    return () => {
      if (unsubNew) unsubNew();
      if (unsubNav) unsubNav();
    };
  }, [onNavigateToThread]);

  const handleSync = useCallback(async () => {
    if (isSyncing || !window.desktopAPI?.mail?.sync) return;
    setIsSyncing(true);
    setSyncStatus('Synchronizing messages...');
    try {
      await window.desktopAPI.mail.sync(activeAccountId);
    } catch (err) {
      console.warn('Sync failed:', err);
      setSyncStatus('Sync error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, activeAccountId]);

  const handleResyncAll = useCallback(async () => {
    if (isSyncing || !window.desktopAPI?.mail?.resyncAll) return;
    setIsSyncing(true);
    setSyncStatus('Clearing local cache and resyncing from server...');
    try {
      await window.desktopAPI.mail.resyncAll(activeAccountId);
      await loadAccountData(activeAccountId);
    } catch (err) {
      console.warn('Resync all failed:', err);
      setSyncStatus('Resync error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, activeAccountId, loadAccountData]);

  const handleMessagesUpdated = useCallback((threadId: string, fullMsgs: MailMessage[]) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, messages: fullMsgs, snippet: fullMsgs[0]?.snippet || t.snippet }
          : t
      )
    );
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === threadId) {
            if (t.isLocked) return t;
            return { ...t, folderId: 'trash' };
          }
          return t;
        })
      );
      if (onSelectedThreadReset) onSelectedThreadReset();
      window.desktopAPI?.mail.deleteThread(threadId, activeAccountId);
    },
    [activeAccountId, onSelectedThreadReset]
  );

  const handleSimulateIncoming = useCallback(async () => {
    if (!window.desktopAPI?.mail?.simulateIncomingMail) return;
    try {
      await window.desktopAPI.mail.simulateIncomingMail({}, activeAccountId);
    } catch (e) {
      console.warn('Simulation failed:', e);
    }
  }, [activeAccountId]);

  return {
    folders,
    threads,
    setFolders,
    setThreads,
    isSyncing,
    syncStatus,
    syncProgress,
    incomingToast,
    setIncomingToast,
    handleSimulateIncoming,
    loadAccountData,
    handleSync,
    handleResyncAll,
    handleMessagesUpdated,
    handleDeleteThread,
  };
}
