/**
 * ComposerHeader Component
 * 
 * Top control bar for the mail composer page providing navigation back to the mailbox,
 * segmented switching between Basic (Visual) and Advanced (HTML) modes, split-screen
 * preview toggles, and send/discard actions.
 */

import React from 'react';
import { ArrowLeft, Send, Trash2, Code2, Eye, Columns } from 'lucide-react';
import styles from './ComposerHeader.module.css';

export interface ComposerHeaderProps {
  mode: 'basic' | 'advanced';
  onModeChange: (mode: 'basic' | 'advanced') => void;
  splitView: 'split' | 'code' | 'preview';
  onSplitViewChange: (view: 'split' | 'code' | 'preview') => void;
  onBack: () => void;
  onSend: () => void;
  onDiscard: () => void;
  isSending?: boolean;
  canSend?: boolean;
}

export const ComposerHeader = React.memo(function ComposerHeader({
  mode,
  onModeChange,
  splitView,
  onSplitViewChange,
  onBack,
  onSend,
  onDiscard,
  isSending = false,
  canSend = true,
}: ComposerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          title="Back to Mailbox (Esc)"
        >
          <ArrowLeft size={16} />
        </button>
        <div className={styles.titleArea}>
          <span className={styles.title}>
            Compose Message
            <span className={styles.draftBadge}>Draft</span>
          </span>
        </div>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.segmentedControl} role="tablist" aria-label="Editor Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'basic'}
            className={`${styles.segmentBtn} ${mode === 'basic' ? styles.active : ''}`}
            onClick={() => onModeChange('basic')}
            title="Rich visual WYSIWYG editor"
          >
            <Eye size={14} />
            <span>Basic (Visual)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'advanced'}
            className={`${styles.segmentBtn} ${mode === 'advanced' ? styles.active : ''}`}
            onClick={() => onModeChange('advanced')}
            title="Direct HTML source editor with syntax highlighting"
          >
            <Code2 size={14} />
            <span>Advanced (HTML)</span>
          </button>
        </div>

        {mode === 'advanced' ? (
          <div className={styles.splitControl} title="View Layout">
            <button
              type="button"
              className={`${styles.splitBtn} ${splitView === 'split' ? styles.active : ''}`}
              onClick={() => onSplitViewChange('split')}
              title="Split View: Code + Live Preview"
            >
              <Columns size={12} />
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`${styles.splitBtn} ${splitView === 'code' ? styles.active : ''}`}
              onClick={() => onSplitViewChange('code')}
              title="Code Editor Only"
            >
              <Code2 size={12} />
              <span>Code</span>
            </button>
            <button
              type="button"
              className={`${styles.splitBtn} ${splitView === 'preview' ? styles.active : ''}`}
              onClick={() => onSplitViewChange('preview')}
              title="HTML Preview Only"
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.rightSection}>
        <button
          type="button"
          className={styles.discardBtn}
          onClick={onDiscard}
          title="Discard draft and return"
        >
          <Trash2 size={14} />
          <span>Discard</span>
        </button>

        <button
          type="button"
          className={styles.sendBtn}
          onClick={onSend}
          disabled={!canSend || isSending}
          title="Send Email (Ctrl+Enter)"
        >
          <Send size={14} />
          <span>{isSending ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
    </header>
  );
});
