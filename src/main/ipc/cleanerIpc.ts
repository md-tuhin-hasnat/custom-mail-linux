/**
 * cleanerIpc.ts
 * Electron IPC handlers for the Mailbox Cleaner engine.
 * Provides unique sender extraction, previewing clean criteria impacts,
 * and executing cleaning operations while strictly honoring message lock protections
 * and persisting deleted thread/message IDs to sync tombstones.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { StorageService } from '../services/storageService';
import { MailCleanerCriteria } from '../../types/mail';
import {
  previewCleanMailbox,
  executeCleanMailbox,
  extractUniqueSenderStats,
} from '../services/mailCleanerService';

export function registerCleanerIpc(
  storage: StorageService,
  getTargetAccountId: (id?: string) => string,
  getMainWindow: () => BrowserWindow | null
) {
  ipcMain.handle(
    'mail:get-unique-senders',
    async (_, { accountId }: { accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      return extractUniqueSenderStats(data.threads);
    }
  );

  ipcMain.handle(
    'mail:preview-clean-mailbox',
    async (_, { criteria, accountId }: { criteria: MailCleanerCriteria; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      return previewCleanMailbox(data.threads, criteria);
    }
  );

  ipcMain.handle(
    'mail:clean-mailbox',
    async (_, { criteria, accountId }: { criteria: MailCleanerCriteria; accountId?: string }) => {
      const id = getTargetAccountId(accountId);
      const data = storage.getAccountData(id);
      const result = executeCleanMailbox(data, criteria);
      storage.saveAccountData(id, data);
      getMainWindow()?.webContents.send('mail:threads-updated', {
        threads: data.threads,
        folders: data.folders,
      });
      return result;
    }
  );
}
