/**
 * gmailIdleWatcher.ts
 * Background IMAP IDLE push notification client for instant incoming mail updates.
 * Keeps an open TLS connection to imap.gmail.com with periodic NOOP keepalives,
 * listens for EXISTS / FETCH responses, and triggers live updates into local storage.
 */

import tls from 'node:tls';
import { AccountConfig } from '../../types/account';
import { StorageService } from './storageService';
import { MailFolder, MailThread, MailMessage } from '../../types/mail';
import { groupMessagesIntoThreads } from './gmailParser';
import { parseImapEnvelopeLine, envelopeToMailMessage } from './imapParser';
import { updateFolderCounts } from './gmailImapSync';
import { refreshGoogleToken } from './googleAuth';

export type RealtimeUpdateCallback = (
  threads: MailThread[],
  folders: MailFolder[],
  incomingMessages?: MailMessage[]
) => void;

let activeSocket: tls.TLSSocket | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;
let isStopping = false;

export function stopGmailIdleWatcher(): void {
  isStopping = true;
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (activeSocket) {
    try {
      activeSocket.write('DONE\r\n');
      activeSocket.end();
    } catch {}
    activeSocket = null;
  }
}

export function startGmailIdleWatcher(
  account: AccountConfig,
  storage: StorageService,
  onUpdate: RealtimeUpdateCallback
): () => void {
  stopGmailIdleWatcher();
  isStopping = false;

  if (account.type !== 'google' || !account.oauth?.accessToken) {
    return () => {};
  }

  let token = account.oauth.accessToken;
  const email = account.email;
  let buffer = '';
  let seq = 100;
  let isIdling = false;
  let currentExists = 0;
  let currentIdleTag = '';

  function sendCmd(cmd: string): Promise<string> {
    return new Promise((resolve) => {
      if (!activeSocket) return resolve('');
      const tag = `I${seq++}`;
      const onData = (chunk: string) => {
        buffer += chunk;
        if (buffer.includes(`${tag} OK`) || buffer.includes(`${tag} NO`) || buffer.includes(`${tag} BAD`)) {
          activeSocket?.removeListener('data', onData);
          const res = buffer;
          buffer = '';
          resolve(res);
        }
      };
      activeSocket.on('data', onData);
      activeSocket.write(`${tag} ${cmd}\r\n`);
    });
  }

  async function enterIdle() {
    if (!activeSocket || isStopping) return;
    try {
      isIdling = false;
      currentIdleTag = `I${seq++}`;
      activeSocket.write(`${currentIdleTag} IDLE\r\n`);
    } catch {}
  }

  async function exitIdle(): Promise<void> {
    if (!activeSocket || !isIdling) return;
    isIdling = false;
    return new Promise((resolve) => {
      const tag = currentIdleTag;
      const onDoneData = (chunk: string) => {
        if (chunk.includes(`${tag} OK`) || chunk.includes('OK IDLE')) {
          activeSocket?.removeListener('data', onDoneData);
          resolve();
        }
      };
      activeSocket?.on('data', onDoneData);
      try {
        activeSocket?.write('DONE\r\n');
      } catch {}
      // Safety timeout after 1.2s
      setTimeout(() => {
        activeSocket?.removeListener('data', onDoneData);
        resolve();
      }, 1200);
    });
  }

  async function handleNewMessages(newCount: number) {
    if (!activeSocket || newCount <= currentExists || isStopping) return;
    const start = currentExists + 1;
    const end = newCount;
    currentExists = newCount;

    try {
      await exitIdle();

      const fetchRes = await sendCmd(
        `FETCH ${start}:${end} (UID FLAGS INTERNALDATE X-GM-THRID X-GM-LABELS ENVELOPE)`
      );

      const lines = fetchRes.split('\r\n').filter((l) => l.startsWith('* '));
      const newMsgs = lines
        .map(parseImapEnvelopeLine)
        .filter(Boolean)
        .map((env) => envelopeToMailMessage(env!));

      if (newMsgs.length > 0) {
        const data = storage.getAccountData(account.id);
        data.threads = groupMessagesIntoThreads(
          newMsgs,
          data.threads,
          data.deletedThreadIds,
          data.deletedMessageIds
        );
        updateFolderCounts(data);
        storage.saveAccountData(account.id, data);

        const incomingMsgs = newMsgs.filter(
          (m) => m.senderEmail?.toLowerCase() !== email.toLowerCase()
        );
        onUpdate(data.threads, data.folders, incomingMsgs);
      }

      await enterIdle();
    } catch (err) {
      console.warn('Error fetching new incoming message:', err);
      await enterIdle();
    }
  }

  async function connect() {
    if (isStopping) return;

    // Refresh token before connecting if refresh token is available
    if (account.oauth?.refreshToken) {
      const refreshed = await refreshGoogleToken(account, (updatedAcc) => {
        const all = storage.getAccounts();
        storage.saveAccounts(all.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
      });
      if (refreshed) token = refreshed;
    }

    const socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false });
    activeSocket = socket;
    socket.setEncoding('utf8');

    socket.once('data', async () => {
      try {
        const authStr = `user=${email}\x01auth=Bearer ${token}\x01\x01`;
        const authB64 = Buffer.from(authStr).toString('base64');
        const authRes = await sendCmd(`AUTHENTICATE XOAUTH2 ${authB64}`);
        if (!authRes.includes('Success') && !authRes.includes('OK')) {
          socket.end();
          return;
        }

        const selRes = await sendCmd('SELECT INBOX');
        const match = selRes.match(/\*\s+(\d+)\s+EXISTS/);
        currentExists = match ? parseInt(match[1], 10) : 0;

        await enterIdle();

        // Heartbeat every 15 minutes to keep IDLE alive per RFC 2177
        keepAliveTimer = setInterval(() => {
          if (activeSocket && isIdling) {
            activeSocket.write('DONE\r\n');
            setTimeout(() => enterIdle(), 200);
          }
        }, 15 * 60 * 1000);
      } catch (e) {
        console.warn('IDLE setup failed:', e);
      }
    });

    socket.on('data', (chunk: string) => {
      if (chunk.includes('+ idling')) {
        isIdling = true;
      } else if (isIdling && chunk.includes('EXISTS')) {
        const existsMatch = chunk.match(/\*\s+(\d+)\s+EXISTS/);
        if (existsMatch) {
          const newTotal = parseInt(existsMatch[1], 10);
          if (newTotal > currentExists) {
            handleNewMessages(newTotal);
          }
        }
      }
    });

    socket.on('error', () => {});
    socket.on('close', () => {
      isIdling = false;
      if (!isStopping) {
        setTimeout(() => connect(), 10000);
      }
    });
  }

  connect();
  return stopGmailIdleWatcher;
}
