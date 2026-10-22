/**
 * useAccountManager.ts
 * Custom hook to manage multi-account state and synchronization with Electron storage.
 * Handles fetching configured accounts, active account selection, switching accounts,
 * and opening the account configuration modal.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AccountConfig } from '@/types/account';

const defaultPrimaryAccount: AccountConfig = {
  id: 'acc-primary-1',
  email: 'touhidur@enterprise.corp',
  name: 'Touhidur Rahman',
  type: 'microsoft',
  avatarColor: '#0a84ff',
  createdAt: new Date().toISOString(),
  isDefault: true,
};

export function useAccountManager() {
  const [accounts, setAccounts] = useState<AccountConfig[]>([defaultPrimaryAccount]);
  const [activeAccountId, setActiveAccountId] = useState<string>(defaultPrimaryAccount.id);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (typeof window === 'undefined' || !window.desktopAPI?.account?.getAccounts) return;
    try {
      const accs = await window.desktopAPI.account.getAccounts();
      if (accs && accs.length > 0) {
        setAccounts(accs);
        const active = await window.desktopAPI.account.getActiveAccount();
        if (active) {
          setActiveAccountId(active.id);
        } else {
          setActiveAccountId(accs[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load accounts from storage:', err);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || accounts[0],
    [accounts, activeAccountId]
  );

  const handleAccountAdded = useCallback((newAcc: AccountConfig) => {
    setAccounts((prev) => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
  }, []);

  const handleAccountSwitch = useCallback(async (accId: string) => {
    setActiveAccountId(accId);
    if (window.desktopAPI?.account?.switchAccount) {
      await window.desktopAPI.account.switchAccount(accId);
    }
  }, []);

  const connectionName = useMemo(() => {
    if (!activeAccount) return 'Connecting...';
    if (activeAccount.type === 'google') return `Connected to Google Workspace (${activeAccount.email})`;
    if (activeAccount.type === 'microsoft') return `Connected to Microsoft 365 (${activeAccount.email})`;
    return `Connected to Custom IMAP (${activeAccount.email})`;
  }, [activeAccount]);

  return {
    accounts,
    activeAccountId,
    activeAccount,
    isAddAccountOpen,
    setIsAddAccountOpen,
    loadAccounts,
    handleAccountAdded,
    handleAccountSwitch,
    connectionName,
  };
}
