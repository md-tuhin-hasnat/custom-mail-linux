import React from 'react';
import { UserPlus } from 'lucide-react';
import { Contact } from '@/types/contacts';
import { ContactCard } from '@/components/contacts/ContactCard/ContactCard';
import { Button } from '@/components/common/Button/Button';
import styles from './ContactsView.module.css';

interface ContactsViewProps {
  contacts: Contact[];
  onEmailContact: (email: string) => void;
  onAddContact: () => void;
}

export const ContactsView = React.memo(function ContactsView({
  contacts,
  onEmailContact,
  onAddContact,
}: ContactsViewProps) {
  return (
    <section className={styles.container} aria-label="People and Contacts">
      <div className={styles.topBar}>
        <h1 className={styles.title}>People & Directory</h1>
        <Button
          variant="primary"
          icon={<UserPlus size={14} />}
          onClick={onAddContact}
        >
          Add Contact
        </Button>
      </div>

      <div className={styles.content}>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEmailClick={onEmailContact}
          />
        ))}
      </div>
    </section>
  );
});
