/**
 * AppRail Component
 * 
 * Primary vertical navigation rail for switching between Mail, Mailbox Cleaner,
 * Compose page, Calendar, Contacts, Tasks, and Settings.
 */

import React from 'react';
import { Mail, Calendar, Users, CheckSquare, Settings, PenSquare, Sparkles } from 'lucide-react';
import styles from './AppRail.module.css';

export type ActiveTab = 'mail' | 'cleaner' | 'calendar' | 'contacts' | 'tasks' | 'compose';

interface AppRailProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onComposeClick: () => void;
  unreadCount?: number;
  onOpenSettings?: () => void;
}

export const AppRail = React.memo(function AppRail({
  activeTab,
  onTabChange,
  onComposeClick,
  unreadCount = 0,
  onOpenSettings,
}: AppRailProps) {
  return (
    <aside className={styles.rail}>
      <button
        className={`${styles.composeButton} ${activeTab === 'compose' ? styles.activeCompose : ''}`}
        onClick={onComposeClick}
        title="Compose New Message (Ctrl+N)"
        type="button"
      >
        <PenSquare size={20} />
      </button>

      <nav className={styles.navGroup}>
        <button
          className={`${styles.navItem} ${activeTab === 'mail' ? styles.active : ''}`}
          onClick={() => onTabChange('mail')}
          title="Mail"
          type="button"
        >
          <Mail size={20} />
          <span>Mail</span>
          {unreadCount > 0 ? (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          ) : null}
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'cleaner' ? styles.active : ''}`}
          onClick={() => onTabChange('cleaner')}
          title="Mailbox Cleaner"
          type="button"
        >
          <Sparkles size={20} />
          <span>Cleaner</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'calendar' ? styles.active : ''}`}
          onClick={() => onTabChange('calendar')}
          title="Calendar"
          type="button"
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'contacts' ? styles.active : ''}`}
          onClick={() => onTabChange('contacts')}
          title="People"
          type="button"
        >
          <Users size={20} />
          <span>People</span>
        </button>

        <button
          className={`${styles.navItem} ${activeTab === 'tasks' ? styles.active : ''}`}
          onClick={() => onTabChange('tasks')}
          title="To Do"
          type="button"
        >
          <CheckSquare size={20} />
          <span>To Do</span>
        </button>
      </nav>

      <div className={styles.spacer} />

      <div className={styles.bottomGroup}>
        <button
          className={styles.navItem}
          title="Settings & Display Preferences"
          type="button"
          onClick={onOpenSettings}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
});
