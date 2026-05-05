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

router.get("/priority", getPriorityInbox); 
router.get("/stats", getStats);              
router.get("/", listNotifications);          
router.post("/", createNotification);        
router.get("/:id", getNotification);         
router.put("/read-all", markAllRead);        
router.put("/:id/read", markNotificationRead);// PUT  /api/notifications/:id/read
router.delete("/:id", deleteNotification);   

export default router;
