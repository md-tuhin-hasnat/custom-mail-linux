import React, { useState, useCallback } from 'react';
import { X, Columns3, Rows2, SquareSplitHorizontal, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import styles from './SettingsModal.module.css';

export type MailLayoutMode = 'three-column' | 'bottom-reader' | 'separate-page';
export type DefaultCanvasTheme = 'white' | 'dark';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: MailLayoutMode;
  onLayoutModeChange: (mode: MailLayoutMode) => void;
  canvasTheme: DefaultCanvasTheme;
  onCanvasThemeChange: (theme: DefaultCanvasTheme) => void;
  activeAccountEmail?: string;
  onDeleteAndResync?: () => void;
  isSyncing?: boolean;
}

export const SettingsModal = React.memo(function SettingsModal({
  isOpen,
  onClose,
  layoutMode,
  onLayoutModeChange,
  canvasTheme,
  onCanvasThemeChange,
  activeAccountEmail,
  onDeleteAndResync,
  isSyncing = false,
}: SettingsModalProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleConfirmResync = useCallback(() => {
    setIsConfirmingDelete(false);
    onDeleteAndResync?.();
    onClose();
  }, [onDeleteAndResync, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Preferences & Storage</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings" type="button">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Layout Section */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Mailbox Layout Mode</span>
            <span className={styles.sectionDesc}>
              Choose how your folders, conversation lists, and email reading view are arranged.
            </span>

            <div className={styles.layoutOptions}>
              <div
                className={`${styles.layoutCard} ${layoutMode === 'three-column' ? styles.selected : ''}`}
                onClick={() => onLayoutModeChange('three-column')}
                role="button"
                tabIndex={0}
              >
                <div className={styles.cardHeader}>
                  <Columns3 size={18} className={styles.cardIcon} />
                  <span className={styles.cardName}>Three Sections</span>
                  {layoutMode === 'three-column' ? <Check size={16} className={styles.checkIcon} /> : null}
                </div>
                <div className={styles.previewThree}>
                  <div className={styles.colNav} />
                  <div className={styles.colList} />
                  <div className={styles.colView} />
                </div>
                <span className={styles.cardNote}>Folders | Thread list | Reading pane on right</span>
              </div>

              <div
                className={`${styles.layoutCard} ${layoutMode === 'bottom-reader' ? styles.selected : ''}`}
                onClick={() => onLayoutModeChange('bottom-reader')}
                role="button"
                tabIndex={0}
              >
                <div className={styles.cardHeader}>
                  <Rows2 size={18} className={styles.cardIcon} />
                  <span className={styles.cardName}>Two Sections (Split)</span>
                  {layoutMode === 'bottom-reader' ? <Check size={16} className={styles.checkIcon} /> : null}
                </div>
                <div className={styles.previewBottom}>
                  <div className={styles.colNav} />
                  <div className={styles.rowRight}>
                    <div className={styles.rowTop} />
                    <div className={styles.rowBottom} />
                  </div>
                </div>
                <span className={styles.cardNote}>Folders | Thread list top / Reading pane bottom</span>
              </div>

              <div
                className={`${styles.layoutCard} ${layoutMode === 'separate-page' ? styles.selected : ''}`}
                onClick={() => onLayoutModeChange('separate-page')}
                role="button"
                tabIndex={0}
              >
                <div className={styles.cardHeader}>
                  <SquareSplitHorizontal size={18} className={styles.cardIcon} />
                  <span className={styles.cardName}>Separate Page</span>
                  {layoutMode === 'separate-page' ? <Check size={16} className={styles.checkIcon} /> : null}
                </div>
                <div className={styles.previewSeparate}>
                  <div className={styles.colNav} />
                  <div className={styles.colFull} />
                </div>
                <span className={styles.cardNote}>Full width message list & separate reader page</span>
              </div>
            </div>
          </div>

          {/* Email Canvas Theme Section */}
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Default Message Canvas Background</span>
            <span className={styles.sectionDesc}>
              Formatted HTML newsletters and notifications are designed for white backgrounds.
            </span>

            <div className={styles.canvasOptions}>
              <button
                className={`${styles.canvasBtn} ${canvasTheme === 'white' ? styles.canvasSelected : ''}`}
                onClick={() => onCanvasThemeChange('white')}
                type="button"
              >
                <span className={styles.whiteSwatch} />
                <span>White Paper (Recommended)</span>
              </button>
              <button
                className={`${styles.canvasBtn} ${canvasTheme === 'dark' ? styles.canvasSelected : ''}`}
                onClick={() => onCanvasThemeChange('dark')}
                type="button"
              >
                <span className={styles.darkSwatch} />
                <span>Dark Canvas</span>
              </button>
            </div>
          </div>

          {/* Delete & Resync Section */}
          {onDeleteAndResync ? (
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Local Mailbox Cache & Resynchronization</span>
              <span className={styles.sectionDesc}>
                If messages are incomplete or out of sync, wipe the local storage and re-fetch everything from the mail server.
              </span>

              <div className={styles.dangerCard}>
                <div className={styles.dangerInfo}>
                  <span className={styles.dangerTitle}>
                    {activeAccountEmail ? `Account: ${activeAccountEmail}` : 'Active Mailbox Cache'}
                  </span>
                  <span className={styles.dangerDesc}>
                    {isConfirmingDelete
                      ? '⚠️ Are you sure? All locally downloaded conversations will be deleted and re-downloaded from scratch.'
                      : 'Deletes local cache JSON and performs a complete fresh IMAP synchronization.'}
                  </span>
                </div>

                <div className={styles.dangerActions}>
                  {isConfirmingDelete ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.dangerBtn} ${styles.dangerBtnConfirm}`}
                        onClick={handleConfirmResync}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={12} className={isSyncing ? styles.spinning : ''} />
                        <span>Yes, Wipe & Resync</span>
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setIsConfirmingDelete(false)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => setIsConfirmingDelete(true)}
                      disabled={isSyncing}
                    >
                      <AlertTriangle size={13} />
                      <span>Delete & Resync All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <button className={styles.primaryBtn} onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
});
