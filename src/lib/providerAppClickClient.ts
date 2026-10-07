const STORAGE_KEY = "provider-quick-signup-app-click-token";

export function saveProviderAppClickToken(token?: string) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage restrictions must not interrupt account creation.
  }
}

export function trackProviderAppClick(platform: "android" | "ios") {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (!token) return;
    void fetch("/api/providers/quick-signup/app-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform, eventId: crypto.randomUUID() }),
      keepalive: true,
    }).catch(() => {
      // Opening the store remains available if tracking fails.
    });
  } catch {
    // Tracking is optional when storage or browser APIs are unavailable.
  }
}
