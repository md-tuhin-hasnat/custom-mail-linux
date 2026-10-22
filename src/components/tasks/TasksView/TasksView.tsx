import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem as TaskType } from '@/types/tasks';
import { TaskItem } from '@/components/tasks/TaskItem/TaskItem';
import { Button } from '@/components/common/Button/Button';
import styles from './TasksView.module.css';

interface TasksViewProps {
  tasks: TaskType[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
}

export const TasksView = React.memo(function TasksView({
  tasks,
  onToggleTask,
  onAddTask,
}: TasksViewProps) {
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim());
    setNewTitle('');
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <section className={styles.container} aria-label="Tasks and To-Do list">
      <div className={styles.topBar}>
        <h1 className={styles.title}>To Do & Tasks</h1>
      </div>

      <form onSubmit={handleAdd} className={styles.inputBar}>
        <input
          type="text"
          className={styles.input}
          placeholder="Add a new task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button variant="primary" type="submit" icon={<Plus size={14} />}>
          Add
        </Button>
      </form>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>Tasks ({pendingTasks.length})</div>
        {pendingTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
        ))}

        {completedTasks.length > 0 ? (
          <>
            <div className={styles.sectionHeader}>
              Completed ({completedTasks.length})
            </div>
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
});
