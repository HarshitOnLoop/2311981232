"use client";

import { useNotifications } from "../state/NotificationContext";
import { NotificationItem } from "./NotificationItem";

export function NotificationList() {
  const { notifications, loading, markAllAsRead } = useNotifications();

  if (loading) {
    return <div className="loader">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return <div className="empty-state">No notifications right now! You're all caught up.</div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-list-container">
      <div className="list-header">
        <h3>Your Notifications</h3>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>
      <div className="notification-list">
        {notifications.map((notif) => (
          <NotificationItem key={notif.id} notification={notif} />
        ))}
      </div>
    </div>
  );
}
