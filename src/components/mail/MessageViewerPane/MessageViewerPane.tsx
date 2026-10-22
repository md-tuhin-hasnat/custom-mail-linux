'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Mail, Reply, ArrowLeft, Sun, Moon, Loader2 } from 'lucide-react';
import { MailThread, MailMessage, Attachment } from '@/types/mail';
import { MessageHeader } from '@/components/mail/MessageHeader/MessageHeader';
import { MessageBody } from '@/components/mail/MessageBody/MessageBody';
import { AttachmentList } from '@/components/mail/AttachmentList/AttachmentList';
import { Button } from '@/components/common/Button/Button';
import styles from './MessageViewerPane.module.css';

const MediaViewerModal = dynamic(
  () => import('@/components/mail/MediaViewerModal/MediaViewerModal').then((m) => m.MediaViewerModal),
  { ssr: false }
);

interface MessageViewerPaneProps {
  thread: MailThread | null;
  activeAccountId?: string;
  onReply: () => void;
  onDeleteThread: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onBackToList?: () => void;
  onMessagesUpdated?: (threadId: string, messages: MailMessage[]) => void;
  defaultCanvasTheme?: 'white' | 'dark';
}

export const MessageViewerPane = React.memo(function MessageViewerPane({
  thread,
  activeAccountId,
  onReply,
  onDeleteThread,
  onToggleStar,
  onToggleLock,
  onBackToList,
  onMessagesUpdated,
  defaultCanvasTheme = 'white',
}: MessageViewerPaneProps) {
  const [canvasTheme, setCanvasTheme] = useState<'white' | 'dark'>(defaultCanvasTheme);
  const [messages, setMessages] = useState<MailMessage[]>(thread?.messages || []);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const [viewerAttachments, setViewerAttachments] = useState<Attachment[]>([]);
  const [viewerMessageId, setViewerMessageId] = useState<string | undefined>(undefined);

  const handleOpenMediaViewer = useCallback(
    (att: Attachment, allAtts: Attachment[], msgId: string) => {
      setViewerAttachment(att);
      setViewerAttachments(allAtts);
      setViewerMessageId(msgId);
    },
    []
  );

  const handleCloseMediaViewer = useCallback(() => {
    setViewerAttachment(null);
    setViewerAttachments([]);
    setViewerMessageId(undefined);
  }, []);

  useEffect(() => {
    if (!thread) {
      setMessages([]);
      return;
    }
    setMessages(thread.messages);

    const needsFullBody = thread.messages.some((m) => {
      if (m.bodyHtml.startsWith('<p><strong>') && m.bodyHtml.includes('&lt;') && m.bodyHtml.includes('From:')) {
        return true;
      }
      if (
        !m.bodyHtml.includes('<br') &&
        !m.bodyHtml.includes('<div') &&
        !m.bodyHtml.includes('<table') &&
        !m.bodyHtml.includes('<span') &&
        !m.bodyHtml.includes('<ul')
      ) {
        return true;
      }
      return false;
    });

    if (needsFullBody && window.desktopAPI?.mail?.getThreadMessages) {
      setIsLoadingBody(true);
      window.desktopAPI.mail
        .getThreadMessages(thread.id, activeAccountId)
        .then((fullMsgs) => {
          if (fullMsgs && fullMsgs.length > 0) {
            setMessages(fullMsgs);
            onMessagesUpdated?.(thread.id, fullMsgs);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingBody(false));
    }
  }, [thread?.id, activeAccountId, onMessagesUpdated]);

  if (!thread) {
    return (
      <main className={styles.pane}>
        <div className={styles.emptyState}>
          <Mail size={48} strokeWidth={1.2} />
          <span className={styles.emptyTitle}>Select an email to read</span>
          <span>Nothing is selected from your list</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pane}>
      <div className={styles.topBar}>
        <div className={styles.titleGroup}>
          {onBackToList ? (
            <button
              className={styles.backButton}
              onClick={onBackToList}
              type="button"
              title="Back to conversations"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : null}
          <h1 className={styles.subjectTitle}>{thread.subject}</h1>
          {isLoadingBody ? (
            <span className={styles.loadingBadge}>
              <Loader2 size={13} className={styles.spinner} />
              <span>Loading full email...</span>
            </span>
          ) : null}
        </div>

        <div className={styles.actionsGroup}>
          <button
            className={styles.themeToggleBtn}
            onClick={() => setCanvasTheme((prev) => (prev === 'white' ? 'dark' : 'white'))}
            type="button"
            title={`Switch to ${canvasTheme === 'white' ? 'dark' : 'white'} email canvas`}
          >
            {canvasTheme === 'white' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{canvasTheme === 'white' ? 'Dark Paper' : 'White Paper'}</span>
          </button>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {messages.map((msg) => (
          <article key={msg.id} className={styles.messageCard}>
            <MessageHeader
              message={msg}
              isLocked={thread.isLocked}
              onReply={onReply}
              onDelete={() => onDeleteThread(thread.id)}
              onToggleStar={() => onToggleStar(thread.id)}
              onToggleLock={onToggleLock ? () => onToggleLock(thread.id) : undefined}
            />
            <MessageBody htmlContent={msg.bodyHtml} canvasTheme={canvasTheme} />
            {msg.attachments && msg.attachments.length > 0 ? (
              <AttachmentList
                attachments={msg.attachments}
                messageId={msg.id}
                accountId={activeAccountId}
                onPreviewAttachment={(att, all) => handleOpenMediaViewer(att, all, msg.id)}
              />
            ) : null}
          </article>
        ))}
      </div>

      {viewerAttachment ? (
        <MediaViewerModal
          isOpen={true}
          initialAttachment={viewerAttachment}
          attachments={viewerAttachments}
          messageId={viewerMessageId}
          accountId={activeAccountId}
          onClose={handleCloseMediaViewer}
        />
      ) : null}

      <div className={styles.replyBar}>
        <div
          className={styles.replyInputTrigger}
          onClick={onReply}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onReply();
          }}
        >
          <span>Click to reply to this thread...</span>
        </div>
        <Button variant="primary" icon={<Reply size={14} />} onClick={onReply}>
          Reply
        </Button>
      </div>
    </main>
  );
});
