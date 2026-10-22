import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';
import { MailThread } from '@/types/mail';
import { ThreadFilterBar, QuickFilterType } from '@/components/mail/ThreadFilterBar/ThreadFilterBar';
import { ThreadSortOption } from '@/components/mail/ThreadSortDropdown/ThreadSortDropdown';
import { ThreadCard } from '@/components/mail/ThreadCard/ThreadCard';
import { BatchActionBar, BatchActionType } from '@/components/mail/BatchActionBar/BatchActionBar';
import { ThreadPagination } from '@/components/mail/ThreadPagination/ThreadPagination';
import { sortThreads } from '@/utils/sortThreads';
import styles from './ThreadListPane.module.css';

interface ThreadListPaneProps {
  folderName: string;
  threads: MailThread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLock?: (id: string) => void;
  activeCategory: 'focused' | 'other' | 'all';
  onCategoryChange: (cat: 'focused' | 'other' | 'all') => void;
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  currentSort: ThreadSortOption;
  onSortChange: (sort: ThreadSortOption) => void;
  selectedThreadIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onSelectMultiple: (ids: string[], select: boolean) => void;
  onClearSelection: () => void;
  onBatchAction: (action: BatchActionType) => void;
  fullWidth?: boolean;
}

const EMPTY_SET = new Set<string>();

export const ThreadListPane = React.memo(function ThreadListPane({
  folderName,
  threads,
  selectedThreadId,
  onSelectThread,
  onToggleStar,
  onToggleLock,
  activeCategory,
  onCategoryChange,
  activeFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  selectedThreadIds = EMPTY_SET,
  onToggleCheck,
  onSelectMultiple,
  onClearSelection,
  onBatchAction,
  fullWidth = false,
}: ThreadListPaneProps) {
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when folder or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [folderName, activeCategory, activeFilter, currentSort]);

  const sortedThreads = useMemo(() => {
    return sortThreads(threads, currentSort);
  }, [threads, currentSort]);

  const totalPages = Math.max(1, Math.ceil(sortedThreads.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedThreads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedThreads.slice(start, start + pageSize);
  }, [sortedThreads, safePage, pageSize]);

  const effectiveSelectedIds = selectedThreadIds || EMPTY_SET;

  const isPageAllSelected = useMemo(() => {
    if (paginatedThreads.length === 0) return false;
    return paginatedThreads.every((t) => effectiveSelectedIds.has(t.id));
  }, [paginatedThreads, effectiveSelectedIds]);

  const handleTogglePageSelect = useCallback(() => {
    const ids = paginatedThreads.map((t) => t.id);
    onSelectMultiple(ids, !isPageAllSelected);
  }, [paginatedThreads, isPageAllSelected, onSelectMultiple]);

  const handleSelectAllInView = useCallback(() => {
    const ids = sortedThreads.map((t) => t.id);
    onSelectMultiple(ids, true);
  }, [sortedThreads, onSelectMultiple]);

  return (
    <section className={`${styles.pane} ${fullWidth ? styles.fullWidth : ''}`} aria-label="Email threads">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={`${styles.selectAllCheckbox} ${isPageAllSelected ? styles.selectAllCheckboxChecked : ''}`}
            onClick={handleTogglePageSelect}
            title={isPageAllSelected ? 'Deselect all on page' : 'Select all on page'}
            aria-label="Select all on page"
          >
            {isPageAllSelected ? <Check size={11} strokeWidth={3} /> : null}
          </button>
          <h2 className={styles.title}>{folderName}</h2>
        </div>
        <span className={styles.count}>{threads.length.toLocaleString()} conversations</span>
      </div>

      <ThreadFilterBar
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        currentSort={currentSort}
        onSortChange={onSortChange}
      />

      <BatchActionBar
        selectedCount={effectiveSelectedIds.size}
        totalInView={sortedThreads.length}
        isAllInViewSelected={effectiveSelectedIds.size === sortedThreads.length && sortedThreads.length > 0}
        onSelectAllInView={handleSelectAllInView}
        onClearSelection={onClearSelection}
        onAction={onBatchAction}
      />

      <div className={styles.listContainer}>
        {paginatedThreads.length > 0 ? (
          paginatedThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isSelected={thread.id === selectedThreadId}
              isChecked={effectiveSelectedIds.has(thread.id)}
              onSelect={onSelectThread}
              onToggleStar={onToggleStar}
              onToggleLock={onToggleLock}
              onToggleCheck={onToggleCheck}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <span>No messages found</span>
          </div>
        )}
      </div>

      <ThreadPagination
        totalCount={sortedThreads.length}
        currentPage={safePage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </section>
  );
});
