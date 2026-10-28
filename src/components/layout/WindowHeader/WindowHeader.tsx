import React, { useCallback } from 'react';
import { Mail, Minus, Square, X, RotateCw, Columns3, Rows2, SquareSplitHorizontal, Settings, Bell } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { AccountSwitcher } from '@/components/account/AccountSwitcher/AccountSwitcher';
import { AccountConfig } from '@/types/account';
import { MailLayoutMode } from '@/components/settings/SettingsModal/SettingsModal';
import styles from './WindowHeader.module.css';

interface WindowHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  accounts: AccountConfig[];
  activeAccount: AccountConfig | null;
  onSelectAccount: (id: string) => void;
  onOpenAddAccount: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onSimulateIncoming?: () => void;
  layoutMode?: MailLayoutMode;
  onLayoutModeChange?: (mode: MailLayoutMode) => void;
  onOpenSettings?: () => void;
}

export const WindowHeader = React.memo(function WindowHeader({
  searchQuery,
  onSearchChange,
  accounts,
  activeAccount,
  onSelectAccount,
  onOpenAddAccount,
  onSync,
  isSyncing = false,
  onSimulateIncoming,
  layoutMode,
  onLayoutModeChange,
  onOpenSettings,
}: WindowHeaderProps) {
  const handleMinimize = useCallback(() => {
    window.desktopAPI?.window.minimize();
  }, []);

  const handleMaximize = useCallback(() => {
    window.desktopAPI?.window.maximize();
  }, []);

  const handleClose = useCallback(() => {
    window.desktopAPI?.window.close();
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logoBadge}>
          <Mail size={15} strokeWidth={2.4} />
        </div>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>Aura Mail</span>
          <span className={styles.businessTag}>Linux Business</span>
        </div>
      </div>

      <div className={styles.centerSection}>
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className={styles.rightSection}>
        {onSync ? (
          <button
            className={`${styles.actionBtn} ${isSyncing ? styles.spinning : ''}`}
            onClick={onSync}
            title="Sync All Accounts"
            aria-label="Sync All Accounts"
            type="button"
            disabled={isSyncing}
          >
            <RotateCw size={14} />
          </button>
        ) : null}

        {onSimulateIncoming ? (
          <button
            className={styles.actionBtn}
            onClick={onSimulateIncoming}
            title="Simulate Incoming Mail & Notification"
            aria-label="Simulate Incoming Mail"
            type="button"
          >
            <Bell size={14} />
          </button>
        ) : null}

        {onLayoutModeChange && layoutMode ? (
          <div className={styles.layoutGroup} title="Switch Layout View">
            <button
              className={`${styles.layoutBtn} ${layoutMode === 'three-column' ? styles.layoutActive : ''}`}
              onClick={() => onLayoutModeChange('three-column')}
              type="button"
              title="Three Sections: Folders | Thread List | Reading Pane"
              aria-label="Three Sections"
            >
              <Columns3 size={13} />
            </button>
            <button
              className={`${styles.layoutBtn} ${layoutMode === 'bottom-reader' ? styles.layoutActive : ''}`}
              onClick={() => onLayoutModeChange('bottom-reader')}
              type="button"
              title="Two Sections: Thread List Top / Reader Bottom"
              aria-label="Two Sections"
            >
              <Rows2 size={13} />
            </button>
            <button
              className={`${styles.layoutBtn} ${layoutMode === 'separate-page' ? styles.layoutActive : ''}`}
              onClick={() => onLayoutModeChange('separate-page')}
              type="button"
              title="Separate Pages: Full Width List & Reader"
              aria-label="Separate Pages"
            >
              <SquareSplitHorizontal size={13} />
            </button>
          </div>
        ) : null}

        {onOpenSettings ? (
          <button
            className={styles.actionBtn}
            onClick={onOpenSettings}
            title="Display & Layout Settings"
            aria-label="Settings"
            type="button"
          >
            <Settings size={14} />
          </button>
        ) : null}

        <div className={styles.divider} />

        <AccountSwitcher
          accounts={accounts}
          activeAccount={activeAccount}
          onSelectAccount={onSelectAccount}
          onOpenAddAccount={onOpenAddAccount}
        />

        <div className={styles.windowControls}>
          <button
            className={styles.controlBtn}
            onClick={handleMinimize}
            aria-label="Minimize Window"
            title="Minimize"
            type="button"
          >
            <Minus size={14} strokeWidth={2} />
          </button>
          <button
            className={styles.controlBtn}
            onClick={handleMaximize}
            aria-label="Maximize or Restore Window"
            title="Maximize"
            type="button"
          >
            <Square size={12} strokeWidth={2} />
          </button>
          <button
            className={`${styles.controlBtn} ${styles.closeBtn}`}
            onClick={handleClose}
            aria-label="Close Application"
            title="Close"
            type="button"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
});
