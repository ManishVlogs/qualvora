import { Injectable } from '@angular/core';

const DB_NAME = 'qualvora-docs';
const STORE = 'pdf-files';

@Injectable({ providedIn: 'root' })
export class DocumentFileStoreService {
  private readonly _urls = new Map<string, string>();
  private _db: IDBDatabase | null = null;

  private _openDb(): Promise<IDBDatabase> {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = (e) => {
        this._db = (e.target as IDBOpenDBRequest).result;
        resolve(this._db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Store a file synchronously (blob URL) and persist to IndexedDB in background. */
  store(docId: string, file: File): string {
    const existing = this._urls.get(docId);
    if (existing) URL.revokeObjectURL(existing);
    const url = URL.createObjectURL(file);
    this._urls.set(docId, url);
    this._persist(docId, file);
    return url;
  }

  private async _persist(docId: string, file: File): Promise<void> {
    try {
      const db = await this._openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(file, docId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('DocumentFileStore: failed to persist', docId, e);
    }
  }

  /** Returns cached blob URL synchronously, or null if not yet loaded. */
  get(docId: string): string | undefined {
    return this._urls.get(docId);
  }

  /** Load a file from IndexedDB (or cache) and return a blob URL. */
  async load(docId: string): Promise<string | null> {
    if (this._urls.has(docId)) return this._urls.get(docId)!;
    try {
      const db = await this._openDb();
      const blob: Blob | undefined = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(docId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      this._urls.set(docId, url);
      return url;
    } catch {
      return null;
    }
  }

  remove(docId: string): void {
    const url = this._urls.get(docId);
    if (url) URL.revokeObjectURL(url);
    this._urls.delete(docId);
    this._openDb().then(db => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(docId);
    }).catch(() => {});
  }
}
