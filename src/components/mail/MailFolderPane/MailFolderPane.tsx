import React, { useMemo } from 'react';
import { RotateCw, Trash2, Sparkles } from 'lucide-react';
import { MailFolder } from '@/types/mail';
import { FolderItem } from '@/components/mail/FolderItem/FolderItem';
import styles from './MailFolderPane.module.css';

interface MailFolderPaneProps {
  folders: MailFolder[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onSync?: () => void;
  onResyncAll?: () => void;
  onOpenCleaner?: () => void;
  isSyncing?: boolean;
}

export const MailFolderPane = React.memo(function MailFolderPane({
  folders,
  activeFolderId,
  onSelectFolder,
  onSync,
  onResyncAll,
  onOpenCleaner,
  isSyncing = false,
}: MailFolderPaneProps) {
  const systemFolders = useMemo(() => folders.filter((f) => f.system), [folders]);
  const customFolders = useMemo(() => folders.filter((f) => !f.system), [folders]);

  return (
    <nav className={styles.pane} aria-label="Mail folders">
      <div className={styles.accountHeader}>
        <span className={styles.accountTitle}>Favorites & Folders</span>
        <div className={styles.headerButtons}>
          {onOpenCleaner ? (
            <button
              className={`${styles.syncBtn} ${styles.cleanerBtn}`}
              onClick={onOpenCleaner}
              title="Advanced Mailbox Cleaner"
              aria-label="Advanced Mailbox Cleaner"
              type="button"
            >
              <Sparkles size={13} />
            </button>
          ) : null}
          {onSync ? (
            <button
              className={`${styles.syncBtn} ${isSyncing ? styles.spinning : ''}`}
              onClick={onSync}
              title="Synchronize Mailbox"
              aria-label="Synchronize Mailbox"
              type="button"
              disabled={isSyncing}
            >
              <RotateCw size={13} />
            </button>
          ) : null}
          {onResyncAll ? (
            <button
              className={`${styles.syncBtn} ${styles.dangerBtn}`}
              onClick={() => {
                if (window.confirm('Delete local mailbox cache and re-download all conversations from the server?')) {
                  onResyncAll();
                }
              }}
              title="Delete Cache & Resync Everything"
              aria-label="Delete Cache & Resync Everything"
              type="button"
              disabled={isSyncing}
            >
              <Trash2 size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.folderList}>
        {systemFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={folder.id === activeFolderId}
            onSelect={onSelectFolder}
          />
        ))}

        {customFolders.length > 0 ? (
          <>
            <div className={styles.divider} />
            <div className={styles.sectionHeader}>
              <span className={styles.accountTitle}>Labels & Folders</span>
              <span className={styles.sectionCount}>{customFolders.length}</span>
            </div>
            {customFolders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isActive={folder.id === activeFolderId}
                onSelect={onSelectFolder}
              />
            ))}
          </>
        ) : null}
      </div>

      {onOpenCleaner ? (
        <div className={styles.bottomSection}>
          <button
            type="button"
            className={styles.cleanerPromoBtn}
            onClick={onOpenCleaner}
            title="Open Advanced Mailbox Cleaner"
          >
            <Sparkles size={14} className={styles.cleanerIcon} />
            <div className={styles.cleanerTextGroup}>
              <span className={styles.cleanerBtnTitle}>Mailbox Cleaner</span>
              <span className={styles.cleanerBtnSubtitle}>Rule cleaning & lock protection</span>
            </div>
          </button>
        </div>
      ) : null}
    </nav>
  );
});
