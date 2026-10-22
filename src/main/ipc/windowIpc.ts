/**
 * windowIpc.ts
 * Electron IPC handlers for frameless window controls and system integrations.
 * Provides minimize, maximize/unmaximize, close, and external URL dispatching via shell.
 */

import { ipcMain, shell, BrowserWindow } from 'electron';

export function registerWindowIpc(getMainWindow: () => BrowserWindow | null) {
  ipcMain.on('window:minimize', () => {
    getMainWindow()?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    getMainWindow()?.close();
  });

  ipcMain.handle('window:open-external', async (_, url: string) => {
    if (
      typeof url === 'string' &&
      (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))
    ) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });
}
