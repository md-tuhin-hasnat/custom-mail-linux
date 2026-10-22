/**
 * microsoftAuth.ts
 * Microsoft 365 / Outlook OAuth2 PKCE authentication flow.
 * Opens an in-app OAuth modal window, listens for navigation to the Microsoft native client redirect URI,
 * and exchanges the returned authorization code for access and refresh tokens.
 */

import { BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import { AccountConfig, AuthResult } from '../../types/account';

const REDIRECT_URI = 'https://login.microsoftonline.com/common/oauth2/nativeclient';

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export async function loginWithMicrosoft(parentWindow: BrowserWindow | null): Promise<AuthResult> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId || clientId === 'YOUR_MICROSOFT_CLIENT_ID_UUID') {
    return {
      success: false,
      error: 'MICROSOFT_CLIENT_ID is not configured in .env. Please see AUTH_SETUP.md.',
    };
  }

  const { verifier, challenge } = generatePKCE();
  const scope = encodeURIComponent('https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access email profile User.Read');
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
    clientId
  )}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=${scope}&code_challenge=${challenge}&code_challenge_method=S256`;

  return new Promise((resolve) => {
    let resolved = false;

    const authWindow = new BrowserWindow({
      width: 520,
      height: 700,
      parent: parentWindow || undefined,
      modal: true,
      title: 'Sign in with Microsoft 365 - Custom Mail Linux',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const handleCode = async (code: string) => {
      if (resolved) return;
      resolved = true;
      if (!authWindow.isDestroyed()) authWindow.close();

      try {
        const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
          }),
        });

        const tokenData = (await tokenRes.json()) as MicrosoftTokenResponse;
        if (tokenData.error) {
          resolve({
            success: false,
            error: tokenData.error_description || tokenData.error,
          });
          return;
        }

        let email = '';
        let name = '';

        if (tokenData.id_token) {
          try {
            const parts = tokenData.id_token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            email = payload.preferred_username || payload.email || '';
            name = payload.name || email.split('@')[0];
          } catch {
            // fallback
          }
        }

        if (!email && tokenData.access_token) {
          try {
            const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const me = (await meRes.json()) as { mail?: string; userPrincipalName?: string; displayName?: string };
            email = me.mail || me.userPrincipalName || '';
            name = me.displayName || email.split('@')[0];
          } catch {
            // ignore
          }
        }

        if (!email) {
          resolve({ success: false, error: 'Could not retrieve email from Microsoft account.' });
          return;
        }

        const account: AccountConfig = {
          id: `acc-ms-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          type: 'microsoft',
          avatarColor: '#0078d4',
          createdAt: new Date().toISOString(),
          oauth: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
            scope: (tokenData.scope || '').split(' '),
          },
        };

        resolve({ success: true, account });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Microsoft authentication failed';
        resolve({ success: false, error: msg });
      }
    };

    const checkUrl = (url: string) => {
      if (url.startsWith(REDIRECT_URI)) {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        const errParam = parsed.searchParams.get('error');

        if (code) {
          handleCode(code);
        } else if (errParam) {
          resolved = true;
          if (!authWindow.isDestroyed()) authWindow.close();
          resolve({ success: false, error: parsed.searchParams.get('error_description') || errParam });
        }
      }
    };

    authWindow.webContents.on('will-navigate', (_, url) => checkUrl(url));
    authWindow.webContents.on('will-redirect', (_, url) => checkUrl(url));

    authWindow.on('closed', () => {
      if (!resolved) {
        resolve({ success: false, error: 'Microsoft sign-in was canceled.' });
      }
    });

    authWindow.loadURL(authUrl).catch((err) => {
      if (!resolved) {
        resolve({ success: false, error: `Failed to open Microsoft sign-in: ${err.message}` });
      }
    });
  });
}
