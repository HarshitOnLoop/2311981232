import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";

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

type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";

type SharedPackage = "auth" | "config" | "middleware" | "utils";

type Package = BackendPackage | FrontendPackage | SharedPackage;

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const BASE_URL = "http://20.207.122.201/evaluation-service";

async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

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

    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[logging_middleware] Failed to send log: ${errMsg}`);
  }
}

export type { Stack, Level, Package };
