import axios from "axios";
import { config } from "../config";
import { Log } from "../middleware/logger";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  await Log("backend", "info", "auth", "Fetching new access token from evaluation service");

  const { data } = await axios.post(`${config.affordmed.baseUrl}/auth`, {
    email: config.affordmed.email,
    name: config.affordmed.name,
    rollNo: config.affordmed.rollNo,
    accessCode: config.affordmed.accessCode,
    clientID: config.affordmed.clientID,
    clientSecret: config.affordmed.clientSecret,
  });

  tokenCache = {
    token: data.access_token,
    expiresAt: data.expires_in,
  };

  await Log("backend", "info", "auth", "Access token obtained and cached successfully");
  return tokenCache.token;
}
