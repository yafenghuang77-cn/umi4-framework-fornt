import { type DailyReport, type MonitoringEvent, type MonitoringSnapshot } from './types';

const DB_NAME = 'framework-monitoring-v1';
export const RETENTION_DAYS = 30;
export const MAX_EVENTS = 10_000;
let database: Promise<IDBDatabase> | undefined;
let storageError = '';
const memory: MonitoringSnapshot = { events: [], reports: [] };

export function getStorageError() {
  return storageError;
}

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('events', { keyPath: 'id' });
      request.result.createObjectStore('reports', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('浏览器存储升级被其他标签页阻塞'));
  });
  return database;
}

async function execute<T>(
  store: 'events' | 'reports',
  mode: IDBTransactionMode,
  operation: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = operation(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function saveEvent(event: MonitoringEvent) {
  try {
    await execute('events', 'readwrite', (store) => store.put(event));
  } catch {
    storageError = '浏览器持久化不可用，当前仅保存在内存，关闭页面后会丢失。';
    memory.events = [...memory.events.filter((item) => item.id !== event.id), event].slice(
      -MAX_EVENTS,
    );
  }
  window.dispatchEvent(new Event('monitoring:update'));
}

export async function saveReport(report: DailyReport) {
  try {
    await execute('reports', 'readwrite', (store) => store.put(report));
  } catch {
    storageError = '浏览器持久化不可用，当前仅保存在内存，关闭页面后会丢失。';
    memory.reports = [...memory.reports.filter((item) => item.id !== report.id), report];
  }
  window.dispatchEvent(new Event('monitoring:update'));
}

export async function readSnapshot(): Promise<MonitoringSnapshot> {
  try {
    const [events, reports] = await Promise.all([
      execute<MonitoringEvent[]>('events', 'readonly', (store) => store.getAll()),
      execute<DailyReport[]>('reports', 'readonly', (store) => store.getAll()),
    ]);
    const merged = new Map(events.map((event) => [event.id, event]));
    memory.events.forEach((event) => merged.set(event.id, event));
    const mergedReports = new Map(reports.map((report) => [report.id, report]));
    memory.reports.forEach((report) => mergedReports.set(report.id, report));
    return { events: [...merged.values()], reports: [...mergedReports.values()] };
  } catch {
    storageError = '浏览器持久化不可用，当前仅保存在内存，关闭页面后会丢失。';
    return { events: [...memory.events], reports: [...memory.reports] };
  }
}

/** 原子确认同一版本；上传期间到达的新指标值不会被旧快照覆盖。 */
export async function markEventsUploaded(events: MonitoringEvent[]) {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('events', 'readwrite');
      const store = transaction.objectStore('events');
      events.forEach((event) => {
        const request = store.get(event.id);
        request.onsuccess = () => {
          const current = request.result as MonitoringEvent | undefined;
          if (current?.updatedAt === event.updatedAt) {
            store.put({ ...current, uploadedAt: Date.now() });
          }
        };
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    memory.events = memory.events.map((event) =>
      events.some((item) => item.id === event.id && item.updatedAt === event.updatedAt)
        ? { ...event, uploadedAt: Date.now() }
        : event,
    );
  }
}

export async function pruneStorage() {
  const snapshot = await readSnapshot();
  const cutoff = Date.now() - RETENTION_DAYS * 86400_000;
  const sorted = snapshot.events.sort((a, b) => b.timestamp - a.timestamp);
  const expired = sorted.filter((item, index) => item.timestamp < cutoff || index >= MAX_EVENTS);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['events', 'reports'], 'readwrite');
      expired.forEach((item) => transaction.objectStore('events').delete(item.id));
      snapshot.reports
        .filter((item) => item.generatedAt < cutoff)
        .forEach((item) => transaction.objectStore('reports').delete(item.id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    /* 内存降级已有数量上限。 */
  }
}
