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
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === accountId);
    const accountEmail = account?.email?.toLowerCase();

    try {
      if (fs.existsSync(accountFilePath)) {
        const raw = fs.readFileSync(accountFilePath, 'utf-8');
        const data: AccountDataStore = JSON.parse(raw);
        let modified = false;

        // Ensure Outbox folder exists
        if (!data.folders.some((f) => f.id === 'outbox')) {
          data.folders.push({
            id: 'outbox',
            name: 'Outbox',
            icon: 'SendHorizontal',
            unreadCount: 0,
            totalCount: 0,
            system: true,
          });
          modified = true;
        }

        // Canonical ordering of system folders
        const systemOrder = ['inbox', 'drafts', 'sent', 'outbox', 'archive', 'junk', 'trash'];
        data.folders.sort((a, b) => {
          const indexA = systemOrder.indexOf(a.id);
          const indexB = systemOrder.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        const norm = (l: string) => l.replace(/^[\\\/"]+|[\\\/"]+$/g, '').toLowerCase();

        // Auto-normalize thread classification
        for (const t of data.threads) {
          if (t.labelIds && t.labelIds.some((l) => l.includes('\\') || l.includes('"'))) {
            t.labelIds = t.labelIds.map(norm);
            modified = true;
          }

          const hasSent = t.labelIds?.some((l) => norm(l) === 'sent' || norm(l) === '[gmail]/sent mail' || norm(l) === 'sent items');
          const hasInbox = t.labelIds?.some((l) => norm(l) === 'inbox');
          const allSentByMe = Boolean(
            accountEmail &&
            t.messages &&
            t.messages.length > 0 &&
            t.messages.every((m) => m.senderEmail?.toLowerCase() === accountEmail || m.folderId === 'sent')
          );

          if (t.folderId !== 'trash' && t.folderId !== 'outbox') {
            if (allSentByMe || (hasSent && !hasInbox)) {
              if (t.folderId !== 'sent') {
                t.folderId = 'sent';
                modified = true;
              }
              if (t.messages) {
                for (const m of t.messages) {
                  if (m.folderId !== 'sent') {
                    m.folderId = 'sent';
                    modified = true;
                  }
                }
              }
            } else if (hasInbox && t.folderId === 'archive') {
              t.folderId = 'inbox';
              modified = true;
            }
          }
        }

        // Recalculate folder counts accurately
        for (const f of data.folders) {
          const matches = data.threads.filter((t) => {
            const hasL = (name: string) => t.labelIds?.some((l) => norm(l) === name.toLowerCase());

            if (f.id === 'inbox') {
              return t.folderId === 'inbox' || (hasL('inbox') && t.folderId !== 'sent' && t.folderId !== 'outbox' && t.folderId !== 'trash' && t.folderId !== 'drafts');
            }
            if (f.id === 'sent') {
              return t.folderId === 'sent' || (hasL('sent') && t.folderId !== 'trash' && t.folderId !== 'outbox');
            }
            if (f.id === 'outbox') {
              return t.folderId === 'outbox' || hasL('outbox');
            }
            if (f.id === 'drafts') {
              return t.folderId === 'drafts' || hasL('draft') || hasL('drafts');
            }
            if (f.id === 'trash') {
              return t.folderId === 'trash' || hasL('trash') || hasL('bin');
            }
            if (f.id === 'junk') {
              return t.folderId === 'junk' || hasL('spam') || hasL('junk');
            }
            if (f.id === 'archive') {
              return t.folderId === 'archive' || (hasL('archive') && t.folderId !== 'sent' && t.folderId !== 'trash');
            }
            return t.folderId === f.id || hasL(f.id) || (f.name && hasL(f.name));
          });

          const unread = matches.filter((t) => !t.isRead).length;
          const total = matches.length;
          if (f.unreadCount !== unread || f.totalCount !== total) {
            f.unreadCount = unread;
            f.totalCount = total;
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
