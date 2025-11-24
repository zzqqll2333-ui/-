
import { StoryData } from '../types';

const DB_NAME = 'zql_storyboard_db';
const STORE_NAME = 'stories';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveStoryToHistory = async (story: StoryData): Promise<void> => {
  let db: IDBDatabase | null = null;
  try {
    // Clean up legacy localStorage
    try {
      if (localStorage.getItem('zql_storyboard_history_v1')) {
        localStorage.removeItem('zql_storyboard_history_v1');
      }
    } catch(e) {}

    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(story);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("IndexedDB Save Error:", e);
    throw e;
  } finally {
    if (db) db.close();
  }
};

export const getHistory = async (): Promise<StoryData[]> => {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as StoryData[];
        // Sort by newest first
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("IndexedDB Load Error:", e);
    return [];
  } finally {
    if (db) db.close();
  }
};

export const deleteStoryFromHistory = async (id: string): Promise<StoryData[]> => {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    // Close the write connection before opening a read connection in getHistory
    if (db) {
        db.close();
        db = null;
    }

    return await getHistory();
  } catch (e) {
    console.error("IndexedDB Delete Error:", e);
    throw e;
  } finally {
    if (db) db.close();
  }
};

export const clearAllHistory = async (): Promise<StoryData[]> => {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return [];
  } catch (e) {
    console.error("IndexedDB Clear Error:", e);
    return [];
  } finally {
    if (db) db.close();
  }
};
