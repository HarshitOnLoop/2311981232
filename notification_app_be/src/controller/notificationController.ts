import { Request, Response } from "express";
import * as service from "../service/notificationService";
import { Log } from "../middleware/logger";
import { CreateNotificationDTO } from "../domain/notification";

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const userId = (req.query.userId as string) || "default";
  await Log("backend", "info", "controller", `GET /api/notifications — userId=${userId}`);

  try {
    const notifications = await service.getNotifications(userId);
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `listNotifications failed: ${msg}`);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
}

export async function createNotification(req: Request, res: Response): Promise<void> {
  const { title, message, type, priority, userId } = req.body;
  await Log("backend", "info", "controller", `POST /api/notifications — title="${title}", type=${type}, userId=${userId}`);

  if (!title || !message || !type || !priority) {
    await Log("backend", "warn", "controller", "createNotification — missing required fields in request body");
    res.status(400).json({ success: false, error: "title, message, type, and priority are required" });
    return;
  }

  try {
    const dto: CreateNotificationDTO = {
      title,
      message,
      type,
      priority,
      userId: userId || "default",
    };
    const notification = await service.createNotification(dto);
    res.status(201).json({ success: true, data: notification });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `createNotification failed: ${msg}`);
    res.status(500).json({ success: false, error: "Failed to create notification" });
  }
}

export async function getPriorityInbox(req: Request, res: Response): Promise<void> {
  await Log("backend", "info", "controller", "GET /api/notifications/priority");

  try {
    const { getPriorityInbox: fetchPriority } = await import("../service/priorityService");
    const top10 = await fetchPriority();
    res.json({ success: true, data: top10 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `getPriorityInbox failed: ${msg}`);
    res.status(500).json({ success: false, error: "Failed to fetch priority inbox" });
  }
}

export async function getNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await Log("backend", "info", "controller", `GET /api/notifications/${id}`);

  try {
    const notification = await service.getNotificationById(id);
    if (!notification) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `getNotification failed: id=${id}, error=${msg}`);
    res.status(500).json({ success: false, error: "Failed to fetch notification" });
  }
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await Log("backend", "info", "controller", `PUT /api/notifications/${id}/read`);

  try {
    const updated = await service.markAsRead(id);
    if (!updated) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `markNotificationRead failed: id=${id}, error=${msg}`);
    res.status(500).json({ success: false, error: "Failed to mark notification as read" });
  }
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const userId = (req.query.userId as string) || "default";
  await Log("backend", "info", "controller", `PUT /api/notifications/read-all — userId=${userId}`);

  try {
    const count = await service.markAllAsRead(userId);
    res.json({ success: true, data: { marked: count } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `markAllRead failed: ${msg}`);
    res.status(500).json({ success: false, error: "Failed to mark all as read" });
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await Log("backend", "info", "controller", `DELETE /api/notifications/${id}`);

  try {
    const deleted = await service.deleteNotification(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }
    res.json({ success: true, data: { id, deleted: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `deleteNotification failed: id=${id}, error=${msg}`);
    res.status(500).json({ success: false, error: "Failed to delete notification" });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const userId = (req.query.userId as string) || "default";
  await Log("backend", "info", "controller", `GET /api/notifications/stats — userId=${userId}`);

  try {
    const stats = await service.getStats(userId);
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "controller", `getStats failed: ${msg}`);
    res.status(500).json({ success: false, error: "Failed to compute stats" });
  }
}
