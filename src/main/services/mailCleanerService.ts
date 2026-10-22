/**
 * mailCleanerService.ts
 * Core mailbox cleaning and filtering engine.
 * Matches threads against multi-criteria rules (senders, date ranges, folder scopes),
 * strictly isolates and protects locked messages/threads from deletion,
 * records tombstone markers in AccountDataStore, and computes unique sender statistics.
 */

import {
  MailThread,
  MailCleanerCriteria,
  MailCleanerPreviewResult,
  MailCleanerExecuteResult,
  UniqueSenderStats,
} from '../../types/mail';
import { AccountDataStore } from './storageService';
import { updateFolderCounts } from './gmailImapSync';

function parseTimestamp(dateStr?: string): number | null {
  if (!dateStr || dateStr === 'Recent' || dateStr === 'Just now') return Date.now();
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? null : parsed;
}

export function matchCleanerCriteria(threads: MailThread[], criteria: MailCleanerCriteria) {
  const now = Date.now();
  const olderThanMs = criteria.olderThanDays ? criteria.olderThanDays * 86400000 : null;
  const startMs = criteria.startDate ? Date.parse(criteria.startDate) : null;
  const endMs = criteria.endDate ? Date.parse(criteria.endDate) + 86399999 : null;

  const matched: MailThread[] = [];
  const protectedLocked: MailThread[] = [];
  const eligibleToDelete: MailThread[] = [];

  for (const t of threads) {
    // 1. Folder check
    if (criteria.folderId && criteria.folderId !== 'all') {
      if (t.folderId !== criteria.folderId) continue;
    }

    // 2. Category check
    if (criteria.category && criteria.category !== 'all') {
      if (t.category !== criteria.category) continue;
    }

    // 3. Sender address match (exact list or string search)
    if (criteria.senderEmails && criteria.senderEmails.length > 0) {
      const emailSet = new Set(criteria.senderEmails.map((e) => e.trim().toLowerCase()));
      const hasSender = t.participants.some((p) => emailSet.has(p.email.toLowerCase()));
      if (!hasSender) continue;
    } else if (criteria.senderEmail && criteria.senderEmail.trim()) {
      const target = criteria.senderEmail.trim().toLowerCase();
      const hasSender = t.participants.some(
        (p) => p.email.toLowerCase().includes(target) || p.name.toLowerCase().includes(target)
      );
      if (!hasSender) continue;
    }

    // 4. Sender domain match (@domain.com)
    if (criteria.senderDomain && criteria.senderDomain.trim()) {
      const domain = criteria.senderDomain.trim().toLowerCase().replace(/^@/, '');
      const hasDomain = t.participants.some((p) => {
        const email = p.email.toLowerCase();
        return email.endsWith(`@${domain}`) || email.includes(`@${domain}`);
      });
      if (!hasDomain) continue;
    }

    // 5. Date filter
    const ts = parseTimestamp(t.lastDate);
    if (ts !== null) {
      if (olderThanMs !== null && now - ts < olderThanMs) continue;
      if (startMs !== null && ts < startMs) continue;
      if (endMs !== null && ts > endMs) continue;
    }

    // 6. Read state
    if (criteria.onlyRead && !t.isRead) continue;

    // 7. Attachments
    if (criteria.onlyWithAttachments && !t.hasAttachments) continue;

    // Matched filter!
    matched.push(t);
    if (t.isLocked) {
      protectedLocked.push(t);
    } else {
      eligibleToDelete.push(t);
    }
  }

  return { matched, protectedLocked, eligibleToDelete };
}

export function previewCleanMailbox(
  threads: MailThread[],
  criteria: MailCleanerCriteria
): MailCleanerPreviewResult {
  const { matched, protectedLocked, eligibleToDelete } = matchCleanerCriteria(threads, criteria);

  const sampleSenders = Array.from(
    new Set(matched.flatMap((t) => t.participants.map((p) => p.email)))
  ).slice(0, 5);

  const sampleSubjects = matched.slice(0, 5).map((t) => t.subject);

  return {
    matchedCount: matched.length,
    eligibleCount: eligibleToDelete.length,
    lockedProtectedCount: protectedLocked.length,
    sampleSenders,
    sampleSubjects,
  };
}

export function executeCleanMailbox(
  data: AccountDataStore,
  criteria: MailCleanerCriteria
): MailCleanerExecuteResult {
  const { matched, protectedLocked, eligibleToDelete } = matchCleanerCriteria(data.threads, criteria);
  const eligibleIds = new Set<string>(eligibleToDelete.map((t) => t.id));
  const eligibleIdsArray = Array.from(eligibleIds);
  const eligibleMsgIds: string[] = eligibleToDelete.flatMap((t) => t.messages.map((m) => m.id));

  // Permanently record in tombstones so sync will NEVER resurrect deleted threads or messages
  data.deletedThreadIds = Array.from(
    new Set<string>([...(data.deletedThreadIds || []), ...eligibleIdsArray])
  );
  data.deletedMessageIds = Array.from(
    new Set<string>([...(data.deletedMessageIds || []), ...eligibleMsgIds])
  );

  if (criteria.deletePermanently) {
    // Completely remove from local mailbox
    data.threads = data.threads.filter((t: MailThread) => !eligibleIds.has(t.id));
  } else {
    // Move to trash
    data.threads = data.threads.map((t: MailThread) => {
      if (eligibleIds.has(t.id)) {
        return {
          ...t,
          folderId: 'trash',
          messages: t.messages.map((m) => ({ ...m, folderId: 'trash' })),
        };
      }
      return t;
    });
  }

  updateFolderCounts(data);

  return {
    matchedCount: matched.length,
    deletedCount: eligibleToDelete.length,
    lockedProtectedCount: protectedLocked.length,
  };
}

export function extractUniqueSenderStats(threads: MailThread[]): UniqueSenderStats[] {
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

  return Array.from(map.values()).sort((a, b) => b.threadCount - a.threadCount);
}
