import { SCHEMA_VERSION } from '../constants';
import { migrateBackup } from './migration';
import { validateBackup, validateImportSize } from '../utils/validateBackup';
import type { AppBackup } from '../types';

export interface ImportResult {
  success: boolean;
  data?: AppBackup;
  error?: string;
}

export function parseImport(json: string): ImportResult {
  const sizeCheck = validateImportSize(json);
  if (!sizeCheck.success) {
    return { success: false, error: sizeCheck.error };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, error: 'The file is not valid JSON.' };
  }

  const validation = validateBackup(parsed);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  if (validation.backup!.schemaVersion > SCHEMA_VERSION) {
    return { success: false, error: 'This backup was created by a newer version of Tech Passport.' };
  }

  const migrated = migrateBackup(validation.backup!);
  if (!migrated.success) {
    return { success: false, error: migrated.error };
  }

  return { success: true, data: migrated.data };
}
