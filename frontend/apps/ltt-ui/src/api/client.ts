import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Get dev user from localStorage
function getDevHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem("kb_dev_user");
    if (stored) {
      const user = JSON.parse(stored) as {
        userId: string;
        roles: string[];
        kbnnId: string;
      };
      return {
        "X-Dev-User-Id": user.userId,
        "X-Dev-Roles": user.roles.join(","),
        "X-Dev-Kbnn-Id": user.kbnnId,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    "X-Dev-User-Id": "user-maker-001",
    "X-Dev-Roles": "PAY_OUT_MAKER",
    "X-Dev-Kbnn-Id": "HN001",
  };
}

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  // Add dev auth headers
  const devHeaders = getDevHeaders();
  Object.assign(config.headers, devHeaders);

  // Add X-Request-Id
  config.headers["X-Request-Id"] = uuidv4();

  // Add X-Idempotency-Key for mutating requests
  if (["post", "put", "delete"].includes(config.method?.toLowerCase() ?? "")) {
    if (!config.headers["X-Idempotency-Key"]) {
      config.headers["X-Idempotency-Key"] = uuidv4();
    }
  }

  return config;
});
