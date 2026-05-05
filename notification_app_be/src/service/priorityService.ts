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

/**
 * Stage 6: Priority Inbox Implementation
 * Fetches notifications from the Affordmed Notification API,
 * determines priority (Placement > Result > Event) + recency,
 * and returns the top 10.
 */
export async function getPriorityInbox(): Promise<ApiNotification[]> {
  await Log("backend", "info", "service", "Fetching notifications from Affordmed API for Priority Inbox");

  try {
    const token = await getAccessToken();
    const response = await axios.get(`${config.affordmed.baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notifications: ApiNotification[] = response.data.notifications || [];

    // Assign numerical weights for sorting
    const typeWeight: Record<string, number> = {
      Placement: 3,
      Result: 2,
      Event: 1,
    };

    // Sort by weight (descending) and then by Timestamp (descending)
    const sorted = notifications.sort((a, b) => {
      const weightA = typeWeight[a.Type] || 0;
      const weightB = typeWeight[b.Type] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight comes first
      }

      // If weights are equal, sort by newest first
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
