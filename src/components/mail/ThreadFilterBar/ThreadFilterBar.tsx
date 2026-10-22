import React from 'react';
import { Star, Paperclip, Mail } from 'lucide-react';
import { ThreadSortDropdown, ThreadSortOption } from '@/components/mail/ThreadSortDropdown/ThreadSortDropdown';
import styles from './ThreadFilterBar.module.css';

export type QuickFilterType = 'all' | 'unread' | 'starred' | 'attachments';

interface ThreadFilterBarProps {
  activeCategory: 'focused' | 'other' | 'all';
  onCategoryChange: (cat: 'focused' | 'other' | 'all') => void;
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  currentSort: ThreadSortOption;
  onSortChange: (sort: ThreadSortOption) => void;
}

export const ThreadFilterBar = React.memo(function ThreadFilterBar({
  activeCategory,
  onCategoryChange,
  activeFilter,
  onFilterChange,
  currentSort,
  onSortChange,
}: ThreadFilterBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.categorySegment} role="tablist" aria-label="Mail categories">
          <button
            className={`${styles.tab} ${activeCategory === 'focused' ? styles.tabActive : ''}`}
            onClick={() => onCategoryChange('focused')}
            type="button"
            role="tab"
            aria-selected={activeCategory === 'focused'}
          >
            Focused
          </button>
          <button
            className={`${styles.tab} ${activeCategory === 'other' ? styles.tabActive : ''}`}
            onClick={() => onCategoryChange('other')}
            type="button"
            role="tab"
            aria-selected={activeCategory === 'other'}
          >
            Other
          </button>
          <button
            className={`${styles.tab} ${activeCategory === 'all' ? styles.tabActive : ''}`}
            onClick={() => onCategoryChange('all')}
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
          >
            All
          </button>
        </div>

        <ThreadSortDropdown currentSort={currentSort} onSortChange={onSortChange} />
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.filterPills} role="group" aria-label="Quick filters">
          <button
            type="button"
            className={`${styles.pill} ${activeFilter === 'all' ? styles.pillActive : ''}`}
            onClick={() => onFilterChange('all')}
          >
            <span>All</span>
          </button>
          <button
            type="button"
            className={`${styles.pill} ${activeFilter === 'unread' ? styles.pillActive : ''}`}
            onClick={() => onFilterChange('unread')}
          >
            <span className={styles.unreadDot} />
            <span>Unread</span>
          </button>
          <button
            type="button"
            className={`${styles.pill} ${activeFilter === 'starred' ? styles.pillActive : ''}`}
            onClick={() => onFilterChange('starred')}
          >
            <Star size={11} fill={activeFilter === 'starred' ? 'currentColor' : 'none'} />
            <span>Starred</span>
          </button>
          <button
            type="button"
            className={`${styles.pill} ${activeFilter === 'attachments' ? styles.pillActive : ''}`}
            onClick={() => onFilterChange('attachments')}
          >
            <Paperclip size={11} />
            <span>Attachments</span>
          </button>
        </div>
      </div>
    </div>
  );
});
