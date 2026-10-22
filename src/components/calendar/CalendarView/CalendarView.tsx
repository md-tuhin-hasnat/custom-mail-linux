import React from 'react';
import { Plus } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { EventCard } from '@/components/calendar/EventCard/EventCard';
import { Button } from '@/components/common/Button/Button';
import styles from './CalendarView.module.css';

interface CalendarViewProps {
  events: CalendarEvent[];
  onCreateEvent: () => void;
}

export const CalendarView = React.memo(function CalendarView({
  events,
  onCreateEvent,
}: CalendarViewProps) {
  const handleJoinMeeting = React.useCallback((link: string) => {
    window.open(link, '_blank');
  }, []);

  return (
    <section className={styles.container} aria-label="Calendar view">
      <div className={styles.topBar}>
        <h1 className={styles.title}>Calendar & Meetings</h1>
        <Button
          variant="primary"
          icon={<Plus size={14} />}
          onClick={onCreateEvent}
        >
          New Event
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.dateHeader}>Upcoming Schedule</div>
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            onJoinMeeting={handleJoinMeeting}
          />
        ))}
      </div>
    </section>
  );
});
