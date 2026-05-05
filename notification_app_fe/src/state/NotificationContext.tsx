"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Notification, NotificationStats } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
import { logFrontend } from "../api/logger";

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (data: any) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/notifications/stats?userId=default`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      logFrontend("error", "state", "Failed to fetch stats");
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/notifications?userId=default`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        logFrontend("info", "state", "Fetched notifications successfully");
      }
    } catch (err) {
      logFrontend("error", "state", "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchStats()]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleWsMessage = useCallback((message: any) => {
    const { event, data } = message;
    logFrontend("debug", "hook", `Received WS event: ${event}`);

    switch (event) {
      case "new_notification":
        setNotifications((prev) => [data, ...prev]);
        fetchStats();
        break;
      case "notification_read":
        setNotifications((prev) => prev.map((n) => (n.id === data.id ? data : n)));
        fetchStats();
        break;
      case "all_read":
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        fetchStats();
        break;
      case "notification_deleted":
        setNotifications((prev) => prev.filter((n) => n.id !== data.id));
        fetchStats();
        break;
    }
  }, []);

  useWebSocket({ url: wsUrl, onMessage: handleWsMessage });

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${backendUrl}/api/notifications/${id}/read`, { method: "PUT" });
      logFrontend("info", "api", `Marked notification ${id} as read`);
    } catch (err) {
      logFrontend("error", "api", `Failed to mark ${id} as read`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${backendUrl}/api/notifications/read-all?userId=default`, { method: "PUT" });
      logFrontend("info", "api", "Marked all notifications as read");
    } catch (err) {
      logFrontend("error", "api", "Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${backendUrl}/api/notifications/${id}`, { method: "DELETE" });
      logFrontend("info", "api", `Deleted notification ${id}`);
    } catch (err) {
      logFrontend("error", "api", `Failed to delete ${id}`);
    }
  };

  const createNotification = async (data: any) => {
    try {
      await fetch(`${backendUrl}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: "default" }),
      });
      logFrontend("info", "api", "Created new notification via UI");
    } catch (err) {
      logFrontend("error", "api", "Failed to create notification");
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        stats,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
