import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/database";
import { Log } from "../middleware/logger";
import {
  Notification,
  CreateNotificationDTO,
  NotificationStats,
} from "../domain/notification";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type as Notification["type"],
    priority: row.priority as Notification["priority"],
    isRead: row.is_read === 1,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createNotification(
  dto: CreateNotificationDTO
): Promise<Notification> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = uuidv4();

  await db.run(`
    INSERT INTO notifications (id, title, message, type, priority, is_read, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `, [id, dto.title, dto.message, dto.type, dto.priority, dto.userId, now, now]);

  await Log("backend", "info", "repository", `Notification created: id=${id}, userId=${dto.userId}, type=${dto.type}`);

  const row = await db.get("SELECT * FROM notifications WHERE id = ?", [id]);
  return rowToNotification(row as NotificationRow);
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const db = getDb();
  const rows = await db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [userId]);

  await Log("backend", "debug", "repository", `Fetched ${rows.length} notifications for userId=${userId}`);
  return rows.map((r) => rowToNotification(r as NotificationRow));
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const db = getDb();
  const row = await db.get("SELECT * FROM notifications WHERE id = ?", [id]);
  if (!row) {
    await Log("backend", "warn", "repository", `Notification not found: id=${id}`);
    return null;
  }
  return rowToNotification(row as NotificationRow);
}

export async function markAsRead(id: string): Promise<Notification | null> {
  const db = getDb();
  const now = new Date().toISOString();
  const result = await db.run("UPDATE notifications SET is_read = 1, updated_at = ? WHERE id = ?", [now, id]);

  if (result.changes === 0) {
    await Log("backend", "warn", "repository", `markAsRead — no notification found: id=${id}`);
    return null;
  }

  await Log("backend", "info", "repository", `Notification marked as read: id=${id}`);
  const row = await db.get("SELECT * FROM notifications WHERE id = ?", [id]);
  return rowToNotification(row as NotificationRow);
}

export async function markAllAsRead(userId: string): Promise<number> {
  const db = getDb();
  const now = new Date().toISOString();
  const result = await db.run("UPDATE notifications SET is_read = 1, updated_at = ? WHERE user_id = ? AND is_read = 0", [now, userId]);

  await Log("backend", "info", "repository", `Marked all notifications as read for userId=${userId}, count=${result.changes}`);
  return result.changes || 0;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.run("DELETE FROM notifications WHERE id = ?", [id]);

  if (result.changes === 0) {
    await Log("backend", "warn", "repository", `deleteNotification — no record found: id=${id}`);
    return false;
  }

  await Log("backend", "info", "repository", `Notification deleted: id=${id}`);
  return true;
}

export async function getStats(userId: string): Promise<NotificationStats> {
  const db = getDb();

  const totalRow = await db.get("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?", [userId]);
  const unreadRow = await db.get("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0", [userId]);
  const total = totalRow.cnt;
  const unread = unreadRow.cnt;

  const typeRows = await db.all("SELECT type, COUNT(*) as cnt FROM notifications WHERE user_id = ? GROUP BY type", [userId]);
  const byType = { info: 0, warning: 0, alert: 0, success: 0 } as Record<string, number>;
  typeRows.forEach((r) => (byType[r.type] = r.cnt));

  const priRows = await db.all("SELECT priority, COUNT(*) as cnt FROM notifications WHERE user_id = ? GROUP BY priority", [userId]);
  const byPriority = { low: 0, medium: 0, high: 0 } as Record<string, number>;
  priRows.forEach((r) => (byPriority[r.priority] = r.cnt));

  await Log("backend", "debug", "repository", `Stats computed for userId=${userId}: total=${total}, unread=${unread}`);
  return { total, unread, byType: byType as NotificationStats["byType"], byPriority: byPriority as NotificationStats["byPriority"] };
}
