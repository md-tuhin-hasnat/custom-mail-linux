/**
 * authIpc.ts
 * Electron IPC handlers for authentication and account management.
 * Handles OAuth logins (Google, Microsoft), manual IMAP/SMTP setup,
 * fetching stored accounts, switching active accounts, and removing accounts.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { AccountConfig, ManualServerConfig } from '../../types/account';

export function registerAuthIpc(
  auth: AuthService,
  storage: StorageService,
  getMainWindow: () => BrowserWindow | null,
  onAccountSwitched: (acc: AccountConfig | null) => void
) {
  ipcMain.handle('auth:login-google', async () => {
    const result = await auth.loginGoogle(getMainWindow());
    if (result.success && result.account) {
      onAccountSwitched(result.account);
    }
    return result;
  });

  ipcMain.handle('auth:login-microsoft', async () => {
    return auth.loginMicrosoft(getMainWindow());
  });

  ipcMain.handle(
    'auth:login-manual',
    async (_, config: { email: string; name: string; server: ManualServerConfig }) => {
      return auth.loginManual(config.email, config.name, config.server);
    }
  );

  ipcMain.handle('account:get-accounts', async () => {
    return storage.getAccounts();
  });

  ipcMain.handle('account:get-active', async () => {
    const accounts = storage.getAccounts();
    const activeId = storage.getActiveAccountId();
    return accounts.find((a) => a.id === activeId) || accounts[0] || null;
  });

  ipcMain.handle('account:switch-account', async (_, accountId: string) => {
    storage.setActiveAccountId(accountId);
    const accounts = storage.getAccounts();
    const current = accounts.find((a) => a.id === accountId) || null;
    onAccountSwitched(current);
    return current;
  });

  ipcMain.handle('account:remove-account', async (_, accountId: string) => {
    const accounts = storage.getAccounts();
    const filtered = accounts.filter((a) => a.id !== accountId);
    storage.saveAccounts(filtered);
    if (storage.getActiveAccountId() === accountId) {
      const nextAcc = filtered[0] || null;
      storage.setActiveAccountId(nextAcc?.id || '');
      onAccountSwitched(nextAcc);
    }
    return true;
  });
}
