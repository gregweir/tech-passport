import {
  DEVICE_CATEGORIES,
  RECOVERY_KINDS,
  DEPENDENCY_KINDS,
  TRI_STATE,
  VISIBILITIES,
  SCHEMA_VERSION,
} from '../constants';
import type {
  AppBackup,
  Person,
  Device,
  Account,
  Backup,
  RecoveryReference,
  Dependency,
  ReviewItem,
} from '../types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_RECORDS_PER_TYPE = 1000;
const MAX_STRING_LENGTH = 5000;
const ID_MAX_LENGTH = 128;
const MAX_RECURRENCE_DAYS = 3650;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

export interface ValidationResult {
  success: boolean;
  error?: string;
  backup?: AppBackup;
}

export function validateImportSize(json: string): ValidationResult {
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > MAX_FILE_BYTES) {
    return { success: false, error: `Backup file is too large (max ${MAX_FILE_BYTES} bytes).` };
  }
  return { success: true };
}

export function validateBackup(backup: unknown): ValidationResult {
  if (typeof backup !== 'object' || backup === null || Array.isArray(backup)) {
    return { success: false, error: 'Backup must be a plain object.' };
  }

  const b = backup as Record<string, unknown>;

  if (typeof b.schemaVersion !== 'number' || !Number.isInteger(b.schemaVersion) || b.schemaVersion < 1) {
    return { success: false, error: 'Missing or invalid schema version.' };
  }

  if (b.schemaVersion > SCHEMA_VERSION) {
    return { success: false, error: 'This backup was created by a newer version of Tech Passport.' };
  }

  const schemaVersion = b.schemaVersion;

  const exportedAt = validateTimestamp(b.exportedAt, 'exportedAt', schemaVersion >= SCHEMA_VERSION);
  if (!exportedAt.success) return exportedAt;

  const lastExportAt = validateTimestamp(b.lastExportAt, 'lastExportAt', false);
  if (!lastExportAt.success) return lastExportAt;

  if (typeof b.onboardingComplete !== 'boolean') {
    return { success: false, error: 'onboardingComplete must be a boolean.' };
  }

  const people = readEntities(b.people, 'people', validatePerson);
  if (!people.success) return people;

  const devices = readEntities(b.devices, 'devices', validateDevice);
  if (!devices.success) return devices;

  const accounts = readEntities(b.accounts, 'accounts', validateAccount);
  if (!accounts.success) return accounts;

  const backups = readEntities(b.backups, 'backups', validateBackupEntity);
  if (!backups.success) return backups;

  const recoveryReferences = readEntities(b.recoveryReferences, 'recoveryReferences', validateRecoveryReference);
  if (!recoveryReferences.success) return recoveryReferences;

  const dependencies = readEntities(b.dependencies, 'dependencies', validateDependency);
  if (!dependencies.success) return dependencies;

  const reviewItems = readEntities(
    b.reviewItems,
    'reviewItems',
    (value, index) => validateReviewItem(value, index, schemaVersion),
  );
  if (!reviewItems.success) return reviewItems;

  const duplicateError = checkDuplicateIdsAcrossTypes(
    people.data,
    devices.data,
    accounts.data,
    backups.data,
    recoveryReferences.data,
    dependencies.data,
    reviewItems.data,
  );
  if (duplicateError) {
    return { success: false, error: duplicateError };
  }

  const refError = checkRelationships(
    people.data,
    devices.data,
    accounts.data,
    backups.data,
    recoveryReferences.data,
    dependencies.data,
    reviewItems.data,
  );
  if (refError) {
    return { success: false, error: refError };
  }

  return {
    success: true,
    backup: {
      schemaVersion: b.schemaVersion,
      exportedAt: exportedAt.data || new Date().toISOString(),
      people: people.data,
      devices: devices.data,
      accounts: accounts.data,
      backups: backups.data,
      recoveryReferences: recoveryReferences.data,
      dependencies: dependencies.data,
      reviewItems: reviewItems.data,
      onboardingComplete: b.onboardingComplete,
      lastExportAt: lastExportAt.data,
    },
  };
}

function readEntities<T>(
  value: unknown,
  name: string,
  validate: (item: unknown, index: number) => { success: false; error: string } | { success: true; data: T },
): { success: false; error: string } | { success: true; data: T[] } {
  if (!Array.isArray(value)) {
    return { success: false, error: `${name} must be an array.` };
  }
  if (value.length > MAX_RECORDS_PER_TYPE) {
    return { success: false, error: `${name} exceeds ${MAX_RECORDS_PER_TYPE} records.` };
  }
  const data: T[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < value.length; i++) {
    const result = validate(value[i], i);
    if (!result.success) return result;
    const id = (result.data as { id: string }).id;
    if (seenIds.has(id)) {
      return { success: false, error: `${name}[${i}] has a duplicate id.` };
    }
    seenIds.add(id);
    data.push(result.data);
  }
  return { success: true, data };
}

function validateString(
  value: unknown,
  field: string,
  required = false,
): { success: false; error: string } | { success: true; data: string } {
  if (typeof value !== 'string') {
    return { success: false, error: `${field} must be a string.` };
  }
  if (required && value.trim() === '') {
    return { success: false, error: `${field} cannot be empty.` };
  }
  if (value.length > MAX_STRING_LENGTH) {
    return { success: false, error: `${field} exceeds ${MAX_STRING_LENGTH} characters.` };
  }
  return { success: true, data: value };
}

function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  required = true,
): { success: false; error: string } | { success: true; data: T } {
  if (value === undefined || value === null) {
    if (required) return { success: false, error: `${field} is required.` };
    return { success: true, data: allowed[0] as T };
  }
  if (typeof value !== 'string') {
    return { success: false, error: `${field} must be a string.` };
  }
  if (!allowed.includes(value as T)) {
    return { success: false, error: `${field} must be one of ${allowed.join(', ')}.` };
  }
  return { success: true, data: value as T };
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const parts = value.split('-').map(Number);
  return (
    date.getUTCFullYear() === parts[0] &&
    date.getUTCMonth() === parts[1] - 1 &&
    date.getUTCDate() === parts[2]
  );
}

function validateDate(value: unknown, field: string): { success: false; error: string } | { success: true; data: string } {
  const str = typeof value === 'string' ? value : '';
  if (typeof value !== 'string') {
    return { success: false, error: `${field} must be a string.` };
  }
  if (str && !isValidIsoDate(str)) {
    return { success: false, error: `${field} must be a valid ISO date (YYYY-MM-DD) or empty.` };
  }
  return { success: true, data: str };
}

function isValidIsoTimestamp(value: string): boolean {
  if (!ISO_DATETIME_RE.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const year = parsed.getUTCFullYear();
  return year >= 2000 && year <= 2100;
}

function validateTimestamp(
  value: unknown,
  field: string,
  required: boolean,
): { success: false; error: string } | { success: true; data: string } {
  if (value === undefined || value === null || value === '') {
    if (required) return { success: false, error: `${field} must be a valid ISO timestamp.` };
    return { success: true, data: '' };
  }
  if (typeof value !== 'string' || !isValidIsoTimestamp(value)) {
    return { success: false, error: `${field} is not a valid ISO timestamp.` };
  }
  return { success: true, data: value };
}

function validateId(value: unknown, field: string): { success: false; error: string } | { success: true; data: string } {
  const str = typeof value === 'string' ? value : '';
  if (typeof value !== 'string' || str === '' || str.length > ID_MAX_LENGTH) {
    return { success: false, error: `${field} must be a non-empty id string.` };
  }
  return { success: true, data: value };
}

function validateIdArray(value: unknown, field: string): { success: false; error: string } | { success: true; data: string[] } {
  if (!Array.isArray(value)) {
    return { success: false, error: `${field} must be an array of ids.` };
  }
  const ids: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const idResult = validateId(value[i], `${field}[${i}]`);
    if (!idResult.success) return idResult;
    ids.push(idResult.data);
  }
  return { success: true, data: ids };
}

function validatePerson(value: unknown, index: number): { success: false; error: string } | { success: true; data: Person } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `people[${index}] must be an object.` };
  }
  const p = value as Record<string, unknown>;
  const id = validateId(p.id, `people[${index}].id`);
  if (!id.success) return id;
  const name = validateString(p.name, `people[${index}].name`, true);
  if (!name.success) return name;
  const role = validateEnum(p.role, `people[${index}].role`, ['me', 'partner', 'parent', 'child', 'trusted-helper', 'other']);
  if (!role.success) return role;
  const notes = validateString(p.notes ?? '', `people[${index}].notes`);
  if (!notes.success) return notes;
  const visibility = validateEnum(p.visibility, `people[${index}].visibility`, VISIBILITIES);
  if (!visibility.success) return visibility;

  return { success: true, data: { id: id.data, name: name.data, role: role.data, notes: notes.data, visibility: visibility.data } };
}

function validateDevice(value: unknown, index: number): { success: false; error: string } | { success: true; data: Device } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `devices[${index}] must be an object.` };
  }
  const d = value as Record<string, unknown>;
  const id = validateId(d.id, `devices[${index}].id`);
  if (!id.success) return id;
  const label = validateString(d.label, `devices[${index}].label`, true);
  if (!label.success) return label;
  const role = validateString(d.role, `devices[${index}].role`, true);
  if (!role.success) return role;
  const category = validateEnum(d.category, `devices[${index}].category`, DEVICE_CATEGORIES);
  if (!category.success) return category;
  const ownerIds = validateIdArray(d.ownerIds ?? [], `devices[${index}].ownerIds`);
  if (!ownerIds.success) return ownerIds;
  const model = validateString(d.model ?? '', `devices[${index}].model`);
  if (!model.success) return model;
  const os = validateString(d.os ?? '', `devices[${index}].os`);
  if (!os.success) return os;
  const serialNumber = validateString(d.serialNumber ?? '', `devices[${index}].serialNumber`);
  if (!serialNumber.success) return serialNumber;
  const purchaseDate = validateDate(d.purchaseDate ?? '', `devices[${index}].purchaseDate`);
  if (!purchaseDate.success) return purchaseDate;
  const location = validateString(d.location ?? '', `devices[${index}].location`);
  if (!location.success) return location;
  const encrypted = validateEnum(d.encrypted, `devices[${index}].encrypted`, TRI_STATE, false);
  if (!encrypted.success) return encrypted;
  const recoveryReferenceIds = validateIdArray(d.recoveryReferenceIds ?? [], `devices[${index}].recoveryReferenceIds`);
  if (!recoveryReferenceIds.success) return recoveryReferenceIds;
  const notes = validateString(d.notes ?? '', `devices[${index}].notes`);
  if (!notes.success) return notes;
  const visibility = validateEnum(d.visibility, `devices[${index}].visibility`, VISIBILITIES);
  if (!visibility.success) return visibility;
  const reviewDate = validateDate(d.reviewDate ?? '', `devices[${index}].reviewDate`);
  if (!reviewDate.success) return reviewDate;

  return {
    success: true,
    data: {
      id: id.data,
      label: label.data,
      role: role.data,
      category: category.data,
      ownerIds: ownerIds.data,
      model: model.data,
      os: os.data,
      serialNumber: serialNumber.data,
      purchaseDate: purchaseDate.data,
      location: location.data,
      encrypted: encrypted.data,
      recoveryReferenceIds: recoveryReferenceIds.data,
      notes: notes.data,
      visibility: visibility.data,
      reviewDate: reviewDate.data,
    },
  };
}

function validateAccount(value: unknown, index: number): { success: false; error: string } | { success: true; data: Account } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `accounts[${index}] must be an object.` };
  }
  const a = value as Record<string, unknown>;
  const id = validateId(a.id, `accounts[${index}].id`);
  if (!id.success) return id;
  const label = validateString(a.label, `accounts[${index}].label`, true);
  if (!label.success) return label;
  const provider = validateString(a.provider ?? '', `accounts[${index}].provider`);
  if (!provider.success) return provider;
  const purpose = validateString(a.purpose ?? '', `accounts[${index}].purpose`);
  if (!purpose.success) return purpose;
  const personIds = validateIdArray(a.personIds ?? [], `accounts[${index}].personIds`);
  if (!personIds.success) return personIds;
  const mfa = validateEnum(a.mfa, `accounts[${index}].mfa`, TRI_STATE, false);
  if (!mfa.success) return mfa;
  const recoveryReferenceIds = validateIdArray(a.recoveryReferenceIds ?? [], `accounts[${index}].recoveryReferenceIds`);
  if (!recoveryReferenceIds.success) return recoveryReferenceIds;
  const notes = validateString(a.notes ?? '', `accounts[${index}].notes`);
  if (!notes.success) return notes;
  const visibility = validateEnum(a.visibility, `accounts[${index}].visibility`, VISIBILITIES);
  if (!visibility.success) return visibility;
  const reviewDate = validateDate(a.reviewDate ?? '', `accounts[${index}].reviewDate`);
  if (!reviewDate.success) return reviewDate;

  return {
    success: true,
    data: {
      id: id.data,
      label: label.data,
      provider: provider.data,
      purpose: purpose.data,
      personIds: personIds.data,
      mfa: mfa.data,
      recoveryReferenceIds: recoveryReferenceIds.data,
      notes: notes.data,
      visibility: visibility.data,
      reviewDate: reviewDate.data,
    },
  };
}

function validateBackupEntity(value: unknown, index: number): { success: false; error: string } | { success: true; data: Backup } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `backups[${index}] must be an object.` };
  }
  const b = value as Record<string, unknown>;
  const id = validateId(b.id, `backups[${index}].id`);
  if (!id.success) return id;
  const label = validateString(b.label, `backups[${index}].label`, true);
  if (!label.success) return label;
  const destination = validateString(b.destination ?? '', `backups[${index}].destination`);
  if (!destination.success) return destination;
  const recoveryReferenceIds = validateIdArray(b.recoveryReferenceIds ?? [], `backups[${index}].recoveryReferenceIds`);
  if (!recoveryReferenceIds.success) return recoveryReferenceIds;
  const coversIds = validateIdArray(b.coversIds ?? [], `backups[${index}].coversIds`);
  if (!coversIds.success) return coversIds;
  const copies = validateEnum(b.copies, `backups[${index}].copies`, ['one', 'multiple', 'unknown'], false);
  if (!copies.success) return copies;
  const lastCheckedDate = validateDate(b.lastCheckedDate ?? '', `backups[${index}].lastCheckedDate`);
  if (!lastCheckedDate.success) return lastCheckedDate;
  const restoreTestedDate = validateDate(b.restoreTestedDate ?? '', `backups[${index}].restoreTestedDate`);
  if (!restoreTestedDate.success) return restoreTestedDate;
  const restored = validateEnum(b.restored, `backups[${index}].restored`, TRI_STATE, false);
  if (!restored.success) return restored;
  const canRestorePersonIds = validateIdArray(b.canRestorePersonIds ?? [], `backups[${index}].canRestorePersonIds`);
  if (!canRestorePersonIds.success) return canRestorePersonIds;
  const notes = validateString(b.notes ?? '', `backups[${index}].notes`);
  if (!notes.success) return notes;
  const visibility = validateEnum(b.visibility, `backups[${index}].visibility`, VISIBILITIES);
  if (!visibility.success) return visibility;
  const reviewDate = validateDate(b.reviewDate ?? '', `backups[${index}].reviewDate`);
  if (!reviewDate.success) return reviewDate;

  return {
    success: true,
    data: {
      id: id.data,
      label: label.data,
      destination: destination.data,
      recoveryReferenceIds: recoveryReferenceIds.data,
      coversIds: coversIds.data,
      copies: copies.data,
      lastCheckedDate: lastCheckedDate.data,
      restoreTestedDate: restoreTestedDate.data,
      restored: restored.data,
      canRestorePersonIds: canRestorePersonIds.data,
      notes: notes.data,
      visibility: visibility.data,
      reviewDate: reviewDate.data,
    },
  };
}

function validateRecoveryReference(value: unknown, index: number): { success: false; error: string } | { success: true; data: RecoveryReference } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `recoveryReferences[${index}] must be an object.` };
  }
  const r = value as Record<string, unknown>;
  const id = validateId(r.id, `recoveryReferences[${index}].id`);
  if (!id.success) return id;
  const label = validateString(r.label, `recoveryReferences[${index}].label`, true);
  if (!label.success) return label;
  const kind = validateEnum(r.kind, `recoveryReferences[${index}].kind`, RECOVERY_KINDS);
  if (!kind.success) return kind;
  const location = validateString(r.location ?? '', `recoveryReferences[${index}].location`);
  if (!location.success) return location;
  const contactInfo = validateString(r.contactInfo ?? '', `recoveryReferences[${index}].contactInfo`);
  if (!contactInfo.success) return contactInfo;
  const notes = validateString(r.notes ?? '', `recoveryReferences[${index}].notes`);
  if (!notes.success) return notes;
  const visibility = validateEnum(r.visibility, `recoveryReferences[${index}].visibility`, VISIBILITIES);
  if (!visibility.success) return visibility;

  return {
    success: true,
    data: {
      id: id.data,
      label: label.data,
      kind: kind.data,
      location: location.data,
      contactInfo: contactInfo.data,
      notes: notes.data,
      visibility: visibility.data,
    },
  };
}

function validateDependency(value: unknown, index: number): { success: false; error: string } | { success: true; data: Dependency } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `dependencies[${index}] must be an object.` };
  }
  const d = value as Record<string, unknown>;
  const id = validateId(d.id, `dependencies[${index}].id`);
  if (!id.success) return id;
  const sourceId = validateId(d.sourceId, `dependencies[${index}].sourceId`);
  if (!sourceId.success) return sourceId;
  const targetId = validateId(d.targetId, `dependencies[${index}].targetId`);
  if (!targetId.success) return targetId;
  const kind = validateEnum(d.kind, `dependencies[${index}].kind`, DEPENDENCY_KINDS);
  if (!kind.success) return kind;
  const notes = validateString(d.notes ?? '', `dependencies[${index}].notes`);
  if (!notes.success) return notes;

  return {
    success: true,
    data: {
      id: id.data,
      sourceId: sourceId.data,
      targetId: targetId.data,
      kind: kind.data,
      notes: notes.data,
    },
  };
}

function validateReviewItem(
  value: unknown,
  index: number,
  schemaVersion: number,
): { success: false; error: string } | { success: true; data: ReviewItem } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `reviewItems[${index}] must be an object.` };
  }
  const r = value as Record<string, unknown>;
  const id = validateId(r.id, `reviewItems[${index}].id`);
  if (!id.success) return id;
  const title = validateString(r.title, `reviewItems[${index}].title`, true);
  if (!title.success) return title;

  const recurrenceDays = validateRecurrenceDays(r.recurrenceDays, `reviewItems[${index}].recurrenceDays`);
  if (!recurrenceDays.success) return recurrenceDays;

  const lastReviewedDate = validateDate(r.lastReviewedDate ?? '', `reviewItems[${index}].lastReviewedDate`);
  if (!lastReviewedDate.success) return lastReviewedDate;
  const nextReviewDate = validateDate(r.nextReviewDate ?? '', `reviewItems[${index}].nextReviewDate`);
  if (!nextReviewDate.success) return nextReviewDate;
  const status = validateEnum(r.status, `reviewItems[${index}].status`, ['ok', 'due', 'overdue', 'snoozed'], false);
  if (!status.success) return status;
  const notes = validateString(r.notes ?? '', `reviewItems[${index}].notes`);
  if (!notes.success) return notes;
  const linkedEntityIds = validateIdArray(r.linkedEntityIds ?? [], `reviewItems[${index}].linkedEntityIds`);
  if (!linkedEntityIds.success) return linkedEntityIds;

  const source = validateReviewItemSource(r.source, `reviewItems[${index}].source`, schemaVersion);
  if (!source.success) return source;

  return {
    success: true,
    data: {
      id: id.data,
      title: title.data,
      recurrenceDays: recurrenceDays.data,
      lastReviewedDate: lastReviewedDate.data,
      nextReviewDate: nextReviewDate.data,
      status: status.data,
      notes: notes.data,
      linkedEntityIds: linkedEntityIds.data,
      source: source.data,
    },
  };
}

function validateRecurrenceDays(
  value: unknown,
  field: string,
): { success: false; error: string } | { success: true; data: number | null } {
  if (value === undefined || value === null) {
    return { success: true, data: null };
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { success: false, error: `${field} must be null or a non-negative integer.` };
  }
  if (value < 0 || value > MAX_RECURRENCE_DAYS) {
    return { success: false, error: `${field} must be between 0 and ${MAX_RECURRENCE_DAYS}.` };
  }
  return { success: true, data: value };
}

function validateReviewItemSource(
  value: unknown,
  field: string,
  schemaVersion: number,
): { success: false; error: string } | { success: true; data: ReviewItem['source'] } {
  if (value === undefined || value === null) {
    if (schemaVersion >= SCHEMA_VERSION) {
      return { success: false, error: `${field} is required for schema version ${SCHEMA_VERSION}.` };
    }
    return { success: true, data: 'user' };
  }
  if (value !== 'app' && value !== 'user') {
    return { success: false, error: `${field} must be 'app' or 'user'.` };
  }
  return { success: true, data: value };
}

function checkDuplicateIdsAcrossTypes(
  people: Person[],
  devices: Device[],
  accounts: Account[],
  backups: Backup[],
  recoveryReferences: RecoveryReference[],
  dependencies: Dependency[],
  reviewItems: ReviewItem[],
): string | null {
  const seen = new Map<string, string>();
  const collections: Array<{ name: string; items: { id: string }[] }> = [
    { name: 'people', items: people },
    { name: 'devices', items: devices },
    { name: 'accounts', items: accounts },
    { name: 'backups', items: backups },
    { name: 'recoveryReferences', items: recoveryReferences },
    { name: 'dependencies', items: dependencies },
    { name: 'reviewItems', items: reviewItems },
  ];
  for (const { name, items } of collections) {
    for (const item of items) {
      if (seen.has(item.id)) {
        return `Duplicate id ${item.id} used in ${seen.get(item.id)} and ${name}.`;
      }
      seen.set(item.id, name);
    }
  }
  return null;
}

function checkRelationships(
  people: Person[],
  devices: Device[],
  accounts: Account[],
  backups: Backup[],
  recoveryReferences: RecoveryReference[],
  dependencies: Dependency[],
  reviewItems: ReviewItem[],
): string | null {
  const personIds = new Set(people.map(p => p.id));
  const deviceIds = new Set(devices.map(d => d.id));
  const accountIds = new Set(accounts.map(a => a.id));
  const backupIds = new Set(backups.map(b => b.id));
  const recoveryReferenceIds = new Set(recoveryReferences.map(r => r.id));
  const coveredIds = new Set([...deviceIds, ...accountIds]);
  const linkableIds = new Set([...personIds, ...deviceIds, ...accountIds, ...backupIds, ...recoveryReferenceIds]);

  for (const d of devices) {
    for (const id of d.ownerIds) {
      if (!personIds.has(id)) return `Device ${d.id} owner ${id} is not a person.`;
    }
    for (const id of d.recoveryReferenceIds) {
      if (!recoveryReferenceIds.has(id)) return `Device ${d.id} recovery reference ${id} does not exist.`;
    }
  }
  for (const a of accounts) {
    for (const id of a.personIds) {
      if (!personIds.has(id)) return `Account ${a.id} person ${id} is not a person.`;
    }
    for (const id of a.recoveryReferenceIds) {
      if (!recoveryReferenceIds.has(id)) return `Account ${a.id} recovery reference ${id} does not exist.`;
    }
  }
  for (const b of backups) {
    for (const id of b.recoveryReferenceIds) {
      if (!recoveryReferenceIds.has(id)) return `Backup ${b.id} recovery reference ${id} does not exist.`;
    }
    for (const id of b.coversIds) {
      if (!coveredIds.has(id)) return `Backup ${b.id} covers ${id} which is not a device or account.`;
    }
    for (const id of b.canRestorePersonIds) {
      if (!personIds.has(id)) return `Backup ${b.id} restore person ${id} is not a person.`;
    }
  }
  for (const d of dependencies) {
    if (!linkableIds.has(d.sourceId)) return `Dependency source ${d.sourceId} does not exist.`;
    if (!linkableIds.has(d.targetId)) return `Dependency target ${d.targetId} does not exist.`;
  }
  for (const r of reviewItems) {
    for (const id of r.linkedEntityIds) {
      if (!linkableIds.has(id)) return `Review item ${r.id} links ${id} which does not exist.`;
    }
  }
  return null;
}
