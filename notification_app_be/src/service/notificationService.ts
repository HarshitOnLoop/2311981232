import { Log } from "../middleware/logger";
import * as repo from "../repository/notificationRepository";
import { CreateNotificationDTO, Notification, NotificationStats } from "../domain/notification";
import { broadcast } from "../handler/websocketHandler";

// ─── Notification Service ─────────────────────────────────────────────────────

/**
 * Creates a new notification and broadcasts it to connected WebSocket clients.
 */
export async function createNotification(dto: CreateNotificationDTO): Promise<Notification> {
  await Log("backend", "info", "service", `Creating notification: title="${dto.title}", type=${dto.type}, priority=${dto.priority}, userId=${dto.userId}`);

  const notification = await repo.createNotification(dto);

  // Broadcast real-time update to all connected WebSocket clients
  broadcast({ event: "new_notification", data: notification });

  await Log("backend", "info", "service", `Notification created and broadcast: id=${notification.id}`);
  return notification;
}

/**
 * Retrieves all notifications for the given user.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  await Log("backend", "debug", "service", `Fetching notifications for userId=${userId}`);
  return repo.getNotificationsByUser(userId);
}

/**
 * Returns a single notification or null if not found.
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  await Log("backend", "debug", "service", `Fetching notification detail: id=${id}`);
  return repo.getNotificationById(id);
}

/**
 * Marks a single notification as read and broadcasts the update.
 */
export async function markAsRead(id: string): Promise<Notification | null> {
  await Log("backend", "info", "service", `Marking notification as read: id=${id}`);

  const updated = await repo.markAsRead(id);
  if (updated) {
    broadcast({ event: "notification_read", data: updated });
  }
  return updated;
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  await Log("backend", "info", "service", `Marking all notifications as read for userId=${userId}`);
  const count = await repo.markAllAsRead(userId);
  broadcast({ event: "all_read", data: { userId, count } });
  return count;
}

/**
 * Deletes a notification by ID.
 */
export async function deleteNotification(id: string): Promise<boolean> {
  await Log("backend", "info", "service", `Deleting notification: id=${id}`);
  const deleted = await repo.deleteNotification(id);
  if (deleted) {
    broadcast({ event: "notification_deleted", data: { id } });
  }
  return deleted;
}

/**
 * Retrieves aggregate statistics for the user's notifications.
 */
export async function getStats(userId: string): Promise<NotificationStats> {
  await Log("backend", "debug", "service", `Computing notification stats for userId=${userId}`);
  return repo.getStats(userId);
}
