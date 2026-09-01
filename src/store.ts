import { loadState, saveState } from './db';
import { DEFAULT_ME } from './constants';
import { generateId } from './utils/id';
import { todayIso } from './utils/date';
import type {
  AppState,
  AppBackup,
  Person,
  Device,
  Account,
  Backup,
  RecoveryReference,
  Dependency,
  ReviewItem,
} from './types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

let state: AppState = {
  schemaVersion: 1,
  people: [DEFAULT_ME],
  devices: [],
  accounts: [],
  backups: [],
  recoveryReferences: [],
  dependencies: [],
  reviewItems: [],
  onboardingComplete: false,
  lastExportAt: '',
};

let hydrated = false;
let saveStatus: SaveStatus = 'idle';
let lastSaveError = '';
const subscribers: Set<() => void> = new Set();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 500;

export function getState(): Readonly<AppState> {
  return state;
}

export function getSaveStatus(): SaveStatus {
  return saveStatus;
}

export function getLastSaveError(): string {
  return lastSaveError;
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function notify() {
  for (const cb of subscribers) cb();
  queueSave();
}

function setSaveStatus(status: SaveStatus, error = '') {
  saveStatus = status;
  lastSaveError = error;
  for (const cb of subscribers) cb();
}

function queueSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveStatus = 'saving';
  lastSaveError = '';
  saveTimeout = setTimeout(() => {
    void flushSave();
  }, SAVE_DEBOUNCE_MS);
}

export async function flushSave(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  setSaveStatus('saving');
  try {
    await saveState(state);
    setSaveStatus('saved');
    // Return to idle after a short visible window so UI can show "Saved".
    setTimeout(() => {
      if (saveStatus === 'saved') {
        saveStatus = 'idle';
        lastSaveError = '';
        for (const cb of subscribers) cb();
      }
    }, 2000);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed.';
    setSaveStatus('error', message);
    console.error('Tech Passport save failed:', err);
  }
}

export async function hydrate(): Promise<void> {
  if (hydrated) return;
  state = await loadState();
  hydrated = true;
  notify();
}

export function resetStore(): void {
  state = {
    schemaVersion: 1,
    people: [DEFAULT_ME],
    devices: [],
    accounts: [],
    backups: [],
    recoveryReferences: [],
    dependencies: [],
    reviewItems: [],
    onboardingComplete: false,
    lastExportAt: '',
  };
  hydrated = false;
  saveStatus = 'idle';
  lastSaveError = '';
  notify();
}

function makeDefaultPerson(partial: Partial<Person> & { name: string; role: Person['role'] }): Person {
  return {
    id: partial.id ?? generateId(),
    name: partial.name,
    role: partial.role,
    notes: partial.notes ?? '',
    visibility: partial.visibility ?? 'private',
  };
}

export function addPerson(partial: Partial<Person> & { name: string; role: Person['role'] }): Person {
  const person = makeDefaultPerson(partial);
  state = { ...state, people: [...state.people, person] };
  notify();
  return person;
}

export function updatePerson(id: string, changes: Partial<Person>): Person | null {
  const index = state.people.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updated = { ...state.people[index], ...changes };
  const next = [...state.people];
  next[index] = updated;
  state = { ...state, people: next };
  notify();
  return updated;
}

export function deletePerson(id: string): boolean {
  const person = state.people.find(p => p.id === id);
  if (!person) return false;
  if (person.role === 'me') return false;
  state = {
    ...state,
    people: state.people.filter(p => p.id !== id),
    devices: state.devices.map(d => ({ ...d, ownerIds: d.ownerIds.filter(oid => oid !== id) })),
    accounts: state.accounts.map(a => ({ ...a, personIds: a.personIds.filter(pid => pid !== id) })),
    backups: state.backups.map(b => ({ ...b, canRestorePersonIds: b.canRestorePersonIds.filter(pid => pid !== id) })),
    dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultDevice(partial: Partial<Device> & { label: string; role: string; category: Device['category'] }): Device {
  return {
    id: partial.id ?? generateId(),
    label: partial.label,
    role: partial.role,
    category: partial.category,
    ownerIds: partial.ownerIds ?? [],
    model: partial.model ?? '',
    os: partial.os ?? '',
    serialNumber: partial.serialNumber ?? '',
    purchaseDate: partial.purchaseDate ?? '',
    location: partial.location ?? '',
    encrypted: partial.encrypted ?? 'unknown',
    recoveryReferenceIds: partial.recoveryReferenceIds ?? [],
    notes: partial.notes ?? '',
    visibility: partial.visibility ?? 'private',
    reviewDate: partial.reviewDate ?? todayIso(),
  };
}

export function addDevice(partial: Partial<Device> & { label: string; role: string; category: Device['category'] }): Device {
  const device = makeDefaultDevice(partial);
  state = { ...state, devices: [...state.devices, device] };
  notify();
  return device;
}

export function updateDevice(id: string, changes: Partial<Device>): Device | null {
  const index = state.devices.findIndex(d => d.id === id);
  if (index === -1) return null;
  const updated = { ...state.devices[index], ...changes };
  const next = [...state.devices];
  next[index] = updated;
  state = { ...state, devices: next };
  notify();
  return updated;
}

export function deleteDevice(id: string): boolean {
  const exists = state.devices.some(d => d.id === id);
  if (!exists) return false;
  state = {
    ...state,
    devices: state.devices.filter(d => d.id !== id),
    dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
    backups: state.backups.map(b => ({
      ...b,
      coversIds: b.coversIds.filter(cid => cid !== id),
    })),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultAccount(partial: Partial<Account> & { label: string }): Account {
  return {
    id: partial.id ?? generateId(),
    label: partial.label,
    provider: partial.provider ?? '',
    purpose: partial.purpose ?? '',
    personIds: partial.personIds ?? [],
    mfa: partial.mfa ?? 'unknown',
    recoveryReferenceIds: partial.recoveryReferenceIds ?? [],
    notes: partial.notes ?? '',
    visibility: partial.visibility ?? 'private',
    reviewDate: partial.reviewDate ?? todayIso(),
  };
}

export function addAccount(partial: Partial<Account> & { label: string }): Account {
  const account = makeDefaultAccount(partial);
  state = { ...state, accounts: [...state.accounts, account] };
  notify();
  return account;
}

export function updateAccount(id: string, changes: Partial<Account>): Account | null {
  const index = state.accounts.findIndex(a => a.id === id);
  if (index === -1) return null;
  const updated = { ...state.accounts[index], ...changes };
  const next = [...state.accounts];
  next[index] = updated;
  state = { ...state, accounts: next };
  notify();
  return updated;
}

export function deleteAccount(id: string): boolean {
  const exists = state.accounts.some(a => a.id === id);
  if (!exists) return false;
  state = {
    ...state,
    accounts: state.accounts.filter(a => a.id !== id),
    dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultBackup(partial: Partial<Backup> & { label: string }): Backup {
  return {
    id: partial.id ?? generateId(),
    label: partial.label,
    destination: partial.destination ?? '',
    recoveryReferenceIds: partial.recoveryReferenceIds ?? [],
    coversIds: partial.coversIds ?? [],
    copies: partial.copies ?? 'unknown',
    lastCheckedDate: partial.lastCheckedDate ?? '',
    restoreTestedDate: partial.restoreTestedDate ?? '',
    restored: partial.restored ?? 'unknown',
    canRestorePersonIds: partial.canRestorePersonIds ?? [],
    notes: partial.notes ?? '',
    visibility: partial.visibility ?? 'private',
    reviewDate: partial.reviewDate ?? todayIso(),
  };
}

export function addBackup(partial: Partial<Backup> & { label: string }): Backup {
  const backup = makeDefaultBackup(partial);
  state = { ...state, backups: [...state.backups, backup] };
  notify();
  return backup;
}

export function updateBackup(id: string, changes: Partial<Backup>): Backup | null {
  const index = state.backups.findIndex(b => b.id === id);
  if (index === -1) return null;
  const updated = { ...state.backups[index], ...changes };
  const next = [...state.backups];
  next[index] = updated;
  state = { ...state, backups: next };
  notify();
  return updated;
}

export function deleteBackup(id: string): boolean {
  const exists = state.backups.some(b => b.id === id);
  if (!exists) return false;
  state = {
    ...state,
    backups: state.backups.filter(b => b.id !== id),
    dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultRecoveryReference(
  partial: Partial<RecoveryReference> & { label: string; kind: RecoveryReference['kind'] },
): RecoveryReference {
  return {
    id: partial.id ?? generateId(),
    label: partial.label,
    kind: partial.kind,
    location: partial.location ?? '',
    contactInfo: partial.contactInfo ?? '',
    notes: partial.notes ?? '',
    visibility: partial.visibility ?? 'private',
  };
}

export function addRecoveryReference(
  partial: Partial<RecoveryReference> & { label: string; kind: RecoveryReference['kind'] },
): RecoveryReference {
  const recoveryReference = makeDefaultRecoveryReference(partial);
  state = { ...state, recoveryReferences: [...state.recoveryReferences, recoveryReference] };
  notify();
  return recoveryReference;
}

export function updateRecoveryReference(id: string, changes: Partial<RecoveryReference>): RecoveryReference | null {
  const index = state.recoveryReferences.findIndex(r => r.id === id);
  if (index === -1) return null;
  const updated = { ...state.recoveryReferences[index], ...changes };
  const next = [...state.recoveryReferences];
  next[index] = updated;
  state = { ...state, recoveryReferences: next };
  notify();
  return updated;
}

export function deleteRecoveryReference(id: string): boolean {
  const exists = state.recoveryReferences.some(r => r.id === id);
  if (!exists) return false;
  state = {
    ...state,
    recoveryReferences: state.recoveryReferences.filter(r => r.id !== id),
    devices: state.devices.map(d => ({ ...d, recoveryReferenceIds: d.recoveryReferenceIds.filter(rid => rid !== id) })),
    accounts: state.accounts.map(a => ({ ...a, recoveryReferenceIds: a.recoveryReferenceIds.filter(rid => rid !== id) })),
    backups: state.backups.map(b => ({ ...b, recoveryReferenceIds: b.recoveryReferenceIds.filter(rid => rid !== id) })),
    dependencies: state.dependencies.filter(d => d.sourceId !== id && d.targetId !== id),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultDependency(
  partial: Partial<Dependency> & { sourceId: string; targetId: string; kind: Dependency['kind'] },
): Dependency {
  return {
    id: partial.id ?? generateId(),
    sourceId: partial.sourceId,
    targetId: partial.targetId,
    kind: partial.kind,
    notes: partial.notes ?? '',
  };
}

export function addDependency(
  partial: Partial<Dependency> & { sourceId: string; targetId: string; kind: Dependency['kind'] },
): Dependency {
  const dependency = makeDefaultDependency(partial);
  state = { ...state, dependencies: [...state.dependencies, dependency] };
  notify();
  return dependency;
}

export function updateDependency(id: string, changes: Partial<Dependency>): Dependency | null {
  const index = state.dependencies.findIndex(d => d.id === id);
  if (index === -1) return null;
  const updated = { ...state.dependencies[index], ...changes };
  const next = [...state.dependencies];
  next[index] = updated;
  state = { ...state, dependencies: next };
  notify();
  return updated;
}

export function deleteDependency(id: string): boolean {
  const exists = state.dependencies.some(d => d.id === id);
  if (!exists) return false;
  state = {
    ...state,
    dependencies: state.dependencies.filter(d => d.id !== id),
    reviewItems: state.reviewItems.map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

function makeDefaultReviewItem(partial: Partial<ReviewItem> & { title: string }): ReviewItem {
  return {
    id: partial.id ?? generateId(),
    title: partial.title,
    recurrenceDays: partial.recurrenceDays ?? null,
    lastReviewedDate: partial.lastReviewedDate ?? '',
    nextReviewDate: partial.nextReviewDate ?? todayIso(),
    status: partial.status ?? 'ok',
    notes: partial.notes ?? '',
    linkedEntityIds: partial.linkedEntityIds ?? [],
    source: partial.source ?? 'user',
  };
}

export function addReviewItem(partial: Partial<ReviewItem> & { title: string }): ReviewItem {
  const reviewItem = makeDefaultReviewItem(partial);
  state = { ...state, reviewItems: [...state.reviewItems, reviewItem] };
  notify();
  return reviewItem;
}

export function updateReviewItem(id: string, changes: Partial<ReviewItem>): ReviewItem | null {
  const index = state.reviewItems.findIndex(r => r.id === id);
  if (index === -1) return null;
  const updated = { ...state.reviewItems[index], ...changes };
  const next = [...state.reviewItems];
  next[index] = updated;
  state = { ...state, reviewItems: next };
  notify();
  return updated;
}

export function deleteReviewItem(id: string): boolean {
  const exists = state.reviewItems.some(r => r.id === id);
  if (!exists) return false;
  state = {
    ...state,
    reviewItems: state.reviewItems
      .filter(r => r.id !== id)
      .map(r => ({ ...r, linkedEntityIds: r.linkedEntityIds.filter(lid => lid !== id) })),
  };
  notify();
  return true;
}

export function setOnboardingComplete(value: boolean): void {
  state = { ...state, onboardingComplete: value };
  notify();
}

export function setLastExportAt(value: string): void {
  state = { ...state, lastExportAt: value };
  notify();
}

export function completeOnboarding(): void {
  setOnboardingComplete(true);
}

export function importBackup(backup: AppBackup): void {
  state = {
    schemaVersion: backup.schemaVersion,
    people: [...backup.people],
    devices: [...backup.devices],
    accounts: [...backup.accounts],
    backups: [...backup.backups],
    recoveryReferences: [...backup.recoveryReferences],
    dependencies: [...backup.dependencies],
    reviewItems: [...backup.reviewItems],
    onboardingComplete: backup.onboardingComplete,
    lastExportAt: backup.lastExportAt,
  };
  notify();
}
