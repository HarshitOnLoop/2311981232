"use client";

import { NotificationBell } from "../components/NotificationBell";
import { NotificationList } from "../components/NotificationList";
import { CreateNotification } from "../components/CreateNotification";
import Link from "next/link";
import { useNotifications } from "../state/NotificationContext";

export default function Home() {
  const { stats } = useNotifications();

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="logo-section">
          <div className="logo-icon"></div>
          <h1>Notification Center</h1>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/priority" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
            Priority Inbox
          </Link>
          <NotificationBell />
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <CreateNotification />

          <div className="stats-card">
            <h3>Overview</h3>
            <div className="stat-row">
              <span>Total Notifications:</span>
              <strong>{stats?.total || 0}</strong>
            </div>
            <div className="stat-row highlight">
              <span>Unread:</span>
              <strong>{stats?.unread || 0}</strong>
            </div>
            <hr />
            <div className="stat-grid">
              <div className="stat-box info">
                <span>Info</span>
                <strong>{stats?.byType?.info || 0}</strong>
              </div>
              <div className="stat-box success">
                <span>Success</span>
                <strong>{stats?.byType?.success || 0}</strong>
              </div>
              <div className="stat-box warning">
                <span>Warning</span>
                <strong>{stats?.byType?.warning || 0}</strong>
              </div>
              <div className="stat-box alert">
                <span>Alert</span>
                <strong>{stats?.byType?.alert || 0}</strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="feed-section">
          <NotificationList />
        </section>
      </main>
    </div>
  );
}
