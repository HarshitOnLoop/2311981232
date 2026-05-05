export async function logFrontend(level: "debug" | "info" | "warn" | "error" | "fatal", pkg: any, message: string) {
  try {

    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, pkg, message }),
    });
  } catch (err) {
    console.error("Frontend logging failed", err);
  }
}
