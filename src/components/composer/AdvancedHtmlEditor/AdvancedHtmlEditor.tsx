/**
 * AdvancedHtmlEditor Component
 * 
 * Direct HTML code editor with real-time syntax highlighting (tags, attributes,
 * strings, comments), line numbers gutter, quick snippets, and live rendered preview.
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Wand2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { highlightHtmlCode, formatHtml } from '../HtmlSyntaxHighlighter';
import { sanitizeEmailHtml } from '@/utils/sanitizeHtml';
import styles from './AdvancedHtmlEditor.module.css';

export interface AdvancedHtmlEditorProps {
  html: string;
  onChange: (html: string) => void;
  splitView: 'split' | 'code' | 'preview';
}

export const AdvancedHtmlEditor = React.memo(function AdvancedHtmlEditor({
  html,
  onChange,
  splitView,
}: AdvancedHtmlEditorProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronized syntax highlighted code
  const highlightedMarkup = useMemo(() => {
    return highlightHtmlCode(html);
  }, [html]);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    const lines = html.split('\n').length;
    return Math.max(1, lines);
  }, [html]);

  // Synchronize scrolling between textarea and backdrop
  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (backdropRef.current) {
      backdropRef.current.scrollTop = scrollTop;
      backdropRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, []);

  // Handle Tab key indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [onChange]
  );

  const insertSnippet = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        onChange(html + snippet);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = html.substring(0, start) + snippet + html.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
      });
    },
    [html, onChange]
  );

  const handleFormat = useCallback(() => {
    const formatted = formatHtml(html);
    onChange(formatted);
  }, [html, onChange]);

  const sanitizedPreview = useMemo(() => {
    return sanitizeEmailHtml(html, { allowImages: true });
  }, [html]);

  const showCode = splitView === 'split' || splitView === 'code';
  const showPreview = splitView === 'split' || splitView === 'preview';

  return (
    <div className={styles.container}>
      {showCode ? (
        <div className={styles.pane}>
          <div className={styles.toolbar}>
            <div className={styles.snippetGroup}>
              <button type="button" className={styles.snippetBtn} onClick={() => insertSnippet('<div>\n  \n</div>')}>
                &lt;div&gt;
              </button>
              <button type="button" className={styles.snippetBtn} onClick={() => insertSnippet('<a href="https://">\n  \n</a>')}>
                &lt;a&gt;
              </button>
              <button type="button" className={styles.snippetBtn} onClick={() => insertSnippet('<button style="background: #0078d4; color: #fff; padding: 10px 20px; border-radius: 4px; border: none;">\n  Action\n</button>')}>
                &lt;button&gt;
              </button>
              <button type="button" className={styles.snippetBtn} onClick={() => insertSnippet('<table style="width: 100%; border-collapse: collapse;">\n  <tr><td>Item</td></tr>\n</table>')}>
                &lt;table&gt;
              </button>
            </div>
            <button type="button" className={styles.formatBtn} onClick={handleFormat} title="Format and indent HTML code">
              <Wand2 size={12} />
              <span>Format HTML</span>
            </button>
          </div>

          <div className={styles.editorArea}>
            <div ref={lineNumbersRef} className={styles.lineNumbers}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
            <div className={styles.codeOverlayContainer}>
              <pre
                ref={backdropRef}
                className={styles.highlightBackdrop}
                dangerouslySetInnerHTML={{ __html: highlightedMarkup + '<br/>' }}
                aria-hidden="true"
              />
              <textarea
                ref={textareaRef}
                className={styles.rawTextarea}
                value={html}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder="Enter HTML email markup here..."
              />
            </div>
          </div>
        </div>
      ) : null}

      {showCode && showPreview ? <div className={styles.paneDivider} /> : null}

      {showPreview ? (
        <div className={styles.previewContainer}>
          <div className={styles.previewToolbar}>
            <span>Live Rendered Email Preview</span>
            <div className={styles.viewportToggles}>
              <button
                type="button"
                className={`${styles.viewportBtn} ${viewport === 'desktop' ? styles.active : ''}`}
                onClick={() => setViewport('desktop')}
                title="Desktop (100%)"
              >
                <Monitor size={12} />
              </button>
              <button
                type="button"
                className={`${styles.viewportBtn} ${viewport === 'tablet' ? styles.active : ''}`}
                onClick={() => setViewport('tablet')}
                title="Tablet (600px)"
              >
                <Tablet size={12} />
              </button>
              <button
                type="button"
                className={`${styles.viewportBtn} ${viewport === 'mobile' ? styles.active : ''}`}
                onClick={() => setViewport('mobile')}
                title="Mobile (380px)"
              >
                <Smartphone size={12} />
              </button>
            </div>
          </div>
          <div className={styles.previewScrollArea}>
            <div
              className={`${styles.previewCanvas} ${styles[viewport]}`}
              dangerouslySetInnerHTML={{ __html: sanitizedPreview || '<p style="color: #999;">Email body is empty.</p>' }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});
