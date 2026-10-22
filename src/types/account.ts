export type AccountType = 'google' | 'microsoft' | 'imap';

export interface ManualServerConfig {
  incomingHost: string;
  incomingPort: number;
  incomingTls: boolean;
  outgoingHost: string;
  outgoingPort: number;
  outgoingTls: boolean;
  username: string;
  password?: string;
  encryptedPassword?: string;
}

export interface AccountConfig {
  id: string;
  email: string;
  name: string;
  type: AccountType;
  avatarColor: string;
  createdAt: string;
  isDefault?: boolean;
  oauth?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    scope: string[];
  };
  manualServer?: ManualServerConfig;
}

export interface AuthResult {
  success: boolean;
  account?: AccountConfig;
  error?: string;
}

export interface DomainPreset {
  domain: string;
  incomingHost: string;
  incomingPort: number;
  incomingTls: boolean;
  outgoingHost: string;
  outgoingPort: number;
  outgoingTls: boolean;
}
