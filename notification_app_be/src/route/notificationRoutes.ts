import { Router } from "express";
import {
  listNotifications,
  createNotification,
  getNotification,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  getStats,
  getPriorityInbox,
} from "../controller/notificationController";

const router = Router();

// ─── Notification Routes ──────────────────────────────────────────────────────

router.get("/priority", getPriorityInbox);  // GET  /api/notifications/priority
router.get("/stats", getStats);               // GET  /api/notifications/stats
router.get("/", listNotifications);           // GET  /api/notifications
router.post("/", createNotification);         // POST /api/notifications
router.get("/:id", getNotification);          // GET  /api/notifications/:id
router.put("/read-all", markAllRead);         // PUT  /api/notifications/read-all
router.put("/:id/read", markNotificationRead);// PUT  /api/notifications/:id/read
router.delete("/:id", deleteNotification);    // DEL  /api/notifications/:id

export default router;
