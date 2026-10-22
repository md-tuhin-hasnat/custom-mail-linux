import React from 'react';
import { Mail, Globe } from 'lucide-react';
import { OAuthProviderButton } from '@/components/account/OAuthProviderButton/OAuthProviderButton';
import styles from './OAuthProviderList.module.css';

interface OAuthProviderListProps {
  onGoogleLogin: () => void;
  onMicrosoftLogin: () => void;
  onManualSelect: () => void;
  disabled: boolean;
}

export const OAuthProviderList = React.memo(function OAuthProviderList({
  onGoogleLogin,
  onMicrosoftLogin,
  onManualSelect,
  disabled,
}: OAuthProviderListProps) {
  return (
    <div className={styles.providerList}>
      <OAuthProviderButton
        provider="google"
        title="Google Workspace & Gmail"
        subtitle="Automatic OAuth 2.0 PKCE authentication"
        icon="G"
        onClick={onGoogleLogin}
        disabled={disabled}
      />
      <OAuthProviderButton
        provider="microsoft"
        title="Microsoft 365 & Exchange"
        subtitle="Outlook, Hotmail, or corporate Exchange"
        icon={<Mail size={16} />}
        onClick={onMicrosoftLogin}
        disabled={disabled}
      />
      <OAuthProviderButton
        provider="imap"
        title="Custom Mail Domain (IMAP / SMTP)"
        subtitle="Any corporate, university, or private mail server"
        icon={<Globe size={16} />}
        onClick={onManualSelect}
        disabled={disabled}
      />
    </div>
  );
});
