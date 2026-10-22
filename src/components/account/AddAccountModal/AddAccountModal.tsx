import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AccountConfig } from '@/types/account';
import { OAuthProviderList } from '@/components/account/OAuthProviderList/OAuthProviderList';
import { ManualAccountForm } from '@/components/account/ManualAccountForm/ManualAccountForm';
import { useAccountAuth } from '@/hooks/useAccountAuth';
import styles from './AddAccountModal.module.css';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: (account: AccountConfig) => void;
}

export const AddAccountModal = React.memo(function AddAccountModal({
  isOpen,
  onClose,
  onAccountAdded,
}: AddAccountModalProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const {
    isConnecting,
    errorMessage,
    handleGoogleLogin,
    handleMicrosoftLogin,
    handleManualSubmit,
  } = useAccountAuth({ onAccountAdded, onClose });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <span className={styles.title}>
            {showManualForm ? 'Manual Server Configuration' : 'Add Account'}
          </span>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {errorMessage ? (
            <div className={styles.errorBanner}>{errorMessage}</div>
          ) : null}

          {!showManualForm ? (
            <OAuthProviderList
              onGoogleLogin={handleGoogleLogin}
              onMicrosoftLogin={handleMicrosoftLogin}
              onManualSelect={() => setShowManualForm(true)}
              disabled={isConnecting}
            />
          ) : (
            <ManualAccountForm
              onSubmit={handleManualSubmit}
              onCancel={() => setShowManualForm(false)}
              isSubmitting={isConnecting}
            />
          )}
        </div>
      </div>
    </div>
  );
});
