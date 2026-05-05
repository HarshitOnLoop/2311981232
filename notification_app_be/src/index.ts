import express from "express";
import cors from "cors";
import http from "http";
import { config } from "./config";
import { initDb } from "./db/database";
import { Log } from "./middleware/logger";
import { requestLogger, notFoundHandler, errorHandler } from "./middleware/requestMiddleware";
import { initWebSocket } from "./handler/websocketHandler";
import notificationRoutes from "./route/notificationRoutes";

async function bootstrap() {

  await initDb();

  const app = express();

  app.use(cors({ origin: config.frontendUrl, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/notifications", notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = http.createServer(app);
  initWebSocket(server);

  server.listen(config.port, async () => {
    await Log("backend", "info", "handler", `Notification server started on port ${config.port}`);
    console.log(`\n🚀  Backend running at http://localhost:${config.port}`);
    console.log(`🔌  WebSocket available at ws://localhost:${config.port}/ws`);
  });
}

bootstrap().catch(async (err) => {
  await Log("backend", "fatal", "handler", `Server failed to start: ${err.message}`);
  console.error("Fatal startup error:", err);
  process.exit(1);
});
