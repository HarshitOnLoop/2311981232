export type NotificationType = "info" | "warning" | "alert" | "success";
export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId: string;
}

export interface UpdateNotificationDTO {
  isRead?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
