/**
 * googleAuth.ts
 * Google Workspace OAuth2 PKCE authentication flow.
 * Spawns an ephemeral local HTTP callback loopback server, requests Google identity and mail scopes,
 * exchanges authorization codes for refresh tokens, and handles automatic token refreshing.
 */

import { BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import http from 'node:http';
import { AccountConfig, AuthResult } from '../../types/account';

const PORT = 8989;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export async function loginWithGoogle(parentWindow: BrowserWindow | null): Promise<AuthResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    return {
      success: false,
      error: 'GOOGLE_CLIENT_ID is not configured in .env. Please see AUTH_SETUP.md.',
    };
  }

  const { verifier, challenge } = generatePKCE();
  const scope = encodeURIComponent('https://mail.google.com/ email profile openid');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=${scope}&code_challenge=${challenge}&code_challenge_method=S256&access_type=offline&prompt=consent`;

  return new Promise((resolve) => {
    let resolved = false;
    let authWindow: BrowserWindow | null = null;
    let server: http.Server | null = null;

    const cleanup = () => {
      resolved = true;
      if (server) {
        try {
          server.close();
        } catch {
          // ignore
        }
        server = null;
      }
      if (authWindow && !authWindow.isDestroyed()) {
        try {
          authWindow.close();
        } catch {
          // ignore
        }
        authWindow = null;
      }
    };

    const handleCode = async (code: string) => {
      if (resolved) return;
      resolved = true;
      try {
        const tokenParams: Record<string, string> = {
          client_id: clientId,
          code,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        };

        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (clientSecret) {
          tokenParams.client_secret = clientSecret;
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(tokenParams),
        });

        const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
        if (tokenData.error) {
          cleanup();
          let errDesc = tokenData.error_description || tokenData.error;
          if (errDesc.includes('client_secret is missing')) {
            errDesc = 'Google requires GOOGLE_CLIENT_SECRET in your .env file for this OAuth credential.';
          }
          resolve({
            success: false,
            error: errDesc,
          });
          return;
        }

        let email = '';
        let name = '';

        if (tokenData.id_token) {
          try {
            const parts = tokenData.id_token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            email = payload.email || '';
            name = payload.name || payload.email?.split('@')[0] || '';
          } catch {
            // fallback to userinfo
          }
        }

        if (!email && tokenData.access_token) {
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const user = (await userRes.json()) as { email?: string; name?: string };
            email = user.email || '';
            name = user.name || email.split('@')[0];
          } catch {
            // ignore
          }
        }

        if (!email) {
          cleanup();
          resolve({ success: false, error: 'Could not retrieve user email from Google.' });
          return;
        }

        const account: AccountConfig = {
          id: `acc-google-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          type: 'google',
          avatarColor: '#ea4335',
          createdAt: new Date().toISOString(),
          oauth: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
            scope: (tokenData.scope || '').split(' '),
          },
        };

        cleanup();
        resolve({ success: true, account });
      } catch (err: unknown) {
        cleanup();
        const msg = err instanceof Error ? err.message : 'Google authentication failed';
        resolve({ success: false, error: msg });
      }
    };

    // 1. Loopback listener for Google OAuth callback
    server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
        if (url.pathname === '/oauth2callback' || url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          const errParam = url.searchParams.get('error');

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication</title></head>
              <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#18181b;color:#f4f4f5;">
                <div style="text-align:center;padding:32px;background:#27272a;border-radius:12px;border:1px solid #3f3f46;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                  <h2 style="color:${code ? '#22c55e' : '#ef4444'};margin-top:0;">
                    ${code ? '✓ Authentication Successful' : 'Authentication Failed'}
                  </h2>
                  <p style="color:#a1a1aa;margin-bottom:0;">
                    ${code ? 'You can close this window now and return to Custom Mail Linux.' : (errParam || 'Error occurred.')}
                  </p>
                </div>
              </body>
            </html>
          `);

          if (code) {
            handleCode(code);
          } else if (errParam) {
            cleanup();
            resolve({ success: false, error: errParam });
          }
        }
      } catch {
        // ignore
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      authWindow = new BrowserWindow({
        width: 540,
        height: 700,
        parent: parentWindow || undefined,
        modal: true,
        title: 'Sign in with Google - Custom Mail Linux',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Also listen on electron webContents for navigation/redirect
      const checkUrl = (url: string) => {
        if (url.startsWith(REDIRECT_URI) || url.includes('/oauth2callback?code=')) {
          const parsed = new URL(url);
          const code = parsed.searchParams.get('code');
          if (code) handleCode(code);
        }
      };

      authWindow.webContents.on('will-navigate', (_, url) => checkUrl(url));
      authWindow.webContents.on('will-redirect', (_, url) => checkUrl(url));

      authWindow.on('closed', () => {
        if (!resolved) {
          cleanup();
          resolve({ success: false, error: 'Google sign-in was canceled.' });
        }
      });

      authWindow.loadURL(authUrl).catch((err) => {
        cleanup();
        resolve({ success: false, error: `Failed to open Google sign-in: ${err.message}` });
      });
    });

    server.on('error', (err) => {
      cleanup();
      resolve({ success: false, error: `Loopback server error: ${err.message}` });
    });
  });
}

export async function refreshGoogleToken(
  account: AccountConfig,
  saveUpdatedAccount?: (acc: AccountConfig) => void
): Promise<string | null> {
  if (!account.oauth?.refreshToken) return account.oauth?.accessToken || null;

  if (account.oauth.expiresAt && account.oauth.expiresAt > Date.now() + 5 * 60 * 1000) {
    return account.oauth.accessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId) return account.oauth.accessToken;

  try {
    const params: Record<string, string> = {
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: account.oauth.refreshToken,
    };
    if (clientSecret) params.client_secret = clientSecret;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });

    const data = (await res.json()) as GoogleTokenResponse;
    if (data.access_token) {
      account.oauth.accessToken = data.access_token;
      account.oauth.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      saveUpdatedAccount?.(account);
      return data.access_token;
    }
  } catch (err) {
    console.warn('Failed to refresh Google token:', err);
  }

  return account.oauth?.accessToken || null;
}
