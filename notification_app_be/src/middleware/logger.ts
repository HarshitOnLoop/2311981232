import axios from "axios";
import { config } from "../config";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type Package =
  | "cache" | "controller" | "cron_job" | "db" | "domain"
  | "handler" | "repository" | "route" | "service"
  | "api" | "component" | "hook" | "page" | "state" | "style"
  | "auth" | "config" | "middleware" | "utils";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let _tokenCache: TokenCache | null = null;

async function _getToken(): Promise<string> {
  const now = Date.now() / 1000;
  if (_tokenCache && _tokenCache.expiresAt > now + 60) return _tokenCache.token;

  const { data } = await axios.post(`${config.affordmed.baseUrl}/auth`, {
    email: config.affordmed.email,
    name: config.affordmed.name,
    rollNo: config.affordmed.rollNo,
    accessCode: config.affordmed.accessCode,
    clientID: config.affordmed.clientID,
    clientSecret: config.affordmed.clientSecret,
  });

  _tokenCache = { token: data.access_token, expiresAt: data.expires_in };
  return _tokenCache.token;
}

export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> {
  try {
    const token = await _getToken();
    await axios.post(
      `${config.affordmed.baseUrl}/logs`,
      { stack, level, package: pkg, message },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
  } catch {

  }
}
