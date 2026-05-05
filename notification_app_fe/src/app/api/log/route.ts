import { NextResponse } from "next/server";
import axios from "axios";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken() {
  const now = Date.now() / 1000;
  if (tokenCache && tokenCache.expiresAt > now + 60) return tokenCache.token;

  const baseUrl = "http://20.207.122.201/evaluation-service";
  const { data } = await axios.post(`${baseUrl}/auth`, {
    email: process.env.AFFORDMED_EMAIL,
    name: process.env.AFFORDMED_NAME,
    rollNo: process.env.AFFORDMED_ROLL_NO,
    accessCode: process.env.AFFORDMED_ACCESS_CODE,
    clientID: process.env.AFFORDMED_CLIENT_ID,
    clientSecret: process.env.AFFORDMED_CLIENT_SECRET,
  });

  tokenCache = { token: data.access_token, expiresAt: data.expires_in };
  return tokenCache.token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { level, pkg, message } = body;

    const token = await getToken();
    await axios.post(
      "http://20.207.122.201/evaluation-service/logs",
      { stack: "frontend", level, package: pkg, message },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
