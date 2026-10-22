# Authentication Setup Guide

This guide details step-by-step instructions for configuring production authentication in **Custom Mail Linux**:
1. **Google Workspace & Gmail** (OAuth 2.0 with PKCE for Desktop)
2. **Microsoft 365 & Exchange** (Azure Entra ID OAuth 2.0)
3. **Custom Mail Domain** (IMAP / SMTP with Linux `safeStorage` encryption)
4. **Environment Configuration & Local Testing**

---

## 1. Google Workspace & Gmail Setup

To enable real Google sign-in using OAuth 2.0 PKCE:

### Step 1.1: Create or Select a Project in Google Cloud Console
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **New Project**.
3. Name it (e.g., `Custom Mail Linux`) and click **Create**.

### Step 1.2: Configure the OAuth Consent Screen
1. In the left navigation, go to **APIs & Services** > **OAuth consent screen**.
2. Select the User Type:
   - **Internal**: If only users within your Google Workspace organization will sign in.
   - **External**: If you want to allow personal `@gmail.com` accounts or arbitrary external domains (requires adding Test Users while in "Testing" mode).
3. Fill in required App Information:
   - **App name**: `Custom Mail Linux`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `https://mail.google.com/` (full Gmail access for IMAP/SMTP/API sync)
6. Click **Save and Continue**.
7. If the publishing status is "Testing", add your personal test email addresses under **Test users**.

### Step 1.3: Generate Desktop OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. In the **Application type** dropdown, select **Desktop app**.
   *(Note: If you select "Web application" instead, you must add `http://127.0.0.1:8989/oauth2callback` and `http://localhost:8989/oauth2callback` under **Authorized redirect URIs**).*
4. Set the name to `Custom Mail Linux Desktop`.
5. Click **Create**.
6. Copy both your **Client ID** and **Client Secret** displayed in the confirmation dialog.

---

## 2. Microsoft 365 & Exchange (Azure Entra ID) Setup

To enable Microsoft 365 corporate and personal Outlook authentication:

### Step 2.1: Register App in Microsoft Entra Admin Center
1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com/) or the [Azure Portal App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Click **+ New registration**.
3. Configure the registration:
   - **Name**: `Custom Mail Linux`
   - **Supported account types**: Select:
     `Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)`
   - **Redirect URI**:
     - Platform dropdown: select **Public client/native (mobile & desktop)**.
     - Enter redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
4. Click **Register**.

### Step 2.2: Note the Application (Client) ID
1. On the app **Overview** page, copy the **Application (client) ID** (a UUID like `12345678-abcd-1234-abcd-1234567890ab`).

### Step 2.3: Configure API Permissions
1. In the left sidebar, navigate to **API permissions**.
2. Click **+ Add a permission** > **Microsoft Graph** > **Delegated permissions**.
3. Select and add the following permissions:
   - `Mail.ReadWrite` (read, update, create messages)
   - `Mail.Send` (send mail on behalf of the user)
   - `offline_access` (receive refresh tokens for persistent login)
   - `email`
   - `profile`
   - `User.Read`
4. Click **Add permissions**.

---

## 3. Custom Mail Domain (IMAP / SMTP) Setup

No third-party cloud console is required. The app includes an auto-detection engine with Linux-native secret security.

### How It Works:
- **Port Autodetection**: When entering any company or private domain (e.g. `company.org`), the app auto-populates standard IMAP SSL (`993`) and SMTP TLS (`587`) hostnames.
- **Provider Presets**: Fastmail, Zoho, ProtonMail Bridge, Yandex, iCloud, and standard cPanel/Plesk domains are recognized immediately.
- **Security & Secret Storage**:
  - Passwords are never saved in plaintext.
  - Passwords are encrypted via Electron's `safeStorage` API, which binds directly to Linux desktop keyrings:
    - **GNOME Keyring** (GNOME / Ubuntu / Fedora)
    - **KWallet** (KDE Plasma)
    - **FreeDesktop Secret Service API** via `libsecret`

### App Passwords Requirement:
If your email provider enforces 2-Factor Authentication (2FA) (e.g. Google Workspace or Yahoo configured manually via IMAP), generate an **App Password** from your provider's security portal and enter it in the password field instead of your main account password.

---

## 4. Environment Configuration

### Step 4.1: Create `.env` in the Project Root
Create a file named `.env` in `/home/touhidur/Code/custom-mail-linux/.env`:

```bash
# Google Cloud Desktop Client ID and Secret
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# Microsoft 365 / Entra ID Application (Client) ID
MICROSOFT_CLIENT_ID="YOUR_MICROSOFT_CLIENT_ID_UUID"
```

### Step 4.2: Development Mocking & Fallbacks
If either `GOOGLE_CLIENT_ID` or `MICROSOFT_CLIENT_ID` is left empty or omitted:
- The app automatically creates a local demo account with realistic executive profiles and folder trees.
- No network requests fail, allowing full UI, navigation, and message composition testing without cloud credentials.

---

## 5. Rebuilding and Running the Application

After updating `.env`:

```bash
# 1. Re-bundle main and renderer
npm run build:main
npm run build:renderer

# 2. Launch the desktop application
./run.sh --electron
```

### Verification Checklist:
- [ ] Clicking **Google Workspace** opens the Google sign-in window (or loads the instant demo account if `GOOGLE_CLIENT_ID` is unset).
- [ ] Clicking **Microsoft 365** opens Microsoft Entra login (or instant demo account).
- [ ] Clicking **Custom Mail Domain** displays server host fields pre-filled based on the entered domain.
- [ ] Submitting the modal adds the account to the left-hand [AccountSwitcher](file:///home/touhidur/Code/custom-mail-linux/src/components/account/AccountSwitcher/AccountSwitcher.tsx) and stores it in encrypted persistent storage (`~/.config/custom-mail-linux/store/accounts.json`).
