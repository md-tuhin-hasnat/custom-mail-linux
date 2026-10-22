import React, { useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { Attachment } from '@/types/mail';
import { AttachmentCard } from '@/components/mail/AttachmentCard/AttachmentCard';
import styles from './AttachmentList.module.css';

interface AttachmentListProps {
  attachments: Attachment[];
  messageId?: string;
  accountId?: string;
  onPreviewAttachment?: (attachment: Attachment, allAttachments: Attachment[]) => void;
}

export const AttachmentList = React.memo(function AttachmentList({
  attachments,
  messageId,
  accountId,
  onPreviewAttachment,
}: AttachmentListProps) {
  const handlePreview = useCallback(
    (att: Attachment) => {
      onPreviewAttachment?.(att, attachments);
    },
    [attachments, onPreviewAttachment]
  );

  if (attachments.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <Paperclip size={14} />
        <span>
          {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
        </span>
      </div>
      <div className={styles.grid}>
        {attachments.map((att) => (
          <AttachmentCard
            key={att.id}
            attachment={att}
            messageId={messageId}
            accountId={accountId}
            onPreview={handlePreview}
          />
        ))}
      </div>
    </div>
  );
});
