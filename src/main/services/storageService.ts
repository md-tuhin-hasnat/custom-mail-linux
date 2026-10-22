/**
 * storageService.ts
 * Local persistent data access layer for Aura Mail.
 * Encapsulates encrypted credentials storage using Electron safeStorage,
 * account metadata management, per-account JSON mailbox cache stores,
 * and persistent deletion tombstones (deletedThreadIds, deletedMessageIds).
 */

import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { AccountConfig } from '../../types/account';
import { MailFolder, MailThread } from '../../types/mail';
import { CalendarEvent } from '../../types/calendar';
import { Contact } from '../../types/contacts';
import { TaskItem } from '../../types/tasks';
import { createInitialAccountData } from './accountDataFactory';

export interface AccountDataStore {
  folders: MailFolder[];
  threads: MailThread[];
  events: CalendarEvent[];
  contacts: Contact[];
  tasks: TaskItem[];
  deletedThreadIds?: string[];
  deletedMessageIds?: string[];
  lastSyncedTotalExists?: number;
}

export class StorageService {
  private baseDir: string;
  private accountsFile: string;
  private activeAccountFile: string;

  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'store');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    this.accountsFile = path.join(this.baseDir, 'accounts.json');
    this.activeAccountFile = path.join(this.baseDir, 'active_account.json');
  }

  public encryptSecret(plainText: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(plainText).toString('base64');
    }
    return Buffer.from(plainText).toString('base64');
  }

  public decryptSecret(cipherBase64: string): string {
    const buffer = Buffer.from(cipherBase64, 'base64');
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer);
    }
    return buffer.toString('utf-8');
  }

  public getAccounts(): AccountConfig[] {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const raw = fs.readFileSync(this.accountsFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read accounts.json:', err);
    }
    return [];
  }

  public saveAccounts(accounts: AccountConfig[]): void {
    try {
      fs.writeFileSync(this.accountsFile, JSON.stringify(accounts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write accounts.json:', err);
    }
  }

  public getActiveAccountId(): string | null {
    try {
      if (fs.existsSync(this.activeAccountFile)) {
        const raw = fs.readFileSync(this.activeAccountFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed.activeId || null;
      }
    } catch (err) {
      console.error('Failed to read active_account.json:', err);
    }
    return null;
  }

  public setActiveAccountId(activeId: string): void {
    try {
      fs.writeFileSync(this.activeAccountFile, JSON.stringify({ activeId }), 'utf-8');
    } catch (err) {
      console.error('Failed to write active_account.json:', err);
    }
  }

  public getAccountData(accountId: string): AccountDataStore {
    const accountFilePath = path.join(this.baseDir, `mailbox_${accountId}.json`);
    try {
      if (fs.existsSync(accountFilePath)) {
        const raw = fs.readFileSync(accountFilePath, 'utf-8');
        const data: AccountDataStore = JSON.parse(raw);
        let modified = false;
        for (const t of data.threads) {
          if (t.labelIds && t.labelIds.some((l) => l.includes('\\'))) {
            t.labelIds = t.labelIds.map((l) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, ''));
            modified = true;
          }
          const hasInbox = t.labelIds?.some((l) => l.toLowerCase() === 'inbox');
          if (hasInbox && t.folderId === 'archive') {
            t.folderId = 'inbox';
            modified = true;
          }
        }
        if (modified) {
          this.saveAccountData(accountId, data);
        }
        if (!data.deletedThreadIds) data.deletedThreadIds = [];
        if (!data.deletedMessageIds) data.deletedMessageIds = [];
        return data;
      }
    } catch (err) {
      console.error(`Failed to read mailbox for ${accountId}:`, err);
    }

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === accountId);
    const initialData = createInitialAccountData(account);
    this.saveAccountData(accountId, initialData);
    return initialData;
  }

  public saveAccountData(accountId: string, data: AccountDataStore): void {
    const accountFilePath = path.join(this.baseDir, `mailbox_${accountId}.json`);
    try {
      fs.writeFileSync(accountFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to write mailbox for ${accountId}:`, err);
    }
  }

  public clearAccountMailbox(accountId: string): AccountDataStore {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === accountId);
    const cleanData = createInitialAccountData(account);
    cleanData.threads = [];
    this.saveAccountData(accountId, cleanData);
    return cleanData;
  }
}
