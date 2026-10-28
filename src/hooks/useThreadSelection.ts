/**
 * useThreadSelection.ts
 * Custom React hook for thread filtering, sorting, multi-selection, and batch actions.
 * Manages active folder context, category switching ('focused' | 'other' | 'all'),
 * quick filters, sorting options, and batch actions (archive, delete, mark read/unread, lock/unlock).
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { MailFolder, MailThread } from '@/types/mail';
import { QuickFilterType } from '@/components/mail/ThreadFilterBar/ThreadFilterBar';
import { ThreadSortOption } from '@/components/mail/ThreadSortDropdown/ThreadSortDropdown';
import { BatchActionType } from '@/components/mail/BatchActionBar/BatchActionBar';

interface UseThreadSelectionProps {
  folders: MailFolder[];
  threads: MailThread[];
  activeAccountId: string;
  setThreads: React.Dispatch<React.SetStateAction<MailThread[]>>;
  onThreadSelected?: (threadId: string) => void;
}

export function useThreadSelection({
  folders,
  threads,
  activeAccountId,
  setThreads,
  onThreadSelected,
}: UseThreadSelectionProps) {
  const [activeFolderId, setActiveFolderId] = useState('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    threads[0]?.id || null
  );
  const [activeCategory, setActiveCategory] = useState<'focused' | 'other' | 'all'>('focused');
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>('all');
  const [currentSort, setCurrentSort] = useState<ThreadSortOption>('date-desc');
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronously compute filtered threads without useEffect
  const filteredThreads = useMemo(() => {
    const curFolder = folders.find((f) => f.id === activeFolderId);
    const curName = curFolder?.name.toLowerCase();
    const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();

    return threads.filter((t) => {
      const hasL = (name: string) => t.labelIds?.some((l) => norm(l) === name.toLowerCase());

      const matchesFolder =
        activeFolderId === 'all' ||
        t.folderId === activeFolderId ||
        (activeFolderId === 'inbox' && (t.folderId === 'inbox' || (hasL('inbox') && t.folderId !== 'sent' && t.folderId !== 'outbox' && t.folderId !== 'trash' && t.folderId !== 'drafts'))) ||
        (activeFolderId === 'sent' && (t.folderId === 'sent' || (hasL('sent') && t.folderId !== 'trash' && t.folderId !== 'outbox'))) ||
        (activeFolderId === 'outbox' && (t.folderId === 'outbox' || hasL('outbox'))) ||
        (activeFolderId === 'drafts' && (t.folderId === 'drafts' || hasL('draft') || hasL('drafts'))) ||
        (activeFolderId === 'trash' && (t.folderId === 'trash' || hasL('trash') || hasL('bin'))) ||
        (activeFolderId === 'junk' && (t.folderId === 'junk' || hasL('spam') || hasL('junk'))) ||
        (activeFolderId === 'spam' && (t.folderId === 'spam' || hasL('spam') || hasL('junk'))) ||
        (activeFolderId === 'archive' && (t.folderId === 'archive' || hasL('archive') || (hasL('all mail') && t.folderId !== 'sent' && t.folderId !== 'trash' && t.folderId !== 'outbox'))) ||
        (curName && t.labelIds?.some((l) => norm(l) === curName));

      if (!matchesFolder) return false;

      if (activeCategory !== 'all' && t.category !== activeCategory) {
        return false;
      }

      if (activeFilter === 'unread' && t.isRead) return false;
      if (activeFilter === 'starred' && !t.isStarred) return false;
      if (activeFilter === 'attachments' && !t.hasAttachments) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = t.subject.toLowerCase().includes(q);
        const matchSnip = t.snippet.toLowerCase().includes(q);
        const matchPart = t.participants.some(
          (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        );
        if (!matchSub && !matchSnip && !matchPart) return false;
      }

      return true;
    });
  }, [threads, folders, activeFolderId, activeCategory, activeFilter, searchQuery]);

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => t.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) || folders[0] || { id: 'inbox', name: 'Inbox' },
    [folders, activeFolderId]
  );

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setSelectedThreadId(threadId);
      if (onThreadSelected) onThreadSelected(threadId);
    },
    [onThreadSelected]
  );

  const handleToggleStar = useCallback(
    (threadId: string) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isStarred: !t.isStarred } : t))
      );
      window.desktopAPI?.mail.toggleStar(threadId, activeAccountId);
    },
    [activeAccountId, setThreads]
  );

  const handleToggleLock = useCallback(
    (threadId: string) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isLocked: !t.isLocked } : t))
      );
      window.desktopAPI?.mail.toggleLock(threadId, activeAccountId);
    },
    [activeAccountId, setThreads]
  );

  const handleToggleCheck = useCallback((id: string) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectMultiple = useCallback((ids: string[], select: boolean) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (select) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedThreadIds(new Set());
  }, []);

  const handleBatchAction = useCallback(
    async (action: BatchActionType) => {
      const ids = Array.from(selectedThreadIds);
      if (ids.length === 0) return;
      const idsSet = new Set(ids);

      setThreads((prev) => {
        if (action === 'delete') {
          return prev.map((t) => (idsSet.has(t.id) && !t.isLocked ? { ...t, folderId: 'trash' } : t));
        }
        if (action === 'archive') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, folderId: 'archive' } : t));
        }
        if (action === 'markRead') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isRead: true } : t));
        }
        if (action === 'markUnread') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isRead: false } : t));
        }
        if (action === 'star') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isStarred: true } : t));
        }
        if (action === 'unstar') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isStarred: false } : t));
        }
        if (action === 'lock') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isLocked: true } : t));
        }
        if (action === 'unlock') {
          return prev.map((t) => (idsSet.has(t.id) ? { ...t, isLocked: false } : t));
        }
        return prev;
      });

      setSelectedThreadIds(new Set());

      if (window.desktopAPI?.mail?.batchAction) {
        await window.desktopAPI.mail.batchAction(ids, action, activeAccountId);
      }
    },
    [selectedThreadIds, activeAccountId, setThreads]
  );

  return {
    activeFolderId,
    setActiveFolderId,
    selectedThreadId,
    setSelectedThreadId,
    activeCategory,
    setActiveCategory,
    activeFilter,
    setActiveFilter,
    currentSort,
    setCurrentSort,
    selectedThreadIds,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    selectedThread,
    activeFolder,
    handleSelectThread,
    handleToggleStar,
    handleToggleLock,
    handleToggleCheck,
    handleSelectMultiple,
    handleClearSelection,
    handleBatchAction,
  };
}
