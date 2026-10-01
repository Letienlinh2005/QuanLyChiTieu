/**
 * offlineQueue.ts
 * Quản lý hàng chờ giao dịch offline bằng SQLite local.
 * Mỗi giao dịch chưa sync được lưu vào bảng `pending_giao_dich`.
 * Khi có mạng trở lại, `syncOfflineQueue()` sẽ gửi lần lượt lên server.
 */
import * as SQLite from 'expo-sqlite';

export interface GiaoDichPending {
  id: number;          // local ID (auto increment)
  payload: string;     // JSON của TaoGiaoDichPayload
  createdAt: string;   // ISO timestamp
}

let _db: SQLite.SQLiteDatabase | null = null;
let _dbInitFailed = false;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (_db) return _db;
  if (_dbInitFailed) return null;
  try {
    _db = await SQLite.openDatabaseAsync('offline_queue.db');
    await _db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_giao_dich (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        payload   TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    return _db;
  } catch (err) {
    // Thường xảy ra trong Expo Go khi thư mục SQLite bị hỏng.
    // Giải pháp: Clear Data của Expo Go trên thiết bị rồi thử lại.
    console.warn('[offlineQueue] Không thể mở SQLite database:', err);
    _dbInitFailed = true;
    return null;
  }
}

/** Thêm 1 giao dịch vào hàng chờ offline */
export async function addPendingGiaoDich(payload: object): Promise<number> {
  const db = await getDb();
  if (!db) return -1;
  const result = await db.runAsync(
    'INSERT INTO pending_giao_dich (payload, createdAt) VALUES (?, ?)',
    JSON.stringify(payload),
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

/** Lấy toàn bộ giao dịch đang chờ sync */
export async function getAllPending(): Promise<GiaoDichPending[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.getAllAsync<{ id: number; payload: string; createdAt: string }>(
    'SELECT * FROM pending_giao_dich ORDER BY id ASC'
  );
  return rows;
}

/** Xoá 1 giao dịch khỏi hàng chờ sau khi sync thành công */
export async function removePending(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.runAsync('DELETE FROM pending_giao_dich WHERE id = ?', id);
}

/** Đếm số giao dịch đang chờ */
export async function countPending(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) AS cnt FROM pending_giao_dich'
  );
  return row?.cnt ?? 0;
}
