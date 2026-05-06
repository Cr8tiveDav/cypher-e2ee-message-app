import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";

// Singleton promise — prevents multiple simultaneous refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to exchange the stored refresh_token for a new access_token.
 * Updates localStorage on success and returns the new token.
 * Returns null if the refresh token is missing or the server rejects it.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefresh) return null;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRefresh }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const newAccessToken: string | undefined = data.access_token;
      if (!newAccessToken) return null;

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      if (data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      }
      return newAccessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
