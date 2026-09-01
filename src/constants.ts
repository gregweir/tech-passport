import type { Person } from './types';

export const SCHEMA_VERSION = 2;

export const EXPORT_REMINDER_TITLE = 'Export your Passport';

export const DEFAULT_ME: Person = {
  id: 'person-me',
  name: 'Me',
  role: 'me',
  notes: '',
  visibility: 'private',
};

export const VISIBILITIES = ['private', 'helper-safe', 'emergency', 'backup-only', 'do-not-export'] as const;

export const EXPORTABLE_VISIBILITIES = ['private', 'helper-safe', 'emergency'] as const;

export const DEVICE_CATEGORIES = [
  'phone',
  'computer',
  'tablet',
  'router',
  'modem',
  'nas',
  'home-server',
  'smart-home-hub',
  'backup-drive',
  'printer',
  'security-key',
  'other',
] as const;

export const RECOVERY_KINDS = [
  'password-manager',
  'physical-safe',
  'printed-sheet',
  'provider-account',
  'trusted-person',
  'support-contact',
  'other',
] as const;

export const DEPENDENCY_KINDS = ['requires', 'authenticates-with', 'backed-up-to', 'other'] as const;

export const TRI_STATE = ['yes', 'no', 'unknown'] as const;
