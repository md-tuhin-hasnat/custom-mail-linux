import React, { useMemo, useCallback } from 'react';
import { sanitizeEmailHtml } from '@/utils/sanitizeHtml';
import styles from './MessageBody.module.css';

interface MessageBodyProps {
  htmlContent: string;
  canvasTheme?: 'white' | 'dark';
}

export const MessageBody = React.memo(function MessageBody({
  htmlContent,
  canvasTheme = 'white',
}: MessageBodyProps) {
  // Layer 1: Strict DOMPurify sanitization for email HTML
  const sanitizedHtml = useMemo(
    () => sanitizeEmailHtml(htmlContent),
    [htmlContent]
  );

  // Layer 2: Safe external link handler (prevents in-app navigation & clickjacking)
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const linkElement = (e.target as HTMLElement).closest('a');
    if (!linkElement) return;

    e.preventDefault();
    const href = linkElement.getAttribute('href');
    if (!href) return;

    // Only allow verified external web & mailto links
    if (href.startsWith('https://') || href.startsWith('http://') || href.startsWith('mailto:')) {
      if (window.desktopAPI?.window?.openExternal) {
        window.desktopAPI.window.openExternal(href);
      } else {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  const className = canvasTheme === 'white' ? styles.canvasWhite : styles.canvasDark;

  return (
    <div
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
});
