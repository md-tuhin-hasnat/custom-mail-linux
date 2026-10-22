import { MailThread } from '@/types/mail';
import { ThreadSortOption } from '@/components/mail/ThreadSortDropdown/ThreadSortDropdown';

function parseTimestamp(thread: MailThread): number {
  if (thread.messages && thread.messages.length > 0) {
    const raw = thread.messages[thread.messages.length - 1]?.date;
    if (raw) {
      const parsed = Date.parse(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  const parsedLastDate = Date.parse(thread.lastDate);
  if (!Number.isNaN(parsedLastDate)) return parsedLastDate;
  return 0;
}

export function sortThreads(threads: MailThread[], sortOption: ThreadSortOption): MailThread[] {
  const copy = [...threads];

  switch (sortOption) {
    case 'date-asc':
      return copy.sort((a, b) => parseTimestamp(a) - parseTimestamp(b));
    case 'date-desc':
      return copy.sort((a, b) => parseTimestamp(b) - parseTimestamp(a));
    case 'sender-asc':
      return copy.sort((a, b) => {
        const nameA = a.participants[0]?.name || '';
        const nameB = b.participants[0]?.name || '';
        return nameA.localeCompare(nameB);
      });
    case 'subject-asc':
      return copy.sort((a, b) => a.subject.localeCompare(b.subject));
    case 'unread-first':
      return copy.sort((a, b) => {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        return parseTimestamp(b) - parseTimestamp(a);
      });
    case 'starred-first':
      return copy.sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return parseTimestamp(b) - parseTimestamp(a);
      });
    default:
      return copy;
  }
}
