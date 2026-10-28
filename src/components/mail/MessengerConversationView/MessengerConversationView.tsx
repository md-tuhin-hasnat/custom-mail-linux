/**
 * MessengerConversationView Component
 * 
 * Orchestrates a modern chat-app conversation stream for an email thread.
 * Displays bubbles with clear sender identification ("You" vs counterpart)
 * and provides an instant inline quick-reply bar with auto-scroll.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Maximize2 } from 'lucide-react';
import { MailMessage, Attachment } from '@/types/mail';
import { MessengerChatBubble } from '../MessengerChatBubble/MessengerChatBubble';
import styles from './MessengerConversationView.module.css';

export interface MessengerConversationViewProps {
  messages: MailMessage[];
  activeAccountEmail?: string;
  onReply: () => void;
  onQuickReply?: (bodyText: string) => Promise<void> | void;
  onPreviewAttachment?: (att: Attachment, all: Attachment[], msgId: string) => void;
  accountId?: string;
}

export const MessengerConversationView = React.memo(function MessengerConversationView({
  messages,
  activeAccountEmail,
  onReply,
  onQuickReply,
  onPreviewAttachment,
  accountId,
}: MessengerConversationViewProps) {
  const [quickText, setQuickText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendQuick = useCallback(async () => {
    if (!quickText.trim() || isSending || !onQuickReply) return;
    const textToSend = quickText.trim();
    setQuickText('');
    setIsSending(true);
    try {
      await onQuickReply(textToSend);
    } finally {
      setIsSending(false);
    }
  }, [quickText, isSending, onQuickReply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendQuick();
      }
    },
    [handleSendQuick]
  );

  return (
    <div className={styles.container}>
      <div ref={scrollRef} className={styles.streamScrollArea}>
        <div className={styles.conversationBadge}>
          Messenger View • {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
        </div>

        {messages.map((msg) => (
          <MessengerChatBubble
            key={msg.id}
            message={msg}
            activeAccountEmail={activeAccountEmail}
            onReply={onReply}
            onPreviewAttachment={onPreviewAttachment}
            accountId={accountId}
          />
        ))}
      </div>

      <div className={styles.quickReplyBar}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Type a quick reply (Enter to send)..."
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onReply}
            title="Open full page rich email composer"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        <button
          type="button"
          className={styles.sendBtn}
          onClick={handleSendQuick}
          disabled={!quickText.trim() || isSending}
          title="Send reply (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
});
