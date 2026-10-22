import React from 'react';
import { RotateCw } from 'lucide-react';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  itemCount: number;
  syncStatus?: string;
  isSyncing?: boolean;
  syncProgress?: { current: number; total: number };
  connectionName?: string;
}

export const StatusBar = React.memo(function StatusBar({
  itemCount,
  syncStatus = 'All folders up to date',
  isSyncing = false,
  syncProgress,
  connectionName = 'Connected to Microsoft Exchange',
}: StatusBarProps) {
  const percent =
    syncProgress && syncProgress.total > 0
      ? Math.min(100, Math.round((syncProgress.current / syncProgress.total) * 100))
      : 0;

  return (
    <footer className={styles.bar}>
      <div className={styles.left}>
        <span className={`${styles.dot} ${isSyncing ? styles.syncingDot : ''}`} />
        <span>{connectionName}</span>
      </div>

      <div className={styles.right}>
        {isSyncing && syncProgress && syncProgress.total > 0 ? (
          <div className={styles.progressContainer}>
            <span className={styles.spinning}>
              <RotateCw size={11} color="var(--accent-blue)" />
            </span>
            <div className={styles.progressBarBg} title={`${percent}%`}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={styles.syncText}>{percent}%</span>
          </div>
        ) : null}

        <span className={styles.syncText}>{syncStatus}</span>
        <span className={styles.itemCount}>
          {itemCount.toLocaleString()} {itemCount === 1 ? 'conversation' : 'conversations'}
        </span>
      </div>
    </footer>
  );
});
