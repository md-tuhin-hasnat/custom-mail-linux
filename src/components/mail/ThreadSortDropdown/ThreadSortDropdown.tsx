import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownUp, Check } from 'lucide-react';
import styles from './ThreadSortDropdown.module.css';

export type ThreadSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'sender-asc'
  | 'subject-asc'
  | 'unread-first'
  | 'starred-first';

interface ThreadSortDropdownProps {
  currentSort: ThreadSortOption;
  onSortChange: (sort: ThreadSortOption) => void;
}

const SORT_LABELS: Record<ThreadSortOption, string> = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'sender-asc': 'Sender (A–Z)',
  'subject-asc': 'Subject (A–Z)',
  'unread-first': 'Unread first',
  'starred-first': 'Starred first',
};

export const ThreadSortDropdown = React.memo(function ThreadSortDropdown({
  currentSort,
  onSortChange,
}: ThreadSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (sort: ThreadSortOption) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        className={`${styles.sortButton} ${isOpen ? styles.sortButtonActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Sort conversation list"
        aria-expanded={isOpen}
      >
        <ArrowDownUp size={12} />
        <span>{SORT_LABELS[currentSort]}</span>
      </button>

      {isOpen ? (
        <div className={styles.dropdownMenu} role="menu">
          {(Object.keys(SORT_LABELS) as ThreadSortOption[]).map((key) => {
            const isSelected = key === currentSort;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.menuItem} ${isSelected ? styles.itemActive : ''}`}
                onClick={() => handleSelect(key)}
                role="menuitem"
              >
                <span>{SORT_LABELS[key]}</span>
                {isSelected ? <Check size={12} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});
