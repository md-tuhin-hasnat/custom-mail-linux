import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './ThreadPagination.module.css';

interface ThreadPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const ThreadPagination = React.memo(function ThreadPagination({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ThreadPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, totalCount);

  return (
    <nav className={styles.paginationContainer} aria-label="Thread pagination">
      <div className={styles.infoSection}>
        <span>
          Showing <span className={styles.rangeBadge}>{startIdx}–{endIdx}</span> of{' '}
          <span className={styles.totalNumber}>{totalCount.toLocaleString()}</span>
        </span>
      </div>

      <div className={styles.rightControls}>
        <div className={styles.sizeSegment} role="group" aria-label="Page size">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              className={`${styles.sizeBtn} ${pageSize === size ? styles.sizeBtnActive : ''}`}
              onClick={() => onPageSizeChange(size)}
            >
              {size}
            </button>
          ))}
        </div>

        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft size={13} />
          </button>

          <button
            type="button"
            className={styles.navButton}
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={13} />
          </button>

          <span className={styles.pageBadge}>
            {safePage} / {totalPages}
          </span>

          <button
            type="button"
            className={styles.navButton}
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight size={13} />
          </button>

          <button
            type="button"
            className={styles.navButton}
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </nav>
  );
});
