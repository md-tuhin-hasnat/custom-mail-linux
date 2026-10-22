/**
 * MailComposerView Component
 * 
 * Orchestrating full-page email composer featuring dual Basic (Visual WYSIWYG)
 * and Advanced (Syntax-Highlighted HTML) modes, multi-recipient handling,
 * attachment management, pre-built templates, and keyboard shortcuts.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ComposerHeader } from '../ComposerHeader/ComposerHeader';
import { ComposerRecipientBar, ComposerAttachment } from '../ComposerRecipientBar/ComposerRecipientBar';
import { BasicVisualEditor } from '../BasicVisualEditor/BasicVisualEditor';
import { AdvancedHtmlEditor } from '../AdvancedHtmlEditor/AdvancedHtmlEditor';
import { formatHtml } from '../HtmlSyntaxHighlighter';
import styles from './MailComposerView.module.css';

export interface ComposeDraftPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyHtml: string;
  attachments?: ComposerAttachment[];
}

export interface MailComposerViewProps {
  initialDraft?: Partial<ComposeDraftPayload>;
  onSend: (payload: ComposeDraftPayload) => Promise<void> | void;
  onBack: () => void;
}

export const MailComposerView = React.memo(function MailComposerView({
  initialDraft,
  onSend,
  onBack,
}: MailComposerViewProps) {
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [splitView, setSplitView] = useState<'split' | 'code' | 'preview'>('split');
  const [to, setTo] = useState(initialDraft?.to || '');
  const [cc, setCc] = useState(initialDraft?.cc || '');
  const [bcc, setBcc] = useState(initialDraft?.bcc || '');
  const [subject, setSubject] = useState(initialDraft?.subject || '');
  const [html, setHtml] = useState(initialDraft?.bodyHtml || '');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>(initialDraft?.attachments || []);
  const [isSending, setIsSending] = useState(false);

  // Switch modes and format HTML when entering advanced mode
  const handleModeChange = useCallback(
    (newMode: 'basic' | 'advanced') => {
      if (newMode === 'advanced') {
        setHtml((prev) => formatHtml(prev));
      }
      setMode(newMode);
    },
    []
  );

  const handleAddAttachment = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1] || '';
        const newAtt: ComposerAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          size: f.size,
          mimeType: f.type || 'application/octet-stream',
          contentBase64: base64,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(f);
    });
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleApplyTemplate = useCallback((template: { subject: string; bodyHtml: string }) => {
    setSubject(template.subject);
    setHtml(template.bodyHtml);
  }, []);

  const handleSend = useCallback(async () => {
    if (!to.trim()) return;
    setIsSending(true);
    try {
      await onSend({
        to,
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim() || '(No Subject)',
        bodyHtml: html || '<p></p>',
        attachments,
      });
      onBack();
    } catch (err) {
      console.error('Failed to send mail:', err);
    } finally {
      setIsSending(false);
    }
  }, [to, cc, bcc, subject, html, attachments, onSend, onBack]);

  // Global keyboard shortcuts (Ctrl+Enter to send, Esc to go back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSend, onBack]);

  return (
    <div className={styles.page}>
      <ComposerHeader
        mode={mode}
        onModeChange={handleModeChange}
        splitView={splitView}
        onSplitViewChange={setSplitView}
        onBack={onBack}
        onSend={handleSend}
        onDiscard={onBack}
        isSending={isSending}
        canSend={Boolean(to.trim())}
      />

      <ComposerRecipientBar
        to={to}
        onToChange={setTo}
        cc={cc}
        onCcChange={setCc}
        bcc={bcc}
        onBccChange={setBcc}
        subject={subject}
        onSubjectChange={setSubject}
        attachments={attachments}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        onApplyTemplate={handleApplyTemplate}
      />

      <div className={styles.editorContainer}>
        {mode === 'basic' ? (
          <BasicVisualEditor html={html} onChange={setHtml} />
        ) : (
          <AdvancedHtmlEditor html={html} onChange={setHtml} splitView={splitView} />
        )}
      </div>
    </div>
  );
});
