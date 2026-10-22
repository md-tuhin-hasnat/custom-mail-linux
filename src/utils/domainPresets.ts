import { DomainPreset } from '../types/account';

export const knownPresets: Record<string, Partial<DomainPreset>> = {
  'gmail.com': {
    incomingHost: 'imap.gmail.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.gmail.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
  'googlemail.com': {
    incomingHost: 'imap.gmail.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.gmail.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
  'outlook.com': {
    incomingHost: 'outlook.office365.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.office365.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
  'hotmail.com': {
    incomingHost: 'outlook.office365.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.office365.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
  'yahoo.com': {
    incomingHost: 'imap.mail.yahoo.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.mail.yahoo.com',
    outgoingPort: 465,
    outgoingTls: true,
  },
  'zoho.com': {
    incomingHost: 'imappro.zoho.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtppro.zoho.com',
    outgoingPort: 465,
    outgoingTls: true,
  },
  'fastmail.com': {
    incomingHost: 'imap.fastmail.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.fastmail.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
  'icloud.com': {
    incomingHost: 'imap.mail.me.com',
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: 'smtp.mail.me.com',
    outgoingPort: 587,
    outgoingTls: true,
  },
};

export function autoDetectMailDomain(email: string): {
  incomingHost: string;
  incomingPort: number;
  incomingTls: boolean;
  outgoingHost: string;
  outgoingPort: number;
  outgoingTls: boolean;
} {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return {
      incomingHost: 'imap.example.com',
      incomingPort: 993,
      incomingTls: true,
      outgoingHost: 'smtp.example.com',
      outgoingPort: 587,
      outgoingTls: true,
    };
  }

  const domain = email.slice(atIndex + 1).toLowerCase();
  const matched = knownPresets[domain];
  if (matched) {
    return {
      incomingHost: matched.incomingHost || `imap.${domain}`,
      incomingPort: matched.incomingPort ?? 993,
      incomingTls: matched.incomingTls ?? true,
      outgoingHost: matched.outgoingHost || `smtp.${domain}`,
      outgoingPort: matched.outgoingPort ?? 587,
      outgoingTls: matched.outgoingTls ?? true,
    };
  }

  // Automatic corporate heuristic for custom enterprise domains
  return {
    incomingHost: `imap.${domain}`,
    incomingPort: 993,
    incomingTls: true,
    outgoingHost: `smtp.${domain}`,
    outgoingPort: 587,
    outgoingTls: true,
  };
}
