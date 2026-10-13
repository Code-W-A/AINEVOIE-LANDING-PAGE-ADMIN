"use client";

import { useSyncExternalStore } from "react";

export const META_CONSENT_COOKIE = "ainevoie_meta_consent";
const CHANGE_EVENT = "ainevoie:measurement-consent";

export function hasMetaMeasurementConsent() {
  return (
    typeof document !== "undefined" &&
    !(navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl &&
    navigator.doNotTrack !== "1" &&
    document.cookie
      .split(";")
      .some((part) => part.trim() === `${META_CONSENT_COOKIE}=granted`)
  );
}

function readChoice() {
  if (typeof document === "undefined") return "unknown";
  if (hasMetaMeasurementConsent()) return "granted";
  return document.cookie.includes(`${META_CONSENT_COOKIE}=`)
    ? "denied"
    : "unknown";
}

const TOKEN_STORAGE = "ainevoie:meta-consent-tokens";
export function saveProviderMetaConsentToken(token?: string) {
  if (!token) return;
  try {
    const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE) || "[]");
    const tokens = Array.isArray(stored)
      ? stored.filter((item) => typeof item === "string")
      : [];
    localStorage.setItem(
      TOKEN_STORAGE,
      JSON.stringify([...new Set([...tokens, token])].slice(-10)),
    );
  } catch {
    /* Signup remains available without browser storage. */
  }
}

export async function retryProviderConsentRevocation() {
  try {
    const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE) || "[]");
    if (!Array.isArray(stored)) return;
    const pending: string[] = [];
    for (const token of stored) {
      if (typeof token !== "string") continue;
      try {
        const response = await fetch(
          "/api/providers/quick-signup/measurement-consent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
            keepalive: true,
          },
        );
        if (!response.ok && response.status !== 401) pending.push(token);
      } catch {
        pending.push(token);
      }
    }
    localStorage.setItem(TOKEN_STORAGE, JSON.stringify(pending));
  } catch {
    /* A later decline retries revocation. */
  }
}

export function setMetaMeasurementConsent(granted: boolean) {
  document.cookie = `${META_CONSENT_COOKIE}=${granted ? "granted" : "denied"}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  if (!granted) {
    window.fbq?.("consent", "revoke");
    void retryProviderConsentRevocation();
  }
}

export function useMetaMeasurementConsent() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener(CHANGE_EVENT, callback);
      return () => window.removeEventListener(CHANGE_EVENT, callback);
    },
    readChoice,
    () => "unknown",
  );
}
