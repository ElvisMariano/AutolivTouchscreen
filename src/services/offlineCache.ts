const dbName = 'AutolivOffline';
const storeName = 'files';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'url' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const cacheUrl = async (url: string): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('http');
    const blob = await res.blob();
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ url, blob, ts: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

export const getBlobUrl = async (url: string): Promise<string | null> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const record = await new Promise<any>((resolve, reject) => {
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (record && record.blob) {
    return URL.createObjectURL(record.blob);
  }
  return null;
};

export const hasCache = async (url: string): Promise<boolean> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const exists = await new Promise<boolean>((resolve, reject) => {
    const req = store.getKey(url);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return exists;
};

export const clearCache = async (): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await new Promise<void>((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
};

export const putBlob = async (url: string, blob: Blob): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await new Promise<void>((resolve, reject) => {
    const req = store.put({ url, blob, ts: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
};

export const canCacheUrl = (url: string): boolean => {
  try {
    const u = new URL(url, window.location.href);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
};