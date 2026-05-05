import { useEffect, useRef } from "react";
import { logFrontend } from "../api/logger";

interface WebSocketProps {
  url: string;
  onMessage: (data: any) => void;
}

export function useWebSocket({ url, onMessage }: WebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      logFrontend("info", "hook", `WebSocket connected to ${url}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        logFrontend("error", "hook", `Failed to parse WebSocket message`);
      }
    };

    ws.onerror = () => {
      logFrontend("error", "hook", `WebSocket error on ${url}`);
    };

    ws.onclose = () => {
      logFrontend("warn", "hook", `WebSocket disconnected from ${url}`);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onMessage]);
}
