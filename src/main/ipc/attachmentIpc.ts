/**
 * attachmentIpc.ts
 * Electron IPC handlers for viewing and downloading email attachments.
 * Handles on-demand fetching of raw attachment base64 payloads and native save-dialog file downloads.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { StorageService } from '../services/storageService';
import { getAttachmentDataUrl, downloadAttachmentWithDialog } from '../services/attachmentService';

export function registerAttachmentIpc(
  storage: StorageService,
  getTargetAccountId: (id?: string) => string,
  getMainWindow: () => BrowserWindow | null
) {
  ipcMain.handle(
    'mail:get-attachment-data',
    async (
      _,
      params: {
        messageId?: string;
        attachmentId: string;
        name: string;
        mimeType: string;
        accountId?: string;
      }
    ) => {
      const id = getTargetAccountId(params.accountId);
      const accounts = storage.getAccounts();
      const acc = accounts.find((a) => a.id === id);
      return getAttachmentDataUrl(
        acc,
        storage,
        params.messageId,
        params.attachmentId,
        params.name,
        params.mimeType
      );
    }
  );

  ipcMain.handle(
    'mail:download-attachment',
    async (
      _,
      params: {
        messageId?: string;
        attachmentId: string;
        name: string;
        mimeType: string;
        accountId?: string;
      }
    ) => {
      const id = getTargetAccountId(params.accountId);
      const accounts = storage.getAccounts();
      const acc = accounts.find((a) => a.id === id);
      return downloadAttachmentWithDialog(getMainWindow(), acc, storage, params);
    }
  );
}
