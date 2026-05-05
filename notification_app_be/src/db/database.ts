import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { config } from "../config";
import { Log } from "../middleware/logger";

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initDb(): Promise<Database> {
  await Log("backend", "info", "db", `Initialising SQLite database at path: ${config.dbPath}`);

  db = await open({
    filename: config.dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'info',
      priority    TEXT NOT NULL DEFAULT 'medium',
      is_read     INTEGER NOT NULL DEFAULT 0,
      user_id     TEXT NOT NULL DEFAULT 'default',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created  ON notifications(created_at DESC);
  `);

  await Log("backend", "info", "db", "SQLite schema initialised — notifications table ready");
  return db;
}

export function getDb(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) throw new Error("Database not initialised. Call initDb() first.");
  return db;
}
