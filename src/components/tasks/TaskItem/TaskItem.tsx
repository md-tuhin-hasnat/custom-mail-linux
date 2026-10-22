import React from 'react';
import { Check, Star, Calendar } from 'lucide-react';
import { TaskItem as TaskType } from '@/types/tasks';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: TaskType;
  onToggle: (id: string) => void;
}

export const TaskItem = React.memo(function TaskItem({
  task,
  onToggle,
}: TaskItemProps) {
  return (
    <div
      className={styles.item}
      onClick={() => onToggle(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onToggle(task.id);
      }}
    >
      <div
        className={`${styles.checkbox} ${task.isCompleted ? styles.checkboxChecked : ''}`}
      >
        {task.isCompleted ? <Check size={12} strokeWidth={3} /> : null}
      </div>

      <div className={styles.content}>
        <span
          className={`${styles.title} ${task.isCompleted ? styles.titleDone : ''}`}
        >
          {task.title}
        </span>
        {task.dueDate ? (
          <div className={styles.dueRow}>
            <Calendar size={11} />
            <span>Due {task.dueDate}</span>
          </div>
        ) : null}
      </div>

      {task.isImportant ? (
        <span className={styles.starActive}>
          <Star size={14} fill="currentColor" />
        </span>
      ) : null}
    </div>
  );
});
