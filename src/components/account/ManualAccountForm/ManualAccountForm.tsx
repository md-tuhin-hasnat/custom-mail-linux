import React, { useState } from 'react';
import { autoDetectMailDomain } from '@/utils/domainPresets';
import { ManualServerConfig } from '@/types/account';
import { Button } from '@/components/common/Button/Button';
import styles from './ManualAccountForm.module.css';

interface ManualAccountFormProps {
  onSubmit: (email: string, name: string, server: ManualServerConfig) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ManualAccountForm = React.memo(function ManualAccountForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManualAccountFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [incomingHost, setIncomingHost] = useState('');
  const [incomingPort, setIncomingPort] = useState(993);
  const [incomingTls, setIncomingTls] = useState(true);
  const [outgoingHost, setOutgoingHost] = useState('');
  const [outgoingPort, setOutgoingPort] = useState(587);
  const [outgoingTls, setOutgoingTls] = useState(true);

  // Auto-detect server hosts when user finishes entering domain
  const handleEmailBlur = () => {
    if (email.includes('@')) {
      const detected = autoDetectMailDomain(email);
      if (!incomingHost) setIncomingHost(detected.incomingHost);
      if (!outgoingHost) setOutgoingHost(detected.outgoingHost);
      setIncomingPort(detected.incomingPort);
      setOutgoingPort(detected.outgoingPort);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    onSubmit(email, name || email.split('@')[0], {
      incomingHost: incomingHost || `imap.${email.split('@')[1]}`,
      incomingPort: Number(incomingPort) || 993,
      incomingTls,
      outgoingHost: outgoingHost || `smtp.${email.split('@')[1]}`,
      outgoingPort: Number(outgoingPort) || 587,
      outgoingTls,
      username: email,
      password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <label className={styles.label}>Email Address</label>
        <input
          type="email"
          className={styles.input}
          placeholder="employee@corporate-domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          required
          autoFocus
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Your Name</label>
        <input
          type="text"
          className={styles.input}
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Password / App Password</label>
        <input
          type="password"
          className={styles.input}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className={styles.serverSection}>
        <span className={styles.label}>Incoming Server (IMAP)</span>
        <div className={styles.grid2}>
          <input
            type="text"
            className={styles.input}
            placeholder="imap.domain.com"
            value={incomingHost}
            onChange={(e) => setIncomingHost(e.target.value)}
          />
          <input
            type="number"
            className={styles.input}
            placeholder="993"
            value={incomingPort}
            onChange={(e) => setIncomingPort(Number(e.target.value))}
          />
        </div>

        <span className={styles.label}>Outgoing Server (SMTP)</span>
        <div className={styles.grid2}>
          <input
            type="text"
            className={styles.input}
            placeholder="smtp.domain.com"
            value={outgoingHost}
            onChange={(e) => setOutgoingHost(e.target.value)}
          />
          <input
            type="number"
            className={styles.input}
            placeholder="587"
            value={outgoingPort}
            onChange={(e) => setOutgoingPort(Number(e.target.value))}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Connecting...' : 'Connect Account'}
        </Button>
      </div>
    </form>
  );
});
