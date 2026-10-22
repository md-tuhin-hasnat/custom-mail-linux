import React from 'react';
import { Clock, MapPin, Users, Video } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: CalendarEvent;
  onJoinMeeting?: (link: string) => void;
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export const EventCard = React.memo(function EventCard({
  event,
  onJoinMeeting,
}: EventCardProps) {
  const categoryClass = styles[event.category] || styles.meeting;

  return (
    <article className={`${styles.card} ${categoryClass}`}>
      <div className={styles.topRow}>
        <h3 className={styles.title}>{event.title}</h3>
        <span className={styles.time}>
          <Clock size={12} />
          {formatTimeRange(event.startTime, event.endTime)}
        </span>
      </div>

      {event.description ? (
        <p className={styles.description}>{event.description}</p>
      ) : null}

      <div className={styles.footer}>
        {event.location ? (
          <span className={styles.metaItem}>
            <MapPin size={12} />
            {event.location}
          </span>
        ) : null}

        {event.attendees && event.attendees.length > 0 ? (
          <span className={styles.metaItem}>
            <Users size={12} />
            {event.attendees.length} attendees
          </span>
        ) : null}

        {event.meetingLink && onJoinMeeting ? (
          <button
            className={styles.metaItem}
            onClick={() => onJoinMeeting(event.meetingLink!)}
            style={{ color: 'var(--accent-blue)', fontWeight: 600 }}
            type="button"
          >
            <Video size={12} />
            Join Teams Meeting
          </button>
        ) : null}
      </div>
    </article>
  );
});
