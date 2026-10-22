/**
 * page.tsx
 * Top-level application orchestrator for Aura Mail Linux Client.
 * Composes core application modules:
 * - AppRail & WindowHeader for window controls and multi-account navigation.
 * - MailLayoutContainer for multi-layout mail browsing (3-pane, split, separate).
 * - Dedicated views for Mailbox Cleaner, Calendar, Contacts, and Tasks.
 * - Modals for Settings, Mail Composition, and Account Setup.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { getInitialData } from '@/data/mockData';
import { MailMessage, MailThread } from '@/types/mail';
import { WindowHeader } from '@/components/layout/WindowHeader/WindowHeader';
import { AppRail, ActiveTab } from '@/components/layout/AppRail/AppRail';
import { StatusBar } from '@/components/layout/StatusBar/StatusBar';
import { MailLayoutContainer } from '@/components/mail/MailLayoutContainer/MailLayoutContainer';
import { MailComposerView, ComposeDraftPayload } from '@/components/composer/MailComposerView/MailComposerView';
import { AddAccountModal } from '@/components/account/AddAccountModal/AddAccountModal';
import { CalendarView } from '@/components/calendar/CalendarView/CalendarView';
import { ContactsView } from '@/components/contacts/ContactsView/ContactsView';
import { TasksView } from '@/components/tasks/TasksView/TasksView';
import { SettingsModal, MailLayoutMode, DefaultCanvasTheme } from '@/components/settings/SettingsModal/SettingsModal';
import { MailboxCleanerView } from '@/components/cleaner/MailboxCleanerView/MailboxCleanerView';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useMailboxData } from '@/hooks/useMailboxData';
import { useThreadSelection } from '@/hooks/useThreadSelection';
import { useProductivityData } from '@/hooks/useProductivityData';
import styles from './page.module.css';

function determineWithSeed(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('seed') === 'false') return false;
    if (params.get('seed') === 'true') return true;
  }
  return process.env.NEXT_PUBLIC_SEED_DATA !== 'false';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mail');
  const [initialSeed] = useState(() => getInitialData(determineWithSeed()));

  // Layout & View settings state
  const [layoutMode, setLayoutMode] = useState<MailLayoutMode>('three-column');
  const [separateView, setSeparateView] = useState<'list' | 'reader'>('list');
  const [canvasTheme, setCanvasTheme] = useState<DefaultCanvasTheme>('white');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<Partial<ComposeDraftPayload> | null>(null);

  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('mail_layout_mode') as MailLayoutMode;
      if (savedLayout) setLayoutMode(savedLayout);
      const savedCanvas = localStorage.getItem('mail_canvas_theme') as DefaultCanvasTheme;
      if (savedCanvas) setCanvasTheme(savedCanvas);
    } catch {}
  }, []);

  // Account management hook
  const {
    accounts,
    activeAccountId,
    activeAccount,
    isAddAccountOpen,
    setIsAddAccountOpen,
    handleAccountAdded,
    handleAccountSwitch,
    connectionName,
  } = useAccountManager();

  // Mailbox data & sync lifecycle hook
  const {
    folders,
    threads,
    setThreads,
    isSyncing,
    syncStatus,
    syncProgress,
    loadAccountData,
    handleSync,
    handleResyncAll,
    handleMessagesUpdated,
    handleDeleteThread,
  } = useMailboxData({
    initialFolders: initialSeed.folders,
    initialThreads: initialSeed.threads,
    activeAccountId,
  });

  // Thread selection, filtering & batch actions hook
  const {
    activeFolderId,
    setActiveFolderId,
    selectedThreadId,
    setSelectedThreadId,
    activeCategory,
    setActiveCategory,
    activeFilter,
    setActiveFilter,
    currentSort,
    setCurrentSort,
    selectedThreadIds,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    selectedThread,
    activeFolder,
    handleSelectThread,
    handleToggleStar,
    handleToggleLock,
    handleToggleCheck,
    handleSelectMultiple,
    handleClearSelection,
    handleBatchAction,
  } = useThreadSelection({
    folders,
    threads,
    activeAccountId,
    setThreads,
    onThreadSelected: (id) => {
      if (layoutMode === 'separate-page') setSeparateView('reader');
    },
  });

  // Calendar, Contacts & Tasks hook
  const {
    events,
    contacts,
    tasks,
    handleToggleTask,
    handleAddTask,
  } = useProductivityData({
    initialEvents: initialSeed.events,
    initialContacts: initialSeed.contacts,
    initialTasks: initialSeed.tasks,
    activeAccountId,
  });

  const handleOpenComposer = useCallback((initial?: Partial<ComposeDraftPayload>) => {
    setComposerDraft(initial || null);
    setActiveTab('compose');
  }, []);

  const handleReply = useCallback(() => {
    if (!selectedThread) {
      handleOpenComposer();
      return;
    }
    const lastMsg = selectedThread.messages[selectedThread.messages.length - 1];
    handleOpenComposer({
      to: lastMsg?.senderEmail || selectedThread.participants[0]?.email || '',
      subject: selectedThread.subject.toLowerCase().startsWith('re:')
        ? selectedThread.subject
        : `Re: ${selectedThread.subject}`,
      bodyHtml: `<p><br/></p><blockquote style="border-left: 2px solid #38bdf8; padding-left: 10px; color: #888;">On ${lastMsg?.date || ''}, ${lastMsg?.senderName || 'Sender'} wrote:<br/>${lastMsg?.bodyHtml || ''}</blockquote>`,
    });
  }, [selectedThread, handleOpenComposer]);

  const handleSendMail = useCallback(
    async (draft: ComposeDraftPayload) => {
      const to = draft.to;
      const snippet = draft.bodyHtml.replace(/<[^>]+>/g, '').slice(0, 100);

      const res = await window.desktopAPI?.mail.sendMail(
        {
          recipientEmails: [to],
          recipientNames: [to],
          subject: draft.subject || '(No Subject)',
          snippet,
          bodyHtml: draft.bodyHtml,
          cc: draft.cc,
          bcc: draft.bcc,
          attachments: draft.attachments,
        } as any,
        activeAccountId
      );

      if (res && !res.success) {
        alert(`Failed to send email: ${res.error || 'Unknown error'}`);
        throw new Error(res.error || 'Failed to send');
      }

      if (!window.desktopAPI) {
        const newMsg: MailMessage = {
          id: `msg-${Date.now()}`,
          threadId: `th-${Date.now()}`,
          senderName: activeAccount?.name || 'Me',
          senderEmail: activeAccount?.email || 'me@corp.com',
          recipientNames: [to],
          recipientEmails: [to],
          subject: draft.subject || '(No Subject)',
          snippet,
          bodyHtml: draft.bodyHtml,
          date: 'Just now',
          isRead: true,
          isStarred: false,
          hasAttachments: (draft.attachments?.length ?? 0) > 0,
          folderId: 'sent',
          labelIds: ['SENT', 'sent'],
          category: 'focused',
        };

        const newThread: MailThread = {
          id: newMsg.threadId,
          folderId: 'sent',
          labelIds: ['SENT', 'sent'],
          subject: newMsg.subject,
          snippet: newMsg.snippet,
          participants: [
            { name: newMsg.senderName, email: newMsg.senderEmail },
            { name: to, email: to },
          ],
          lastDate: 'Just now',
          messageCount: 1,
          isRead: true,
          isStarred: false,
          hasAttachments: newMsg.hasAttachments,
          category: 'focused',
          messages: [newMsg],
        };

        setThreads((prev) => [newThread, ...prev]);
      }
    },
    [activeAccount, activeAccountId, setThreads]
  );

  return (
    <div className={styles.shell}>
      <WindowHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleAccountSwitch}
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        layoutMode={layoutMode}
        onLayoutModeChange={(m) => {
          setLayoutMode(m);
          try { localStorage.setItem('mail_layout_mode', m); } catch {}
        }}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      <div className={styles.body}>
        <AppRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onComposeClick={() => handleOpenComposer()}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {activeTab === 'mail' ? (
          <MailLayoutContainer
            layoutMode={layoutMode}
            separateView={separateView}
            onSetSeparateView={setSeparateView}
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectFolder={setActiveFolderId}
            onSync={handleSync}
            onResyncAll={handleResyncAll}
            onOpenCleaner={() => setActiveTab('cleaner')}
            isSyncing={isSyncing}
            folderName={activeFolder.name}
            threads={filteredThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            onToggleStar={handleToggleStar}
            onToggleLock={handleToggleLock}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            selectedThreadIds={selectedThreadIds}
            onToggleCheck={handleToggleCheck}
            onSelectMultiple={handleSelectMultiple}
            onClearSelection={handleClearSelection}
            onBatchAction={handleBatchAction}
            selectedThread={selectedThread}
            activeAccountId={activeAccountId}
            onReply={handleReply}
            onDeleteThread={handleDeleteThread}
            onMessagesUpdated={handleMessagesUpdated}
            canvasTheme={canvasTheme}
          />
        ) : null}

        {activeTab === 'compose' ? (
          <MailComposerView
            initialDraft={composerDraft || undefined}
            onSend={handleSendMail}
            onBack={() => setActiveTab('mail')}
          />
        ) : null}

        {activeTab === 'cleaner' ? (
          <MailboxCleanerView
            threads={threads}
            activeAccountId={activeAccountId}
            onBackToMail={() => setActiveTab('mail')}
            onToggleLock={handleToggleLock}
            onRefreshMailbox={() => loadAccountData(activeAccountId)}
          />
        ) : null}

        {activeTab === 'calendar' ? (
          <CalendarView
            events={events}
            onCreateEvent={() => alert('New Event Dialog')}
          />
        ) : null}

        {activeTab === 'contacts' ? (
          <ContactsView
            contacts={contacts}
            onEmailContact={(email) => handleOpenComposer({ to: email })}
            onAddContact={() => alert('Add Contact Dialog')}
          />
        ) : null}

        {activeTab === 'tasks' ? (
          <TasksView
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
          />
        ) : null}
      </div>

      <StatusBar
        itemCount={filteredThreads.length}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        connectionName={connectionName}
      />

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountAdded={handleAccountAdded}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        layoutMode={layoutMode}
        onLayoutModeChange={(m) => {
          setLayoutMode(m);
          try { localStorage.setItem('mail_layout_mode', m); } catch {}
        }}
        canvasTheme={canvasTheme}
        onCanvasThemeChange={(t) => {
          setCanvasTheme(t);
          try { localStorage.setItem('mail_canvas_theme', t); } catch {}
        }}
        activeAccountEmail={activeAccount?.email}
        onDeleteAndResync={handleResyncAll}
        isSyncing={isSyncing}
      />
    </div>
  );
}
