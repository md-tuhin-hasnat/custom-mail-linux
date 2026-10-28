import React from 'react';
import { Inbox, Send, SendHorizontal, FileText, Archive, AlertOctagon, Trash2, Folder } from 'lucide-react';
import { MailFolder } from '@/types/mail';
import styles from './FolderItem.module.css';

interface FolderItemProps {
  folder: MailFolder;
  isActive: boolean;
  onSelect: (id: string) => void;
}

function getFolderIcon(iconName: string) {
  switch (iconName) {
    case 'Inbox':
      return <Inbox size={16} />;
    case 'Send':
      return <Send size={16} />;
    case 'SendHorizontal':
    case 'Outbox':
      return <SendHorizontal size={16} />;
    case 'FileText':
      return <FileText size={16} />;
    case 'Archive':
      return <Archive size={16} />;
    case 'AlertOctagon':
      return <AlertOctagon size={16} />;
    case 'Trash2':
      return <Trash2 size={16} />;
    default:
      return <Folder size={16} />;
  }
}

export const FolderItem = React.memo(function FolderItem({
  folder,
  isActive,
  onSelect,
}: FolderItemProps) {
  const icon = getFolderIcon(folder.icon);

  return (
    <button
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      onClick={() => onSelect(folder.id)}
      type="button"
    >
      <div className={styles.left}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.name}>{folder.name}</span>
      </div>
      {folder.unreadCount > 0 ? (
        <span className={styles.count} suppressHydrationWarning>
          {folder.unreadCount}
        </span>
      ) : null}
    </button>
  );
});
