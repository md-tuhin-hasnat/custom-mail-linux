/**
 * useUniqueSenders.ts
 * High-performance hook for aggregating and memoizing unique sender statistics across thousands of mail threads.
 * Extracts unique email addresses, sender display names, sender domains, conversation counts,
 * attachment flags, and lock counts. Provides instantaneous filtering and multi-criteria sorting.
 */

'use client';

import { useMemo } from 'react';
import { MailThread, UniqueSenderStats } from '@/types/mail';
import { CleanerSenderFilter, CleanerSenderSort } from './CleanerFilterBar/CleanerFilterBar';

export function useUniqueSenders(
  threads: MailThread[],
  searchQuery: string,
  activeFilter: CleanerSenderFilter,
  currentSort: CleanerSenderSort
) {
  const allSenders = useMemo(() => {
    const map = new Map<string, UniqueSenderStats>();

    for (const t of threads) {
      for (const p of t.participants) {
        const email = p.email?.trim().toLowerCase();
        if (!email) continue;
        const domain = email.includes('@') ? email.split('@')[1] : '';

        const existing = map.get(email);
        if (existing) {
          if (!existing.threadIds.includes(t.id)) {
            existing.threadIds.push(t.id);
            existing.threadCount++;
            existing.messageCount += t.messageCount || 1;
            if (!t.isRead) existing.unreadCount++;
            if (t.hasAttachments) existing.hasAttachments = true;
            if (t.isLocked) existing.lockedCount++;
          }
        } else {
          map.set(email, {
            email,
            name: p.name || email.split('@')[0],
            domain,
            threadCount: 1,
            messageCount: t.messageCount || 1,
            unreadCount: t.isRead ? 0 : 1,
            hasAttachments: Boolean(t.hasAttachments),
            lockedCount: t.isLocked ? 1 : 0,
            lastDate: t.lastDate || '',
            threadIds: [t.id],
          });
        }
      }
    }

    return Array.from(map.values());
  }, [threads]);

  const filteredSenders = useMemo(() => {
    let result = allSenders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'high-volume') {
      result = result.filter((s) => s.threadCount >= 5);
    } else if (activeFilter === 'newsletters') {
      result = result.filter(
        (s) =>
          s.email.includes('news') ||
          s.email.includes('promo') ||
          s.email.includes('alert') ||
          s.email.includes('notify') ||
          s.email.includes('no-reply') ||
          s.email.includes('noreply') ||
          s.name.toLowerCase().includes('newsletter')
      );
    } else if (activeFilter === 'attachments') {
      result = result.filter((s) => s.hasAttachments);
    } else if (activeFilter === 'locked') {
      result = result.filter((s) => s.lockedCount > 0);
    }

    return [...result].sort((a, b) => {
      if (currentSort === 'count-desc') return b.threadCount - a.threadCount;
      if (currentSort === 'alpha-asc') return a.name.localeCompare(b.name);
      if (currentSort === 'date-desc') return (b.lastDate || '').localeCompare(a.lastDate || '');
      if (currentSort === 'date-asc') return (a.lastDate || '').localeCompare(b.lastDate || '');
      return 0;
    });
  }, [allSenders, searchQuery, activeFilter, currentSort]);

  const totalLocked = useMemo(() => {
    return threads.filter((t) => t.isLocked).length;
  }, [threads]);

  return {
    allSenders,
    filteredSenders,
    totalSenders: allSenders.length,
    totalConversations: threads.length,
    totalLocked,
  };
}
