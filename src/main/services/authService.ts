/**
 * authService.ts
 * High-level authentication orchestrator.
 * Coordinates OAuth logins across providers (Google, Microsoft), persists new account profiles
 * to StorageService, and handles manual IMAP/SMTP account registration.
 */

import { BrowserWindow } from 'electron';
import { AccountConfig, AuthResult, ManualServerConfig } from '../../types/account';
import { StorageService } from './storageService';
import { loginWithGoogle } from './googleAuth';
import { loginWithMicrosoft } from './microsoftAuth';

export class AuthService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  public async loginGoogle(parentWindow: BrowserWindow | null): Promise<AuthResult> {
    const result = await loginWithGoogle(parentWindow);
    if (result.success && result.account) {
      this.registerAccount(result.account);
    }
    return result;
  }

  public async loginMicrosoft(parentWindow: BrowserWindow | null): Promise<AuthResult> {
    const result = await loginWithMicrosoft(parentWindow);
    if (result.success && result.account) {
      this.registerAccount(result.account);
    }
    return result;
  }

  public async loginManual(
    email: string,
    name: string,
    server: ManualServerConfig
  ): Promise<AuthResult> {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address provided.' };
    }

    const encryptedPassword = server.password
      ? this.storage.encryptSecret(server.password)
      : undefined;

    const account: AccountConfig = {
      id: `acc-imap-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      type: 'imap',
      avatarColor: '#bf5af2',
      createdAt: new Date().toISOString(),
      manualServer: {
        ...server,
        password: undefined, // Do not store plaintext password
        encryptedPassword,
      },
    };

    this.registerAccount(account);
    return { success: true, account };
  }

  private registerAccount(account: AccountConfig): void {
    const existing = this.storage.getAccounts();
    const updated = [...existing.filter((a) => a.email !== account.email), account];
    this.storage.saveAccounts(updated);
    this.storage.setActiveAccountId(account.id);

    // Immediately initialize rich mailbox data
    const data = this.storage.getAccountData(account.id);

    // If Google Workspace with active token, attempt background inbox sync
    if (account.type === 'google' && account.oauth?.accessToken) {
      import('./gmailSync').then(({ syncGmailAccount }) => {
        syncGmailAccount(account, this.storage).catch(() => {});
      }).catch(() => {});
    }
  }
}
