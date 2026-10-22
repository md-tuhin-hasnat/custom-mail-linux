import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Attachment } from '@/types/mail';
import styles from './MediaViewerToolbar.module.css';

interface MediaViewerToolbarProps {
  attachment: Attachment;
  currentIndex: number;
  totalCount: number;
  zoom: number;
  showZoomControls: boolean;
  isDownloading: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onDownload: () => void;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getBadgeStyle(mimeType: string, extension: string) {
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { icon: <FileText size={18} />, className: styles.badgePdf, label: 'PDF' };
  }
  if (mimeType.startsWith('image/') || extension.match(/png|jpg|jpeg|gif|webp|svg/i)) {
    return { icon: <ImageIcon size={18} />, className: styles.badgeImage, label: extension.toUpperCase() || 'IMG' };
  }
  if (mimeType.startsWith('video/') || extension.match(/mp4|webm|mkv|mov/i)) {
    return { icon: <Video size={18} />, className: styles.badgeVideo, label: 'VIDEO' };
  }
  if (extension.match(/xlsx|xls|csv/i)) {
    return { icon: <FileSpreadsheet size={18} />, className: styles.badgeSpreadsheet, label: 'SHEET' };
  }
  if (mimeType.startsWith('audio/') || extension.match(/mp3|wav|ogg|aac/i)) {
    return { icon: <Music size={18} />, className: styles.badgeVideo, label: 'AUDIO' };
  }
  return { icon: <FileText size={18} />, className: styles.badgeDefault, label: extension.toUpperCase() || 'FILE' };
}

export const MediaViewerToolbar = React.memo(function MediaViewerToolbar({
  attachment,
  currentIndex,
  totalCount,
  zoom,
  showZoomControls,
  isDownloading,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrev,
  onNext,
  onDownload,
  onClose,
}: MediaViewerToolbarProps) {
  const badgeInfo = getBadgeStyle(attachment.mimeType, attachment.extension);

  return (
    <header className={styles.toolbar}>
      <div className={styles.leftSection}>
        <div className={`${styles.fileIconBadge} ${badgeInfo.className}`}>
          {badgeInfo.icon}
        </div>
        <div className={styles.meta}>
          <span className={styles.fileName} title={attachment.name}>
            {attachment.name}
          </span>
          <div className={styles.fileSub}>
            <span className={styles.tagPill}>{badgeInfo.label}</span>
            <span>{formatBytes(attachment.size)}</span>
          </div>
        </div>
      </div>

      <div className={styles.centerSection}>
        {totalCount > 1 && onPrev && onNext ? (
          <div className={styles.navPill}>
            <button
              className={styles.navArrowBtn}
              onClick={onPrev}
              disabled={currentIndex === 0}
              title="Previous attachment (←)"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.navCount}>
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              className={styles.navArrowBtn}
              onClick={onNext}
              disabled={currentIndex === totalCount - 1}
              title="Next attachment (→)"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}

        {showZoomControls ? (
          <div className={styles.zoomGroup}>
            <button className={styles.zoomBtn} onClick={onZoomOut} title="Zoom Out (-)" type="button">
              <ZoomOut size={15} />
            </button>
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={onZoomIn} title="Zoom In (+)" type="button">
              <ZoomIn size={15} />
            </button>
            <button className={styles.zoomBtn} onClick={onZoomReset} title="Reset Zoom" type="button">
              <RotateCcw size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.rightSection}>
        <button
          className={styles.downloadBtn}
          onClick={onDownload}
          disabled={isDownloading}
          title="Choose location and save attachment to disk"
          type="button"
        >
          {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          <span>{isDownloading ? 'Saving...' : 'Download'}</span>
        </button>

        <button className={styles.closeBtn} onClick={onClose} title="Close viewer (Esc)" type="button">
          <X size={16} />
          <kbd className={styles.kbd}>ESC</kbd>
        </button>
      </div>
    </header>
  );
});
