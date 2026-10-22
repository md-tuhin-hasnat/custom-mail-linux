/**
 * productivityIpc.ts
 * Electron IPC handlers for Calendar, Contacts, and Task items.
 * Provides data access and mutations for productivity views per active account.
 */

import { ipcMain } from 'electron';
import { StorageService } from '../services/storageService';
import { CalendarEvent } from '../../types/calendar';
import { TaskItem } from '../../types/tasks';

export function registerProductivityIpc(
  storage: StorageService,
  getTargetAccountId: (id?: string) => string
) {
  // Calendar operations
  ipcMain.handle('calendar:get-events', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    return storage.getAccountData(id).events;
  });

  ipcMain.handle(
    'calendar:create-event',
    async (_, { event, accountId }: { event: Partial<CalendarEvent>; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const newEvent: CalendarEvent = {
        id: `ev-${Date.now()}`,
        title: event.title || 'New Meeting',
        description: event.description || '',
        location: event.location || 'Online',
        startTime: event.startTime || new Date().toISOString(),
        endTime: event.endTime || new Date(Date.now() + 3600000).toISOString(),
        isAllDay: event.isAllDay || false,
        category: event.category || 'meeting',
        attendees: event.attendees || [],
        meetingLink: event.meetingLink,
      };
      data.events = [...data.events, newEvent];
      storage.saveAccountData(id, data);
      return newEvent;
    }
  );

  // Contacts operations
  ipcMain.handle('contacts:get-contacts', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    return storage.getAccountData(id).contacts;
  });

  // Tasks operations
  ipcMain.handle('tasks:get-tasks', async (_, accountId?: string) => {
    const id = getTargetAccountId(accountId);
    return storage.getAccountData(id).tasks;
  });

  ipcMain.handle(
    'tasks:toggle-task',
    async (_, { taskId, accountId }: { taskId: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      let isCompleted = false;
      data.tasks = data.tasks.map((item) => {
        if (item.id === taskId) {
          isCompleted = !item.isCompleted;
          return { ...item, isCompleted };
        }
        return item;
      });
      storage.saveAccountData(id, data);
      return isCompleted;
    }
  );

  ipcMain.handle(
    'tasks:create-task',
    async (_, { title, accountId }: { title: string; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const newTask: TaskItem = {
        id: `tsk-${Date.now()}`,
        title,
        dueDate: 'Today',
        isCompleted: false,
        isImportant: false,
        category: 'work',
      };
      data.tasks = [newTask, ...data.tasks];
      storage.saveAccountData(id, data);
      return newTask;
    }
  );
}
