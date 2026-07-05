"use client";

import { getFirebaseAuth } from "@/lib/firebaseClient";
import { formatAdminRouteErrorMessage } from "@/lib/adminRouteError";

export async function adminFetch(input: RequestInfo, init?: RequestInit) {
  const auth = getFirebaseAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function readAdminResponseError(response: Response, fallback: string) {
  try {
    const json = await response.clone().json();
    const errorValue = json?.error;
    const debugValue = json?.debug;

    if (
      debugValue &&
      typeof debugValue === "object" &&
      typeof debugValue.message === "string"
    ) {
      const fallbackMessage = typeof errorValue === "string" && errorValue.trim()
        ? errorValue
        : fallback;
      return formatAdminRouteErrorMessage(fallbackMessage, debugValue);
    }

    if (typeof errorValue === "string" && errorValue.trim()) {
      return errorValue;
    }
    if (
      errorValue &&
      typeof errorValue === "object" &&
      typeof errorValue.message === "string" &&
      errorValue.message.trim()
    ) {
      return errorValue.message;
    }
  } catch {
    // noop
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // noop
  }

  return fallback;
}
