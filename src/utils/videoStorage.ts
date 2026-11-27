const DB_NAME = 'tpack-academy-material-videos';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open material video store.'));
  });
}

export async function saveMaterialVideoBlob(
  materialId: string,
  blob: Blob
): Promise<void> {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, materialId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Failed to save material video.'));
    };
  });
}

export async function getMaterialVideoBlob(
  materialId: string
): Promise<Blob | null> {
  try {
    const db = await openVideoDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(materialId);
      req.onsuccess = () => {
        db.close();
        resolve(req.result instanceof Blob ? req.result : null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error ?? new Error('Failed to load material video.'));
      };
    });
  } catch {
    return null;
  }
}

export async function deleteMaterialVideoBlob(
  materialId: string
): Promise<void> {
  try {
    const db = await openVideoDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(materialId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore cleanup errors
  }
}
