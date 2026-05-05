import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from the package root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Types ────────────────────────────────────────────────────────────────────

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";

// Backend-only packages
type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";

// Frontend-only packages
type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";

// Shared packages
type SharedPackage = "auth" | "config" | "middleware" | "utils";

type Package = BackendPackage | FrontendPackage | SharedPackage;

// ─── Token Cache ──────────────────────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const BASE_URL = "http://20.207.122.201/evaluation-service";

/**
 * Fetches and caches the Bearer access token from the evaluation service.
 * Re-fetches automatically when the cached token is near expiry.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  const { data } = await axios.post(`${BASE_URL}/auth`, {
    email: process.env.AFFORDMED_EMAIL,
    name: process.env.AFFORDMED_NAME,
    rollNo: process.env.AFFORDMED_ROLL_NO,
    accessCode: process.env.AFFORDMED_ACCESS_CODE,
    clientID: process.env.AFFORDMED_CLIENT_ID,
    clientSecret: process.env.AFFORDMED_CLIENT_SECRET,
  });

  tokenCache = {
    token: data.access_token,
    expiresAt: data.expires_in,
  };

  return tokenCache.token;
}

// ─── Main Log Function ────────────────────────────────────────────────────────

/**
 * Log — sends a structured log entry to the Affordmed evaluation service.
 *
 * @param stack   - "backend" or "frontend"
 * @param level   - "debug" | "info" | "warn" | "error" | "fatal"
 * @param pkg     - the package/layer originating this log (e.g., "service", "controller")
 * @param message - descriptive log message with relevant context
 *
 * @example
 * await Log("backend", "info", "service", "Notification created for user: user_123");
 * await Log("backend", "error", "db", "Failed to connect to SQLite database");
 * await Log("frontend", "warn", "component", "WebSocket reconnection attempt #3");
 */
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> {
  try {
    const token = await getAccessToken();

    await axios.post(
      `${BASE_URL}/logs`,
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    // Silently fail — logging must never crash the application
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[logging_middleware] Failed to send log: ${errMsg}`);
  }
}

export type { Stack, Level, Package };
