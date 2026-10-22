import React, { useState, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Eye,
  Check,
  Loader2,
} from 'lucide-react';
import { Attachment } from '@/types/mail';
import styles from './AttachmentCard.module.css';

interface AttachmentCardProps {
  attachment: Attachment;
  messageId?: string;
  accountId?: string;
  onPreview?: (attachment: Attachment) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getIcon(mimeType: string, extension: string) {
  if (mimeType.startsWith('image/') || extension.match(/png|jpg|jpeg|gif|webp|svg/i)) {
    return <ImageIcon size={18} />;
  }
  if (mimeType.startsWith('video/') || extension.match(/mp4|webm|mkv|mov/i)) {
    return <Video size={18} />;
  }
  if (mimeType.startsWith('audio/') || extension.match(/mp3|wav|ogg|aac/i)) {
    return <Music size={18} />;
  }
  if (extension.match(/xlsx|xls|csv/i)) {
    return <FileSpreadsheet size={18} />;
  }
  return <FileText size={18} />;
}

export const AttachmentCard = React.memo(function AttachmentCard({
  attachment,
  messageId,
  accountId,
  onPreview,
}: AttachmentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleCardClick = useCallback(() => {
    onPreview?.(attachment);
  }, [attachment, onPreview]);

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDownloading) return;

      setIsDownloading(true);
      try {
        if (window.desktopAPI?.mail?.downloadAttachment) {
          const res = await window.desktopAPI.mail.downloadAttachment({
            messageId: attachment.messageId || messageId,
            attachmentId: attachment.id,
            name: attachment.name,
            mimeType: attachment.mimeType,
            accountId,
          });

          if (res.success) {
            setIsDownloaded(true);
            setTimeout(() => setIsDownloaded(false), 2500);
          }
        }
      } catch (err) {
        console.error('Failed to download attachment:', err);
      } finally {
        setIsDownloading(false);
      }
    },
    [attachment, messageId, accountId, isDownloading]
  );

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      title={`Click to preview ${attachment.name} inside app`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      <div className={styles.leftGroup}>
        <div className={styles.iconWrapper}>
          {getIcon(attachment.mimeType, attachment.extension)}
        </div>
        <div className={styles.info}>
          <span className={styles.name}>{attachment.name}</span>
          <span className={styles.size}>{formatBytes(attachment.size)}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          type="button"
          onClick={handleCardClick}
          title="Preview inside app"
        >
          <Eye size={15} />
        </button>

        <button
          className={`${styles.actionBtn} ${isDownloaded ? styles.downloadSuccess : ''}`}
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          title="Choose location and download"
        >
          {isDownloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isDownloaded ? (
            <Check size={15} />
          ) : (
            <Download size={15} />
          )}
        </button>
      </div>
    </div>
  );
});
