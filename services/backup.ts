const dbName = 'AutolivBackups';
const storeName = 'backups';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const saveBackup = async (type: string, data: any): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await new Promise<void>((resolve, reject) => {
    const req = store.add({ type, data, ts: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  // Keep last 10 backups per type
  const backups = await listBackups(type);
  if (backups.length > 10) {
    const toDelete = backups.slice(0, backups.length - 10);
    const delTx = db.transaction(storeName, 'readwrite');
    const delStore = delTx.objectStore(storeName);
    await Promise.all(toDelete.map(b => new Promise<void>((resolve, reject) => {
      const req = delStore.delete(b.id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })));
  }
  db.close();
};

export const getLatestBackup = async (type: string): Promise<any | null> => {
  const list = await listBackups(type);
  const last = list[list.length - 1];
  return last ? last.data : null;
};

export const listBackups = async (type: string): Promise<Array<{ id: number; type: string; data: any; ts: number }>> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const all: any[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all.filter(b => b.type === type).sort((a, b) => a.ts - b.ts);
};