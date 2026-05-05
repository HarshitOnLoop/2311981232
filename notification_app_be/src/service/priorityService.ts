import axios from "axios";
import { getAccessToken } from "../auth/tokenManager";
import { config } from "../config";
import { Log } from "../middleware/logger";

export interface ApiNotification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

export async function getPriorityInbox(): Promise<ApiNotification[]> {
  await Log("backend", "info", "service", "Fetching notifications from Affordmed API for Priority Inbox");

  try {
    const token = await getAccessToken();
    const response = await axios.get(`${config.affordmed.baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notifications: ApiNotification[] = response.data.notifications || [];

    const typeWeight: Record<string, number> = {
      Placement: 3,
      Result: 2,
      Event: 1,
    };

    const sorted = notifications.sort((a, b) => {
      const weightA = typeWeight[a.Type] || 0;
      const weightB = typeWeight[b.Type] || 0;

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });

    const top10 = sorted.slice(0, 10);
    await Log("backend", "info", "service", `Priority Inbox sorted successfully. Returning top 10 out of ${notifications.length}.`);

    return top10;
  } catch (error: any) {
    await Log("backend", "error", "service", `Failed to fetch Affordmed API notifications: ${error.message}`);
    throw error;
  }
}
