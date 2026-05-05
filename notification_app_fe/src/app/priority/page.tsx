"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationBell } from "../../components/NotificationBell";

interface ApiNotification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

export default function PriorityInbox() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("All");

  useEffect(() => {
    async function fetchPriority() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const res = await fetch(`${backendUrl}/api/notifications/priority`);
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch priority inbox", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPriority();
  }, []);

  const filteredNotifications = filterType === "All" 
    ? notifications 
    : notifications.filter(n => n.Type === filterType);

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="logo-section">
          <Link href="/">
            <div className="logo-icon"></div>
          </Link>
          <h1>Priority Inbox</h1>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
            Back to Dashboard
          </Link>
          <NotificationBell />
        </div>
      </header>

      <main className="main-content" style={{ flexDirection: 'column', padding: '2rem 3rem' }}>
        <div className="list-header" style={{ marginBottom: '1rem' }}>
          <h3>Top 10 Important Notifications</h3>
          <div className="filter-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filter by Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '150px', padding: '6px 12px' }}
            >
              <option value="All">All Types</option>
              <option value="Placement">Placement</option>
              <option value="Result">Result</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loader">Loading priority notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">No priority notifications found.</div>
        ) : (
          <div className="notification-list">
            {filteredNotifications.map((notif, index) => {

              const priorityClass = notif.Type === "Placement" ? "high" : notif.Type === "Result" ? "medium" : "low";
              const typeClass = notif.Type === "Placement" ? "type-alert" : notif.Type === "Result" ? "type-warning" : "type-info";

              return (
                <div key={`${notif.ID}-${index}`} className={`notification-item unread ${typeClass}`}>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4>{notif.Type} Notification</h4>
                      <span className={`priority-badge ${priorityClass}`}>Rank {index + 1}</span>
                    </div>
                    <p>{notif.Message}</p>
                    <small>{new Date(notif.Timestamp).toLocaleString()}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
