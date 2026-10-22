import React, { useMemo } from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';
import { Attachment } from '@/types/mail';
import styles from './MediaViewerContent.module.css';

interface MediaViewerContentProps {
  attachment: Attachment;
  dataUrl?: string;
  isLoading: boolean;
  error?: string;
  zoom: number;
  onDownload: () => void;
}

export const MediaViewerContent = React.memo(function MediaViewerContent({
  attachment,
  dataUrl,
  isLoading,
  error,
  zoom,
  onDownload,
}: MediaViewerContentProps) {
  const mime = attachment.mimeType.toLowerCase();
  const ext = attachment.extension.toLowerCase();

  const isPdf = mime === 'application/pdf' || ext === 'pdf';
  const isImage = mime.startsWith('image/') || ext.match(/png|jpg|jpeg|gif|webp|svg/i);
  const isVideo = mime.startsWith('video/') || ext.match(/mp4|webm|mkv|mov/i);
  const isAudio = mime.startsWith('audio/') || ext.match(/mp3|wav|ogg|aac/i);
  const isText =
    mime.startsWith('text/') ||
    ext.match(/txt|csv|json|md|log|xml|js|ts|jsx|tsx|html|css/i);

  const decodedText = useMemo(() => {
    if (!isText || !dataUrl) return '';
    try {
      const base64Index = dataUrl.indexOf('base64,');
      if (base64Index !== -1) {
        const raw = atob(dataUrl.slice(base64Index + 7));
        return decodeURIComponent(escape(raw));
      }
    } catch {
      // Fallback direct base64 decode
      try {
        const base64Index = dataUrl.indexOf('base64,');
        return atob(dataUrl.slice(base64Index + 7));
      } catch {}
    }
    return 'Unable to preview text content.';
  }, [isText, dataUrl]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <span>Loading attachment preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <AlertCircle size={36} color="#ef4444" />
          <span className={styles.emptyTitle}>Failed to Load Preview</span>
          <p className={styles.emptyDesc}>{error}</p>
        </div>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <FileQuestion size={36} color="#94a3b8" />
          <span className={styles.emptyTitle}>No Preview Data</span>
          <p className={styles.emptyDesc}>Download this attachment to view it with your default system application.</p>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={styles.container}>
        <iframe
          src={`${dataUrl}#toolbar=1&navpanes=1`}
          className={styles.pdfFrame}
          title={attachment.name}
        />
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={styles.container}>
        <div
          className={styles.imageWrapper}
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={dataUrl}
            alt={attachment.name}
            className={styles.image}
          />
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={styles.container}>
        <video
          src={dataUrl}
          controls
          autoPlay
          className={styles.videoPlayer}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className={styles.container}>
        <div className={styles.audioWrapper}>
          <audio src={dataUrl} controls autoPlay className={styles.audioPlayer}>
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    );
  }

  if (isText) {
    return (
      <div className={styles.container}>
        <pre className={styles.textViewer}>{decodedText}</pre>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.emptyCard}>
        <FileQuestion size={40} color="#60a5fa" />
        <span className={styles.emptyTitle}>Preview Not Supported</span>
        <p className={styles.emptyDesc}>
          In-app preview is not available for .{attachment.extension} files. You can save and open it with your system application.
        </p>
      </div>
    </div>
  );
});
