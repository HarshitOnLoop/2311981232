"use client";

import { useNotifications } from "../state/NotificationContext";
import { Notification } from "../types";

export function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, deleteNotification } = useNotifications();

  return (
    <div className={`notification-item ${notification.isRead ? 'read' : 'unread'} type-${notification.type}`}>
      <div className="notification-content">
        <div className="notification-header">
          <h4>{notification.title}</h4>
          <span className={`priority-badge ${notification.priority}`}>{notification.priority}</span>
        </div>
        <p>{notification.message}</p>
        <small>{new Date(notification.createdAt).toLocaleString()}</small>
      </div>
      <div className="notification-actions">
        {!notification.isRead && (
          <button className="action-btn read-btn" onClick={() => markAsRead(notification.id)}>
            Mark Read
          </button>
        )}
        <button className="action-btn delete-btn" onClick={() => deleteNotification(notification.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
