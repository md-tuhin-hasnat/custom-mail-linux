/**
 * BasicVisualEditor Component
 * 
 * Rich visual WYSIWYG email editor supporting full text formatting (bold, italic,
 * underline, strike, headings, lists, tables, links, colors) with contentEditable.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Table,
  Minus,
  RemoveFormatting,
  Undo2,
  Redo2,
  Palette,
} from 'lucide-react';
import styles from './BasicVisualEditor.module.css';

export interface BasicVisualEditorProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const BasicVisualEditor = React.memo(function BasicVisualEditor({
  html,
  onChange,
  placeholder = 'Write your email here...',
}: BasicVisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external HTML if changed from outside (e.g. template applied or mode switch)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  }, [html]);

  const exec = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFormatBlock = useCallback((tag: string) => {
    exec('formatBlock', tag);
  }, [exec]);

  const handleInsertLink = useCallback(() => {
    const url = prompt('Enter destination link URL (https://...):');
    if (url) exec('createLink', url);
  }, [exec]);

  const handleInsertTable = useCallback(() => {
    const tableHtml = `
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
        <thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead>
        <tbody>
          <tr><td>Data 1</td><td>Data 2</td><td>Data 3</td></tr>
          <tr><td>Data 4</td><td>Data 5</td><td>Data 6</td></tr>
        </tbody>
      </table><p><br/></p>
    `;
    exec('insertHTML', tableHtml);
  }, [exec]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button type="button" className={styles.toolBtn} onClick={() => exec('undo')} title="Undo (Ctrl+Z)">
            <Undo2 size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('redo')} title="Redo (Ctrl+Y)">
            <Redo2 size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <select
            className={styles.select}
            onChange={(e) => handleFormatBlock(e.target.value)}
            defaultValue="<p>"
            title="Text style"
          >
            <option value="<p>">Normal Text</option>
            <option value="<h1>">Heading 1</option>
            <option value="<h2>">Heading 2</option>
            <option value="<h3>">Heading 3</option>
            <option value="<blockquote>">Quote</option>
            <option value="<pre>">Code Block</option>
          </select>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button type="button" className={styles.toolBtn} onClick={() => exec('bold')} title="Bold (Ctrl+B)">
            <Bold size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('italic')} title="Italic (Ctrl+I)">
            <Italic size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('underline')} title="Underline (Ctrl+U)">
            <Underline size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('strikeThrough')} title="Strikethrough">
            <Strikethrough size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <label className={styles.colorInputWrapper} title="Text Color">
            <span className={styles.toolBtn}>
              <Palette size={14} />
            </span>
            <input
              type="color"
              className={styles.colorPicker}
              onChange={(e) => exec('foreColor', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button type="button" className={styles.toolBtn} onClick={() => exec('insertUnorderedList')} title="Bullet List">
            <List size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('insertOrderedList')} title="Numbered List">
            <ListOrdered size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button type="button" className={styles.toolBtn} onClick={() => exec('justifyLeft')} title="Align Left">
            <AlignLeft size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('justifyCenter')} title="Align Center">
            <AlignCenter size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('justifyRight')} title="Align Right">
            <AlignRight size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button type="button" className={styles.toolBtn} onClick={handleInsertLink} title="Insert Link">
            <Link2 size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={handleInsertTable} title="Insert Table">
            <Table size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('insertHorizontalRule')} title="Insert Divider">
            <Minus size={14} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => exec('removeFormat')} title="Clear Formatting">
            <RemoveFormatting size={14} />
          </button>
        </div>
      </div>

      <div className={styles.canvasWrapper}>
        <div
          ref={editorRef}
          className={styles.editor}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder}
          role="textbox"
          aria-multiline="true"
        />
      </div>
    </div>
  );
});
