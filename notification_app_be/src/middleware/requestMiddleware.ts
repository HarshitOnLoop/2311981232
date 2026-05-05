import { Request, Response, NextFunction } from "express";
import { Log } from "./logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path, query } = req;

  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    Log(
      "backend",
      level,
      "middleware",
      `${method} ${path} — status=${res.statusCode} queryParams=${JSON.stringify(query)} duration=${ms}ms`
    );
  });

  next();
}

export function notFoundHandler(req: Request, res: Response): void {
  Log("backend", "warn", "middleware", `404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  Log("backend", "fatal", "middleware", `Unhandled error: ${err.message} — stack: ${err.stack}`);
  res.status(500).json({ success: false, error: "Internal server error" });
}
