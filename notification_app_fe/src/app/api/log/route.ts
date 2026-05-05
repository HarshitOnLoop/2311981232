import { NextResponse } from "next/server";
import { Log } from "logging_middleware";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { level, pkg, message } = body;

    // Log requires (stack, level, package, message)
    await Log("frontend", level, pkg, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
