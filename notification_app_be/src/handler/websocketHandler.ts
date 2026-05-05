import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { Log } from "../middleware/logger";

let wss: WebSocketServer;
const clients: Set<WebSocket> = new Set();

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    clients.add(ws);
    const ip = req.socket.remoteAddress ?? "unknown";
    Log("backend", "info", "handler", `WebSocket client connected: ip=${ip}, totalClients=${clients.size}`);

    ws.on("close", () => {
      clients.delete(ws);
      Log("backend", "info", "handler", `WebSocket client disconnected: totalClients=${clients.size}`);
    });

    ws.on("error", (err) => {
      Log("backend", "error", "handler", `WebSocket error on client: ${err.message}`);
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ event: "connected", data: { message: "WebSocket connection established" } }));
  });

  Log("backend", "info", "handler", "WebSocket server initialised on path /ws");
}

export function broadcast(payload: object): void {
  const message = JSON.stringify(payload);
  let sent = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });
  Log("backend", "debug", "handler", `Broadcast sent to ${sent}/${clients.size} clients`);
}
