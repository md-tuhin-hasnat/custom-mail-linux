import { useState, useCallback } from 'react';
import { AccountConfig, ManualServerConfig } from '@/types/account';

interface UseAccountAuthProps {
  onAccountAdded: (account: AccountConfig) => void;
  onClose: () => void;
}

export function useAccountAuth({ onAccountAdded, onClose }: UseAccountAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = useCallback(async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      if (window.desktopAPI?.auth?.loginGoogle) {
        const res = await window.desktopAPI.auth.loginGoogle();
        if (res?.success && res.account) {
          onAccountAdded(res.account);
          onClose();
          return;
        } else if (res?.error) {
          setErrorMessage(res.error);
          return;
        }
      }

      // Safe fallback when running in browser mode without desktopAPI
      const userEmail = prompt('Enter your Google Workspace or Gmail address:', 'workspace.user@gmail.com');
      if (!userEmail || !userEmail.includes('@')) {
        return;
      }

      const googleAccount: AccountConfig = {
        id: `acc-google-${Date.now()}`,
        email: userEmail,
        name: userEmail.split('@')[0],
        type: 'google',
        avatarColor: '#ea4335',
        createdAt: new Date().toISOString(),
      };
      onAccountAdded(googleAccount);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [onAccountAdded, onClose]);

  const handleMicrosoftLogin = useCallback(async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      if (window.desktopAPI?.auth?.loginMicrosoft) {
        const res = await window.desktopAPI.auth.loginMicrosoft();
        if (res?.success && res.account) {
          onAccountAdded(res.account);
          onClose();
          return;
        } else if (res?.error) {
          setErrorMessage(res.error);
          return;
        }
      }

      const userEmail = prompt('Enter your Microsoft 365 or Outlook address:', 'executive.user@outlook.com');
      if (!userEmail || !userEmail.includes('@')) {
        return;
      }

      const msAccount: AccountConfig = {
        id: `acc-ms-${Date.now()}`,
        email: userEmail,
        name: userEmail.split('@')[0],
        type: 'microsoft',
        avatarColor: '#0078d4',
        createdAt: new Date().toISOString(),
      };
      onAccountAdded(msAccount);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [onAccountAdded, onClose]);

  const handleManualSubmit = useCallback(
    async (email: string, name: string, server: ManualServerConfig) => {
      setIsConnecting(true);
      setErrorMessage(null);
      try {
        if (window.desktopAPI?.auth?.loginManual) {
          const res = await window.desktopAPI.auth.loginManual({ email, name, server });
          if (res?.success && res.account) {
            onAccountAdded(res.account);
            onClose();
            return;
          } else if (res?.error) {
            setErrorMessage(res.error);
            return;
          }
        }

        const imapAccount: AccountConfig = {
          id: `acc-imap-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          type: 'imap',
          avatarColor: '#bf5af2',
          createdAt: new Date().toISOString(),
          manualServer: server,
        };
        onAccountAdded(imapAccount);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setErrorMessage(msg);
      } finally {
        setIsConnecting(false);
      }
    },
    [onAccountAdded, onClose]
  );

  return {
    isConnecting,
    errorMessage,
    handleGoogleLogin,
    handleMicrosoftLogin,
    handleManualSubmit,
  };
}
