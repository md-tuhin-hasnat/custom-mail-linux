import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Image as ImageIcon, Video, Music } from 'lucide-react';
import { Attachment } from '@/types/mail';
import { MediaViewerToolbar } from '@/components/mail/MediaViewerToolbar/MediaViewerToolbar';
import { MediaViewerContent } from '@/components/mail/MediaViewerContent/MediaViewerContent';
import styles from './MediaViewerModal.module.css';

interface MediaViewerModalProps {
  isOpen: boolean;
  initialAttachment: Attachment | null;
  attachments: Attachment[];
  messageId?: string;
  accountId?: string;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getDockIcon(mimeType: string, extension: string) {
  if (mimeType.startsWith('image/') || extension.match(/png|jpg|jpeg|gif|webp|svg/i)) {
    return <ImageIcon size={13} color="#c084fc" />;
  }
  if (mimeType.startsWith('video/') || extension.match(/mp4|webm|mkv|mov/i)) {
    return <Video size={13} color="#fcd34d" />;
  }
  if (mimeType.startsWith('audio/') || extension.match(/mp3|wav|ogg|aac/i)) {
    return <Music size={13} color="#fcd34d" />;
  }
  if (extension.match(/xlsx|xls|csv/i)) {
    return <FileSpreadsheet size={13} color="#6ee7b7" />;
  }
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return <FileText size={13} color="#f87171" />;
  }
  return <FileText size={13} color="#60a5fa" />;
}

export const MediaViewerModal = React.memo(function MediaViewerModal({
  isOpen,
  initialAttachment,
  attachments,
  messageId,
  accountId,
  onClose,
}: MediaViewerModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialAttachment && attachments.length > 0) {
      const idx = attachments.findIndex((a) => a.id === initialAttachment.id);
      setActiveIndex(idx !== -1 ? idx : 0);
    }
  }, [initialAttachment, attachments]);

  const currentAttachment = useMemo(() => {
    return attachments[activeIndex] || initialAttachment;
  }, [attachments, activeIndex, initialAttachment]);

  useEffect(() => {
    if (!isOpen || !currentAttachment) return;

    if (currentAttachment.dataUrl) {
      setDataUrl(currentAttachment.dataUrl);
      return;
    }

    if (window.desktopAPI?.mail?.getAttachmentData) {
      setIsLoading(true);
      setError(undefined);
      window.desktopAPI.mail
        .getAttachmentData({
          messageId: currentAttachment.messageId || messageId,
          attachmentId: currentAttachment.id,
          name: currentAttachment.name,
          mimeType: currentAttachment.mimeType,
          accountId,
        })
        .then((res) => {
          if (res.dataUrl) {
            setDataUrl(res.dataUrl);
          } else if (res.error) {
            setError(res.error);
          }
        })
        .catch((err) => {
          setError(err?.message || 'Failed to load preview');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentAttachment, messageId, accountId]);

  const handleDownload = useCallback(async () => {
    if (!currentAttachment) return;
    setIsDownloading(true);
    try {
      if (window.desktopAPI?.mail?.downloadAttachment) {
        await window.desktopAPI.mail.downloadAttachment({
          messageId: currentAttachment.messageId || messageId,
          attachmentId: currentAttachment.id,
          name: currentAttachment.name,
          mimeType: currentAttachment.mimeType,
          accountId,
        });
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [currentAttachment, messageId, accountId]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
    setZoom(1);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(attachments.length - 1, prev + 1));
    setZoom(1);
  }, [attachments.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentAttachment) return null;

  const isImage = currentAttachment.mimeType.startsWith('image/');

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <MediaViewerToolbar
        attachment={currentAttachment}
        currentIndex={activeIndex}
        totalCount={attachments.length}
        zoom={zoom}
        showZoomControls={isImage}
        isDownloading={isDownloading}
        onZoomIn={() => setZoom((z) => Math.min(3, z + 0.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        onZoomReset={() => setZoom(1)}
        onPrev={handlePrev}
        onNext={handleNext}
        onDownload={handleDownload}
        onClose={onClose}
      />

      {attachments.length > 1 && activeIndex > 0 ? (
        <button
          className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
          onClick={handlePrev}
          title="Previous attachment (←)"
          type="button"
        >
          <ChevronLeft size={22} />
        </button>
      ) : null}

      <MediaViewerContent
        attachment={currentAttachment}
        dataUrl={dataUrl}
        isLoading={isLoading}
        error={error}
        zoom={zoom}
        onDownload={handleDownload}
      />

      {attachments.length > 1 && activeIndex < attachments.length - 1 ? (
        <button
          className={`${styles.sideNavBtn} ${styles.sideNavRight}`}
          onClick={handleNext}
          title="Next attachment (→)"
          type="button"
        >
          <ChevronRight size={22} />
        </button>
      ) : null}

      {attachments.length > 1 ? (
        <div className={styles.bottomDock}>
          {attachments.map((att, idx) => (
            <button
              key={att.id}
              className={`${styles.dockItem} ${idx === activeIndex ? styles.dockItemActive : ''}`}
              onClick={() => {
                setActiveIndex(idx);
                setZoom(1);
              }}
              type="button"
              title={att.name}
            >
              {getDockIcon(att.mimeType, att.extension)}
              <span className={styles.dockName}>{att.name}</span>
              <span className={styles.dockSize}>{formatBytes(att.size)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
});
