/**
 * useProductivityData.ts
 * Custom React hook for managing Calendar events, Contacts, and Task items.
 * Handles initial mock loading, backend IPC synchronization, and task toggles/additions.
 */

'use client';

import { useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Contact } from '@/types/contacts';
import { TaskItem } from '@/types/tasks';

interface UseProductivityDataProps {
  initialEvents: CalendarEvent[];
  initialContacts: Contact[];
  initialTasks: TaskItem[];
  activeAccountId: string;
}

export function useProductivityData({
  initialEvents,
  initialContacts,
  initialTasks,
  activeAccountId,
}: UseProductivityDataProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const loadProductivityData = useCallback(async (accountId: string) => {
    if (!window.desktopAPI) return;
    try {
      const [accEvents, accContacts, accTasks] = await Promise.all([
        window.desktopAPI.calendar?.getEvents(accountId),
        window.desktopAPI.contacts?.getContacts(accountId),
        window.desktopAPI.tasks?.getTasks(accountId),
      ]);
      if (accEvents) setEvents(accEvents);
      if (accContacts) setContacts(accContacts);
      if (accTasks) setTasks(accTasks);
    } catch (err) {
      console.warn('Failed to load productivity data:', err);
    }
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  }, []);

  const handleAddTask = useCallback((title: string) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      isCompleted: false,
      isImportant: false,
      category: 'work',
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  return {
    events,
    contacts,
    tasks,
    setEvents,
    setContacts,
    setTasks,
    loadProductivityData,
    handleToggleTask,
    handleAddTask,
  };
}
