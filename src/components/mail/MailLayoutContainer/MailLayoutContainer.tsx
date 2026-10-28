/**
 * MailLayoutContainer.tsx
 * Orchestrates the active mail view based on user layout preference:
 * - Three-Column: Folder pane | Thread list pane | Message viewer pane.
 * - Bottom-Reader: Folder pane | (Thread list pane stacked on top of Message viewer pane).
 * - Separate-Page: Folder pane | (Full-width Thread list pane OR Full-width Message viewer pane).
 * Encapsulates view transitions and layout splits cleanly.
 */

'use client';

import React from 'react';
import { MailFolder, MailThread, MailMessage } from '@/types/mail';
import { MailLayoutMode, DefaultCanvasTheme } from '@/components/settings/SettingsModal/SettingsModal';
import { QuickFilterType } from '@/components/mail/ThreadFilterBar/ThreadFilterBar';
import { ThreadSortOption } from '@/components/mail/ThreadSortDropdown/ThreadSortDropdown';
import { BatchActionType } from '@/components/mail/BatchActionBar/BatchActionBar';
import { MailFolderPane } from '@/components/mail/MailFolderPane/MailFolderPane';
import { ThreadListPane } from '@/components/mail/ThreadListPane/ThreadListPane';
import { MessageViewerPane } from '@/components/mail/MessageViewerPane/MessageViewerPane';
import styles from './MailLayoutContainer.module.css';

interface MailLayoutContainerProps {
  layoutMode: MailLayoutMode;
  separateView: 'list' | 'reader';
  onSetSeparateView: (v: 'list' | 'reader') => void;
  folders: MailFolder[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onSync: () => void;
  onResyncAll: () => void;
  onOpenCleaner: () => void;
  isSyncing: boolean;
  folderName: string;
  threads: MailThread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLock: (id: string) => void;
  activeCategory: 'focused' | 'other' | 'all';
  onCategoryChange: (cat: 'focused' | 'other' | 'all') => void;
  activeFilter: QuickFilterType;
  onFilterChange: (f: QuickFilterType) => void;
  currentSort: ThreadSortOption;
  onSortChange: (s: ThreadSortOption) => void;
  selectedThreadIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onSelectMultiple: (ids: string[], select: boolean) => void;
  onClearSelection: () => void;
  onBatchAction: (action: BatchActionType) => void;
  selectedThread: MailThread | null;
  activeAccountId: string;
  activeAccountEmail?: string;
  onReply: () => void;
  onDeleteThread: (id: string) => void;
  onMessagesUpdated: (threadId: string, messages: MailMessage[]) => void;
  canvasTheme: DefaultCanvasTheme;
}

export const MailLayoutContainer = React.memo(function MailLayoutContainer({
  layoutMode,
  separateView,
  onSetSeparateView,
  folders,
  activeFolderId,
  onSelectFolder,
  onSync,
  onResyncAll,
  onOpenCleaner,
  isSyncing,
  folderName,
  threads,
  selectedThreadId,
  onSelectThread,
  onToggleStar,
  onToggleLock,
  activeCategory,
  onCategoryChange,
  activeFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  selectedThreadIds,
  onToggleCheck,
  onSelectMultiple,
  onClearSelection,
  onBatchAction,
  selectedThread,
  activeAccountId,
  activeAccountEmail,
  onReply,
  onDeleteThread,
  onMessagesUpdated,
  canvasTheme,
}: MailLayoutContainerProps) {
  if (layoutMode === 'bottom-reader') {
    return (
      <div className={styles.mailContainerBottom}>
        <MailFolderPane
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onSync={onSync}
          onResyncAll={onResyncAll}
          onOpenCleaner={onOpenCleaner}
          isSyncing={isSyncing}
        />
        <div className={styles.bottomSplitArea}>
          <div className={styles.bottomSplitTop}>
            <ThreadListPane
              folderName={folderName}
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThread={onSelectThread}
              onToggleStar={onToggleStar}
              onToggleLock={onToggleLock}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              currentSort={currentSort}
              onSortChange={onSortChange}
              selectedThreadIds={selectedThreadIds}
              onToggleCheck={onToggleCheck}
              onSelectMultiple={onSelectMultiple}
              onClearSelection={onClearSelection}
              onBatchAction={onBatchAction}
              fullWidth={true}
            />
          </div>
          <div className={styles.bottomSplitBottom}>
            <MessageViewerPane
              thread={selectedThread}
              activeAccountId={activeAccountId}
              activeAccountEmail={activeAccountEmail}
              onReply={onReply}
              onDeleteThread={onDeleteThread}
              onToggleStar={onToggleStar}
              onToggleLock={onToggleLock}
              onMessagesUpdated={onMessagesUpdated}
              defaultCanvasTheme={canvasTheme}
            />
          </div>
        </div>
      </div>
    );
  }

  if (layoutMode === 'separate-page') {
    return (
      <div className={styles.mailContainerSeparate}>
        <MailFolderPane
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onSync={onSync}
          onResyncAll={onResyncAll}
          onOpenCleaner={onOpenCleaner}
          isSyncing={isSyncing}
        />
        {separateView === 'list' || !selectedThread ? (
          <div className={styles.separateListArea}>
            <ThreadListPane
              folderName={folderName}
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThread={onSelectThread}
              onToggleStar={onToggleStar}
              onToggleLock={onToggleLock}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              currentSort={currentSort}
              onSortChange={onSortChange}
              selectedThreadIds={selectedThreadIds}
              onToggleCheck={onToggleCheck}
              onSelectMultiple={onSelectMultiple}
              onClearSelection={onClearSelection}
              onBatchAction={onBatchAction}
              fullWidth={true}
            />
          </div>
        ) : (
          <div className={styles.separateReaderArea}>
            <MessageViewerPane
              thread={selectedThread}
              activeAccountId={activeAccountId}
              activeAccountEmail={activeAccountEmail}
              onReply={onReply}
              onDeleteThread={onDeleteThread}
              onToggleStar={onToggleStar}
              onToggleLock={onToggleLock}
              onBackToList={() => onSetSeparateView('list')}
              onMessagesUpdated={onMessagesUpdated}
              defaultCanvasTheme={canvasTheme}
            />
          </div>
        )}
      </div>
    );
  }

  // Default Three-Column Layout
  return (
    <div className={styles.mailContainerThree}>
      <MailFolderPane
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={onSelectFolder}
        onSync={onSync}
        onResyncAll={onResyncAll}
        onOpenCleaner={onOpenCleaner}
        isSyncing={isSyncing}
      />
      <ThreadListPane
        folderName={folderName}
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={onSelectThread}
        onToggleStar={onToggleStar}
        onToggleLock={onToggleLock}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        currentSort={currentSort}
        onSortChange={onSortChange}
        selectedThreadIds={selectedThreadIds}
        onToggleCheck={onToggleCheck}
        onSelectMultiple={onSelectMultiple}
        onClearSelection={onClearSelection}
        onBatchAction={onBatchAction}
      />
      <MessageViewerPane
        thread={selectedThread}
        activeAccountId={activeAccountId}
        activeAccountEmail={activeAccountEmail}
        onReply={onReply}
        onDeleteThread={onDeleteThread}
        onToggleStar={onToggleStar}
        onToggleLock={onToggleLock}
        onMessagesUpdated={onMessagesUpdated}
        defaultCanvasTheme={canvasTheme}
      />
    </div>
  );
});
