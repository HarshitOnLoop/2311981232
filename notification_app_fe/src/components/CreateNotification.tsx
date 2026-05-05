"use client";

import { useState } from "react";
import { useNotifications } from "../state/NotificationContext";

export function CreateNotification() {
  const { createNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createNotification({ title, message, type, priority });
    setTitle("");
    setMessage("");
    setLoading(false);
  };

  return (
    <div className="create-form-container">
      <h3>Trigger Notification</h3>
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Title</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Feature Released" />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Details here..." rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Sending..." : "Send Push Notification"}
        </button>
      </form>
    </div>
  );
}
