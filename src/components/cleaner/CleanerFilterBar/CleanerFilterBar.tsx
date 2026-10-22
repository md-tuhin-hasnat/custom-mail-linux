/**
 * CleanerFilterBar.tsx
 * Advanced search and filter controls for the Mailbox Cleaner.
 * Provides an email/name/domain instant search input, volume/category filter chips,
 * sender sorting dropdown, and date-range presets with custom date pickers.
 */

'use client';

import React from 'react';
import { Search, X, Calendar, ArrowUpDown } from 'lucide-react';
import styles from './CleanerFilterBar.module.css';

export type CleanerSenderFilter = 'all' | 'high-volume' | 'newsletters' | 'attachments' | 'locked';
export type CleanerSenderSort = 'count-desc' | 'alpha-asc' | 'date-desc' | 'date-asc';
export type CleanerDatePreset = 'all' | '30' | '90' | '180' | '365' | 'custom';

interface CleanerFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: CleanerSenderFilter;
  onFilterChange: (f: CleanerSenderFilter) => void;
  currentSort: CleanerSenderSort;
  onSortChange: (s: CleanerSenderSort) => void;
  datePreset: CleanerDatePreset;
  onDatePresetChange: (p: CleanerDatePreset) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
}

export const CleanerFilterBar = React.memo(function CleanerFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  datePreset,
  onDatePresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: CleanerFilterBarProps) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.topRow}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search senders by email address, name, or domain (e.g. @github.com, newsletter)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <select
          className={styles.sortSelect}
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as CleanerSenderSort)}
          aria-label="Sort senders by"
        >
          <option value="count-desc">Most Emails First</option>
          <option value="alpha-asc">Alphabetical (A - Z)</option>
          <option value="date-desc">Newest Activity First</option>
          <option value="date-asc">Oldest Activity First</option>
        </select>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.chipsGroup}>
          <button
            type="button"
            className={`${styles.chipBtn} ${activeFilter === 'all' ? styles.chipActive : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All Senders
          </button>
          <button
            type="button"
            className={`${styles.chipBtn} ${activeFilter === 'high-volume' ? styles.chipActive : ''}`}
            onClick={() => onFilterChange('high-volume')}
          >
            High Volume (&gt;5)
          </button>
          <button
            type="button"
            className={`${styles.chipBtn} ${activeFilter === 'newsletters' ? styles.chipActive : ''}`}
            onClick={() => onFilterChange('newsletters')}
          >
            Newsletters & Alerts
          </button>
          <button
            type="button"
            className={`${styles.chipBtn} ${activeFilter === 'attachments' ? styles.chipActive : ''}`}
            onClick={() => onFilterChange('attachments')}
          >
            With Attachments
          </button>
          <button
            type="button"
            className={`${styles.chipBtn} ${activeFilter === 'locked' ? styles.chipActive : ''}`}
            onClick={() => onFilterChange('locked')}
          >
            Has Protected (Locked)
          </button>
        </div>

        <div className={styles.dateFilterGroup}>
          <span className={styles.dateLabel}>Clean Date Range:</span>
          <select
            className={styles.dateSelect}
            value={datePreset}
            onChange={(e) => onDatePresetChange(e.target.value as CleanerDatePreset)}
          >
            <option value="all">All Dates</option>
            <option value="30">Older than 30 days</option>
            <option value="90">Older than 90 days</option>
            <option value="180">Older than 180 days</option>
            <option value="365">Older than 1 year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {datePreset === 'custom' ? (
            <>
              <input
                type="date"
                className={styles.dateInput}
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                title="From Date"
              />
              <span className={styles.dateLabel}>to</span>
              <input
                type="date"
                className={styles.dateInput}
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                title="To Date"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
});
