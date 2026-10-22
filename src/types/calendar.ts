export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAllDay: boolean;
  category: 'work' | 'meeting' | 'personal' | 'urgent';
  attendees: { name: string; email: string; rsvpStatus: 'accepted' | 'declined' | 'tentative' | 'pending' }[];
  meetingLink?: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}
