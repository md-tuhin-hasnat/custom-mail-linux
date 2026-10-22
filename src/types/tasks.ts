export interface TaskItem {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  isImportant: boolean;
  category: 'work' | 'follow-up' | 'personal';
  linkedEmailId?: string;
}
