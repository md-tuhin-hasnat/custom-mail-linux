/**
 * main.ts
 * Main process entry point for Aura Mail Linux Electron Application.
 * Handles environment configuration, default account initialization, frameless BrowserWindow lifecycle,
 * background idle IMAP listeners, and delegates domain operations to modular IPC handlers.
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { getInitialData } from '../data/mockData';
import { AccountConfig } from '../types/account';
import { syncGmailAccountImap } from './services/gmailImapSync';
import { startGmailIdleWatcher, stopGmailIdleWatcher } from './services/gmailIdleWatcher';
import { registerWindowIpc } from './ipc/windowIpc';
import { registerAuthIpc } from './ipc/authIpc';
import { registerMailIpc } from './ipc/mailIpc';
import { registerCleanerIpc } from './ipc/cleanerIpc';
import { registerAttachmentIpc } from './ipc/attachmentIpc';
import { registerProductivityIpc } from './ipc/productivityIpc';

// Load .env in development and packaged runtimes
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(p);
      } else {
        const raw = fs.readFileSync(p, 'utf8');
        raw.split('\n').forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let val = (match[2] || '').trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            process.env[key] = val;
          }
        });
      }
      break;
    } catch {
      // Ignore env parsing error
    }
  }
}

let mainWindow: BrowserWindow | null = null;
const storage = new StorageService();
const auth = new AuthService(storage);

// Seed default demo account if storage is currently empty
function ensureInitialAccount() {
  const accounts = storage.getAccounts();
  const withSeed = process.env.SEED_DATA !== 'false';

  if (accounts.length === 0 && withSeed) {
    const defaultAccount: AccountConfig = {
      id: 'acc-primary-1',
      email: 'touhidur@enterprise.corp',
      name: 'Touhidur Rahman',
      type: 'microsoft',
      avatarColor: '#0a84ff',
      createdAt: new Date().toISOString(),
      isDefault: true,
    };
    storage.saveAccounts([defaultAccount]);
    storage.setActiveAccountId(defaultAccount.id);

    const initialData = getInitialData(true);
    storage.saveAccountData(defaultAccount.id, initialData);
  }
}

function getTargetAccountId(accountId?: string): string {
  if (accountId) return accountId;
  const activeId = storage.getActiveAccountId();
  if (activeId) return activeId;
  const accounts = storage.getAccounts();
  return accounts[0]?.id || 'acc-default';
}

function startRealtimeSync(acc: AccountConfig | null) {
  if (!acc || acc.type !== 'google' || !acc.oauth?.accessToken) {
    stopGmailIdleWatcher();
    return;
  }

  // Initial sync on startup / account switch
  const sendProgress = (p: any) => mainWindow?.webContents.send('mail:sync-progress', p);
  const sendBatch = (threads: any[], folders: any[]) =>
    mainWindow?.webContents.send('mail:threads-updated', { threads, folders });

  syncGmailAccountImap(acc, storage, sendProgress, sendBatch).catch((err) => {
    console.warn('Initial IMAP sync failed:', err);
  });

  // Start background IDLE push notification watcher
  startGmailIdleWatcher(acc, storage, (newThreads, newFolders) => {
    mainWindow?.webContents.send('mail:threads-updated', {
      threads: newThreads,
      folders: newFolders,
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1020,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#161719',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.DEV_SERVER_URL || 'http://localhost:3000';
  const seedParam = process.env.SEED_DATA !== 'false' ? '?seed=true' : '?seed=false';
  mainWindow.loadURL(`${devServerUrl}${seedParam}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-finish-load', () => {
    const activeAcc = storage.getAccounts().find((a) => a.id === storage.getActiveAccountId()) || null;
    startRealtimeSync(activeAcc);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register all modular domain IPC handlers
registerWindowIpc(() => mainWindow);
registerAuthIpc(auth, storage, () => mainWindow, startRealtimeSync);
registerMailIpc(storage, getTargetAccountId, () => mainWindow);
registerCleanerIpc(storage, getTargetAccountId, () => mainWindow);
registerAttachmentIpc(storage, getTargetAccountId, () => mainWindow);
registerProductivityIpc(storage, getTargetAccountId);

// Electron application lifecycle
app.whenReady().then(() => {
  ensureInitialAccount();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopGmailIdleWatcher();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
