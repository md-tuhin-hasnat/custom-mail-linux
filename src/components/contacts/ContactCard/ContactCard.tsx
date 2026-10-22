import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Contact } from '@/types/contacts';
import { Avatar } from '@/components/common/Avatar/Avatar';
import styles from './ContactCard.module.css';

interface ContactCardProps {
  contact: Contact;
  onEmailClick: (email: string) => void;
}

export const ContactCard = React.memo(function ContactCard({
  contact,
  onEmailClick,
}: ContactCardProps) {
  return (
    <div className={styles.card}>
      <Avatar name={contact.name} color={contact.avatarColor} size="lg" />

      <div className={styles.details}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{contact.name}</span>
        </div>
        <span className={styles.role}>
          {contact.role} {contact.department ? `· ${contact.department}` : ''}
        </span>
        <span className={styles.meta}>
          {contact.company || contact.email}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={() => onEmailClick(contact.email)}
          title={`Send email to ${contact.email}`}
          type="button"
        >
          <Mail size={15} />
        </button>
        {contact.phone ? (
          <button
            className={styles.iconBtn}
            onClick={() => alert(`Dialing ${contact.phone}...`)}
            title={`Call ${contact.phone}`}
            type="button"
          >
            <Phone size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
});
