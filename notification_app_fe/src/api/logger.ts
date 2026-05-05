export async function logFrontend(level: "debug" | "info" | "warn" | "error" | "fatal", pkg: any, message: string) {
  try {
    // Calling an internal Next.js API route because frontend browser code shouldn't hold the secret.
    // However, the test requires we use our logging middleware package.
    // The middleware package depends on `process.env` which is Node only,
    // so we'll wrap it in a Next.js API route.
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, pkg, message }),
    });
  } catch (err) {
    console.error("Frontend logging failed", err);
  }
}
