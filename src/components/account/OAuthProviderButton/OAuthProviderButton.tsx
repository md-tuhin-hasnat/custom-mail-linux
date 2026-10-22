import React from 'react';
import styles from './OAuthProviderButton.module.css';

interface OAuthProviderButtonProps {
  provider: 'google' | 'microsoft' | 'imap';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const OAuthProviderButton = React.memo(function OAuthProviderButton({
  provider,
  title,
  subtitle,
  icon,
  onClick,
  disabled = false,
}: OAuthProviderButtonProps) {
  const iconClass =
    provider === 'google'
      ? styles.googleIcon
      : provider === 'microsoft'
      ? styles.microsoftIcon
      : styles.imapIcon;

  return (
    <button
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <div className={`${styles.iconWrapper} ${iconClass}`}>{icon}</div>
      <div className={styles.textGroup}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
    </button>
  );
});
