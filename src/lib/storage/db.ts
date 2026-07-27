import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedOperation {
  id: string;
  type: 'meter-reading' | 'transaction' | 'billing-update';
  payload: unknown;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
}

interface CachedRecord<T = unknown> {
  id: string;
  data: T;
  updatedAt: number;
}

interface EquipChainDB extends DBSchema {
  meters: {
    key: string;
    value: CachedRecord;
  };
  streams: {
    key: string;
    value: CachedRecord;
  };
  billing: {
    key: string;
    value: CachedRecord;
  };
  syncQueue: {
    key: string;
    value: QueuedOperation;
    indexes: { 'by-status': string };
  };
}

const DB_NAME = 'equipchain-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EquipChainDB>> | null = null;

function getDB(): Promise<IDBPDatabase<EquipChainDB>> {
  if (!dbPromise) {
    dbPromise = openDB<EquipChainDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('meters')) {
          db.createObjectStore('meters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('streams')) {
          db.createObjectStore('streams', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('billing')) {
          db.createObjectStore('billing', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheRecord<T>(
  store: 'meters' | 'streams' | 'billing',
  id: string,
  data: T
): Promise<void> {
  const db = await getDB();
  await db.put(store, { id, data, updatedAt: Date.now() });
}

export async function getCachedRecord<T>(
  store: 'meters' | 'streams' | 'billing',
  id: string
): Promise<CachedRecord<T> | undefined> {
  const db = await getDB();
  return db.get(store, id) as Promise<CachedRecord<T> | undefined>;
}

export async function getAllCachedRecords<T>(
  store: 'meters' | 'streams' | 'billing'
): Promise<CachedRecord<T>[]> {
  const db = await getDB();
  return db.getAll(store) as Promise<CachedRecord<T>[]>;
}

export async function enqueueOperation(
  type: QueuedOperation['type'],
  payload: unknown
): Promise<QueuedOperation> {
  const db = await getDB();
  const op: QueuedOperation = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0,
  };
  await db.put('syncQueue', op);
  return op;
}

export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

export async function markOperationStatus(
  id: string,
  status: QueuedOperation['status']
): Promise<void> {
  const db = await getDB();
  const op = await db.get('syncQueue', id);
  if (!op) return;
  op.status = status;
  if (status === 'failed') op.retries += 1;
  await db.put('syncQueue', op);
}

export async function removeOperation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function getQueueCount(): Promise<number> {
  const pending = await getPendingOperations();
  return pending.length;
}

export type { QueuedOperation, CachedRecord };
