/**
 * ComposerRecipientBar Component
 * 
 * Manages email recipient inputs (To, Cc, Bcc), subject line, file attachments,
 * and quick-start professional email templates.
 */

import React, { useState, useRef } from 'react';
import { Paperclip, X, Sparkles, ChevronDown } from 'lucide-react';
import styles from './ComposerRecipientBar.module.css';

export interface ComposerAttachment {
  id: string;
  name: string;
  size: number;
}

export interface ComposerRecipientBarProps {
  to: string;
  onToChange: (to: string) => void;
  cc: string;
  onCcChange: (cc: string) => void;
  bcc: string;
  onBccChange: (bcc: string) => void;
  subject: string;
  onSubjectChange: (subj: string) => void;
  attachments: ComposerAttachment[];
  onAddAttachment: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
  onApplyTemplate: (template: { subject: string; bodyHtml: string }) => void;
}

const TEMPLATES = [
  {
    name: 'Executive Status Update',
    desc: 'Structured progress, milestones, and blockers',
    subject: 'Status Update: Project Milestone Review',
    bodyHtml: `<h3>Weekly Project Status Update</h3>
<p>Hi Team,</p>
<p>Here is the executive summary of our deliverables and milestones for this sprint:</p>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border-color: #3b4252;">
  <tr style="background-color: #2e3440; color: #eceff4;">
    <th>Deliverable</th>
    <th>Owner</th>
    <th>Status</th>
    <th>ETA</th>
  </tr>
  <tr>
    <td>Linux Custom Mail Client</td>
    <td>Engineering</td>
    <td><span style="color: #a3be8c; font-weight: bold;">On Track</span></td>
    <td>End of Sprint</td>
  </tr>
  <tr>
    <td>IMAP & SMTP Sync Layer</td>
    <td>Core Infrastructure</td>
    <td><span style="color: #ebcb8b; font-weight: bold;">Review</span></td>
    <td>Tomorrow</td>
  </tr>
</table>
<p>Please review the notes and let me know if you have any questions.</p>
<p>Best regards,<br/>Engineering Lead</p>`,
  },
  {
    name: 'Meeting Follow-up & Action Items',
    desc: 'Summary of discussion and key assigned actions',
    subject: 'Follow-up: Architecture & Design Discussion',
    bodyHtml: `<h3>Meeting Minutes & Next Steps</h3>
<p>Hi Everyone,</p>
<p>Thank you for attending today's alignment sync. Here are the main action items captured:</p>
<ul>
  <li><strong>Action 1:</strong> Finalize rich text & HTML editor integration.</li>
  <li><strong>Action 2:</strong> Review mailbox cleaner batch deletion safeguards.</li>
  <li><strong>Action 3:</strong> Prepare automated test suites for IMAP sync.</li>
</ul>
<blockquote style="border-left: 3px solid #5e81ac; margin-left: 0; padding-left: 12px; color: #d8dee9;">
  <em>"Targeting clean, zero-waterfall desktop client performance on Linux."</em>
</blockquote>
<p>Cheers,<br/>Project Lead</p>`,
  },
  {
    name: 'Styled Announcement / Newsletter',
    desc: 'Modern card layout with responsive styled containers',
    subject: 'Company Announcement: Product Release Notes',
    bodyHtml: `<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #23272e; color: #f5f5f7; border-radius: 8px; padding: 24px; border: 1px solid #3e4451;">
  <h2 style="color: #38bdf8; margin-top: 0;">🚀 New Feature Release</h2>
  <p>We are excited to introduce the all-new <strong>Full-Page Mail Composer</strong> with dual Basic & Advanced HTML modes!</p>
  <div style="background: #282c34; border-radius: 6px; padding: 16px; margin: 16px 0; border-left: 4px solid #38bdf8;">
    <strong>Highlights:</strong>
    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
      <li>Visual WYSIWYG rich text editor</li>
      <li>Raw HTML editor with live syntax coloring</li>
      <li>Side-by-side real-time rendering preview</li>
    </ul>
  </div>
  <p style="margin-bottom: 0;">Try it out and share your thoughts!</p>
</div>`,
  },
];

export const ComposerRecipientBar = React.memo(function ComposerRecipientBar({
  to,
  onToChange,
  cc,
  onCcChange,
  bcc,
  onBccChange,
  subject,
  onSubjectChange,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onApplyTemplate,
}: ComposerRecipientBarProps) {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        <span className={styles.label}>To:</span>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            className={styles.input}
            placeholder="Recipients (e.g. user@enterprise.com)"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className={styles.actionPills}>
          {!showCc ? (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowCc(true)}
            >
              Cc
            </button>
          ) : null}
          {!showBcc ? (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowBcc(true)}
            >
              Bcc
            </button>
          ) : null}

          <div className={styles.templateDropdown}>
            <button
              type="button"
              className={styles.attachBtn}
              onClick={() => setShowTemplateMenu((prev) => !prev)}
              title="Insert pre-designed rich template"
            >
              <Sparkles size={13} />
              <span>Templates</span>
              <ChevronDown size={11} />
            </button>
            {showTemplateMenu ? (
              <div className={styles.templateMenu}>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    className={styles.templateItem}
                    onClick={() => {
                      onApplyTemplate({ subject: tmpl.subject, bodyHtml: tmpl.bodyHtml });
                      setShowTemplateMenu(false);
                    }}
                  >
                    <span className={styles.templateName}>{tmpl.name}</span>
                    <span className={styles.templateDesc}>{tmpl.desc}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file from filesystem"
          >
            <Paperclip size={13} />
            <span>Attach</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              onAddAttachment(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {showCc ? (
        <div className={styles.row}>
          <span className={styles.label}>Cc:</span>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              className={styles.input}
              placeholder="Cc recipients"
              value={cc}
              onChange={(e) => onCcChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => {
              setShowCc(false);
              onCcChange('');
            }}
          >
            Hide
          </button>
        </div>
      ) : null}

      {showBcc ? (
        <div className={styles.row}>
          <span className={styles.label}>Bcc:</span>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              className={styles.input}
              placeholder="Bcc recipients"
              value={bcc}
              onChange={(e) => onBccChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => {
              setShowBcc(false);
              onBccChange('');
            }}
          >
            Hide
          </button>
        </div>
      ) : null}

      <div className={styles.row}>
        <span className={styles.label}>Subject:</span>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={`${styles.input} ${styles.subjectInput}`}
            placeholder="Add a subject..."
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
          />
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className={styles.attachmentList}>
          {attachments.map((att) => (
            <div key={att.id} className={styles.attachmentChip}>
              <Paperclip size={11} />
              <span>{att.name}</span>
              <span className={styles.attachmentSize}>({formatFileSize(att.size)})</span>
              <button
                type="button"
                className={styles.removeAttachment}
                onClick={() => onRemoveAttachment(att.id)}
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});
