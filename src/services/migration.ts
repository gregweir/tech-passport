import { SCHEMA_VERSION, DEFAULT_ME, EXPORT_REMINDER_TITLE } from '../constants';
import type { AppBackup, ReviewItem } from '../types';

export interface MigrationResult {
  success: boolean;
  data?: AppBackup;
  error?: string;
}

function canonicalizeVisibility(value: string): string {
  return value === 'do-not-export' ? 'backup-only' : value;
}

function migrateReviewItem(item: ReviewItem): ReviewItem {
  const source: ReviewItem['source'] =
    item.source ?? (item.linkedEntityIds.length === 0 && item.title === EXPORT_REMINDER_TITLE ? 'app' : 'user');
  return { ...item, source };
}

export function migrateBackup(backup: AppBackup): MigrationResult {
  try {
    let current: AppBackup = {
      ...backup,
      people: backup.people.map(p => ({ ...p, visibility: canonicalizeVisibility(p.visibility) as typeof p.visibility })),
      devices: backup.devices.map(d => ({ ...d, visibility: canonicalizeVisibility(d.visibility) as typeof d.visibility })),
      accounts: backup.accounts.map(a => ({ ...a, visibility: canonicalizeVisibility(a.visibility) as typeof a.visibility })),
      backups: backup.backups.map(b => ({ ...b, visibility: canonicalizeVisibility(b.visibility) as typeof b.visibility })),
      recoveryReferences: backup.recoveryReferences.map(r => ({ ...r, visibility: canonicalizeVisibility(r.visibility) as typeof r.visibility })),
      reviewItems: backup.reviewItems.map(migrateReviewItem),
    };

    if (current.schemaVersion < 1) {
      return { success: false, error: 'Schema version too old to migrate.' };
    }

    if (!Array.isArray(current.people) || current.people.length === 0) {
      current = { ...current, people: [DEFAULT_ME] };
    }

    if (current.schemaVersion < SCHEMA_VERSION) {
      current = { ...current, schemaVersion: SCHEMA_VERSION };
    }

    return { success: true, data: current };
  } catch (err) {
    return { success: false, error: `Migration failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
