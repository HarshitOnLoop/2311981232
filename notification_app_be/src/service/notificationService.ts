import { Log } from "../middleware/logger";
import * as repo from "../repository/notificationRepository";
import { CreateNotificationDTO, Notification, NotificationStats } from "../domain/notification";
import { broadcast } from "../handler/websocketHandler";

export async function createNotification(dto: CreateNotificationDTO): Promise<Notification> {
  await Log("backend", "info", "service", `Creating notification: title="${dto.title}", type=${dto.type}, priority=${dto.priority}, userId=${dto.userId}`);

  const notification = await repo.createNotification(dto);

  broadcast({ event: "new_notification", data: notification });

  await Log("backend", "info", "service", `Notification created and broadcast: id=${notification.id}`);
  return notification;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  await Log("backend", "debug", "service", `Fetching notifications for userId=${userId}`);
  return repo.getNotificationsByUser(userId);
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  await Log("backend", "debug", "service", `Fetching notification detail: id=${id}`);
  return repo.getNotificationById(id);
}

export async function markAsRead(id: string): Promise<Notification | null> {
  await Log("backend", "info", "service", `Marking notification as read: id=${id}`);

  const updated = await repo.markAsRead(id);
  if (updated) {
    broadcast({ event: "notification_read", data: updated });
  }
  return updated;
}

export async function markAllAsRead(userId: string): Promise<number> {
  await Log("backend", "info", "service", `Marking all notifications as read for userId=${userId}`);
  const count = await repo.markAllAsRead(userId);
  broadcast({ event: "all_read", data: { userId, count } });
  return count;
}

export async function deleteNotification(id: string): Promise<boolean> {
  await Log("backend", "info", "service", `Deleting notification: id=${id}`);
  const deleted = await repo.deleteNotification(id);
  if (deleted) {
    broadcast({ event: "notification_deleted", data: { id } });
  }
  return deleted;
}

export async function getStats(userId: string): Promise<NotificationStats> {
  await Log("backend", "debug", "service", `Computing notification stats for userId=${userId}`);
  return repo.getStats(userId);
}
