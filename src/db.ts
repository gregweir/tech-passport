import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_ME, SCHEMA_VERSION } from './constants';
import type { AppState } from './types';

const DB_NAME = 'tech-passport';
const DB_VERSION = 1;

const STORE_NAMES = [
  'metadata',
  'people',
  'devices',
  'accounts',
  'backups',
  'recoveryReferences',
  'dependencies',
  'reviewItems',
] as const;

interface PassportDB extends DBSchema {
  metadata: {
    key: string;
    value: { id: string; value: unknown };
  };
  people: { key: string; value: PersonRecord };
  devices: { key: string; value: DeviceRecord };
  accounts: { key: string; value: AccountRecord };
  backups: { key: string; value: BackupRecord };
  recoveryReferences: { key: string; value: RecoveryReferenceRecord };
  dependencies: { key: string; value: DependencyRecord };
  reviewItems: { key: string; value: ReviewItemRecord };
}

type PersonRecord = AppState['people'][number];
type DeviceRecord = AppState['devices'][number];
type AccountRecord = AppState['accounts'][number];
type BackupRecord = AppState['backups'][number];
type RecoveryReferenceRecord = AppState['recoveryReferences'][number];
type DependencyRecord = AppState['dependencies'][number];
type ReviewItemRecord = AppState['reviewItems'][number];

export class PersistenceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
  }
}

function isQuotaError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'QuotaExceededError' || err.message?.includes('quota'));
}

export async function openDb(): Promise<IDBPDatabase<PassportDB>> {
  try {
    return await openDB<PassportDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORE_NAMES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      },
    });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new PersistenceError('Storage is full. Free up space or export your Passport before continuing.', err);
    }
    throw new PersistenceError('Could not open local storage. Browser private mode or storage restrictions may be blocking Tech Passport.', err);
  }
}

export async function loadState(): Promise<AppState> {
  let db: IDBPDatabase<PassportDB> | undefined;
  try {
    db = await openDb();
    const tx = db.transaction(STORE_NAMES, 'readonly');

    const [metadataRaw, people, devices, accounts, backups, recoveryReferences, dependencies, reviewItems] =
      await Promise.all([
        tx.objectStore('metadata').get('state'),
        tx.objectStore('people').getAll(),
        tx.objectStore('devices').getAll(),
        tx.objectStore('accounts').getAll(),
        tx.objectStore('backups').getAll(),
        tx.objectStore('recoveryReferences').getAll(),
        tx.objectStore('dependencies').getAll(),
        tx.objectStore('reviewItems').getAll(),
      ]);

    await tx.done;
    db.close();

    const metadata = (metadataRaw?.value ?? {}) as Partial<AppState>;

    return {
      schemaVersion: SCHEMA_VERSION,
      people: people.length ? people : [DEFAULT_ME],
      devices: devices ?? [],
      accounts: accounts ?? [],
      backups: backups ?? [],
      recoveryReferences: recoveryReferences ?? [],
      dependencies: dependencies ?? [],
      reviewItems: reviewItems ?? [],
      onboardingComplete: metadata.onboardingComplete ?? false,
      lastExportAt: metadata.lastExportAt ?? '',
    };
  } catch (err) {
    db?.close();
    if (err instanceof PersistenceError) throw err;
    throw new PersistenceError('Could not load your Passport from local storage.', err);
  }
}

export async function saveState(state: AppState): Promise<void> {
  let db: IDBPDatabase<PassportDB> | undefined;
  try {
    db = await openDb();
    const tx = db.transaction(STORE_NAMES, 'readwrite');

    // Clear every entity store before writing so stale records are removed.
    for (const store of tx.objectStoreNames) {
      await tx.objectStore(store).clear();
    }

    await Promise.all([
      tx.objectStore('metadata').put({ id: 'state', value: {
        schemaVersion: state.schemaVersion,
        onboardingComplete: state.onboardingComplete,
        lastExportAt: state.lastExportAt,
      }}),
      ...state.people.map(p => tx.objectStore('people').put(p)),
      ...state.devices.map(d => tx.objectStore('devices').put(d)),
      ...state.accounts.map(a => tx.objectStore('accounts').put(a)),
      ...state.backups.map(b => tx.objectStore('backups').put(b)),
      ...state.recoveryReferences.map(r => tx.objectStore('recoveryReferences').put(r)),
      ...state.dependencies.map(d => tx.objectStore('dependencies').put(d)),
      ...state.reviewItems.map(r => tx.objectStore('reviewItems').put(r)),
    ]);

    await tx.done;
    db.close();
  } catch (err) {
    db?.close();
    if (err instanceof PersistenceError) throw err;
    if (isQuotaError(err)) {
      throw new PersistenceError('Save failed: storage is full. Export your Passport before making more changes.', err);
    }
    throw new PersistenceError('Could not save your Passport to local storage.', err);
  }
}

export async function clearState(): Promise<void> {
  let db: IDBPDatabase<PassportDB> | undefined;
  try {
    db = await openDb();
    const tx = db.transaction(STORE_NAMES, 'readwrite');

    for (const store of tx.objectStoreNames) {
      await tx.objectStore(store).clear();
    }

    await tx.done;
    db.close();
  } catch (err) {
    db?.close();
    if (err instanceof PersistenceError) throw err;
    throw new PersistenceError('Could not clear local storage.', err);
  }
}
