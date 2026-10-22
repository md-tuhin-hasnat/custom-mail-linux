/**
 * MailboxCleanerView.tsx
 * Full-page dedicated mailbox cleaning interface.
 * Displays all unique senders with domain badges, conversation counts, and lock statuses.
 * Supports real-time search, category filtering, bulk marking, sender conversation review,
 * and bulk deletion with tombstone persistence.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { MailThread, UniqueSenderStats } from '@/types/mail';
import { CleanerHeader } from '../CleanerHeader/CleanerHeader';
import {
  CleanerFilterBar,
  CleanerSenderFilter,
  CleanerSenderSort,
  CleanerDatePreset,
} from '../CleanerFilterBar/CleanerFilterBar';
import { SenderCard } from '../SenderCard/SenderCard';
import { CleanerActionBar } from '../CleanerActionBar/CleanerActionBar';
import { SenderThreadsDrawer } from '../SenderThreadsDrawer/SenderThreadsDrawer';
import { useUniqueSenders } from '../useUniqueSenders';
import { useCleanerActions } from '../useCleanerActions';
import styles from './MailboxCleanerView.module.css';

interface MailboxCleanerViewProps {
  threads: MailThread[];
  activeAccountId?: string;
  onBackToMail: () => void;
  onToggleLock: (threadId: string) => void;
  onRefreshMailbox: () => void;
}

export const MailboxCleanerView = React.memo(function MailboxCleanerView({
  threads,
  activeAccountId,
  onBackToMail,
  onToggleLock,
  onRefreshMailbox,
}: MailboxCleanerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CleanerSenderFilter>('all');
  const [currentSort, setCurrentSort] = useState<CleanerSenderSort>('count-desc');
  const [datePreset, setDatePreset] = useState<CleanerDatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [markedEmails, setMarkedEmails] = useState<Set<string>>(() => new Set());
  const [inspectedSender, setInspectedSender] = useState<UniqueSenderStats | null>(null);
  const [deletePermanently, setDeletePermanently] = useState(false);

  const { filteredSenders, totalSenders, totalConversations, totalLocked } =
    useUniqueSenders(threads, searchQuery, activeFilter, currentSort);

  const isAllMarked = useMemo(() => {
    if (filteredSenders.length === 0) return false;
    return filteredSenders.every((s) => markedEmails.has(s.email));
  }, [filteredSenders, markedEmails]);

  const handleToggleCheck = useCallback((email: string) => {
    setMarkedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setMarkedEmails((prev) => {
      if (isAllMarked) return new Set();
      const next = new Set(prev);
      filteredSenders.forEach((s) => next.add(s.email));
      return next;
    });
  }, [isAllMarked, filteredSenders]);

  const markedStats = useMemo(() => {
    const matchingThreads = threads.filter((t) =>
      t.participants.some((p) => markedEmails.has(p.email.toLowerCase()))
    );
    const eligible = matchingThreads.filter((t) => !t.isLocked).length;
    const locked = matchingThreads.filter((t) => t.isLocked).length;
    return { eligible, locked };
  }, [threads, markedEmails]);

  const {
    isCleaning,
    successMsg,
    setSuccessMsg,
    handleLockAllFromSender,
    handleLockAllMarked,
    handleUnlockAllMarked,
    handleExecuteClean,
  } = useCleanerActions({
    threads,
    markedEmails,
    markedStats,
    deletePermanently,
    datePreset,
    startDate,
    endDate,
    activeAccountId,
    onRefreshMailbox,
    onClearMarked: () => setMarkedEmails(new Set()),
    onCloseInspectedSender: () => setInspectedSender(null),
  });

  return (
    <div className={styles.container}>
      <CleanerHeader
        totalSenders={totalSenders}
        totalConversations={totalConversations}
        totalLocked={totalLocked}
        onBackToMail={onBackToMail}
      />

      <CleanerFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {successMsg ? (
        <div className={styles.successBanner}>
          <span>{successMsg}</span>
          <button type="button" className={styles.dismissSuccessBtn} onClick={() => setSuccessMsg(null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className={styles.listHeader}>
        <div className={styles.selectAllGroup}>
          <button
            type="button"
            className={`${styles.checkbox} ${isAllMarked ? styles.checkboxChecked : ''}`}
            onClick={handleToggleSelectAll}
            aria-label="Mark all senders"
          >
            {isAllMarked ? <Check size={11} strokeWidth={3} /> : null}
          </button>
          <span className={styles.selectAllText} onClick={handleToggleSelectAll}>
            {isAllMarked ? 'Deselect All' : 'Select All'} Matching
          </span>
        </div>
        <span className={styles.countText}>
          Showing {filteredSenders.length.toLocaleString()} unique senders
        </span>
      </div>

      <div className={styles.scrollArea}>
        {filteredSenders.length > 0 ? (
          filteredSenders.map((sender) => (
            <SenderCard
              key={sender.email}
              sender={sender}
              isChecked={markedEmails.has(sender.email)}
              onToggleCheck={handleToggleCheck}
              onInspect={setInspectedSender}
              onToggleLockAll={handleLockAllFromSender}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyTitle}>No senders match your search</span>
            <span className={styles.emptyDesc}>
              Try clearing filters or adjusting your search query above.
            </span>
          </div>
        )}
      </div>

      <CleanerActionBar
        markedSendersCount={markedEmails.size}
        totalEligibleConversations={markedStats.eligible}
        totalLockedConversations={markedStats.locked}
        onClearMarked={() => setMarkedEmails(new Set())}
        onLockAllMarked={handleLockAllMarked}
        onUnlockAllMarked={handleUnlockAllMarked}
        deletePermanently={deletePermanently}
        onToggleDeletePermanently={setDeletePermanently}
        onExecuteClean={handleExecuteClean}
        isCleaning={isCleaning}
      />

      <SenderThreadsDrawer
        sender={inspectedSender}
        threads={threads}
        onClose={() => setInspectedSender(null)}
        onToggleLock={(threadId) => {
          onToggleLock(threadId);
          onRefreshMailbox();
        }}
      />
    </div>
  );
});
