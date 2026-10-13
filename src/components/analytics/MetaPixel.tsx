"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasMetaMeasurementConsent, useMetaMeasurementConsent } from "@/lib/metaMeasurementConsent";

const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.match(/^\d+$/)?.[0] ?? null;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type MetaStandardEvent = "CompleteRegistration" | "Lead";

const META_EVENT_STORAGE_PREFIX = "ainevoie:meta-event:";

function wasMetaEventSent(dedupeKey: string) {
  try {
    return (
      window.sessionStorage.getItem(
        `${META_EVENT_STORAGE_PREFIX}${dedupeKey}`,
      ) === "1"
    );
  } catch {
    return false;
  }
}

function markMetaEventSent(dedupeKey: string) {
  try {
    window.sessionStorage.setItem(
      `${META_EVENT_STORAGE_PREFIX}${dedupeKey}`,
      "1",
    );
  } catch {
    // Tracking must never block onboarding when browser storage is unavailable.
  }
}

function sendMetaEvent(
  method: "track" | "trackCustom",
  event: MetaStandardEvent | string,
  parameters: Record<string, unknown>,
  dedupeKey: string,
  attempt = 0,
  eventId?: string,
) {
  if (!hasMetaMeasurementConsent() || wasMetaEventSent(dedupeKey)) return;

  if (typeof window.fbq === "function") {
    try {
      if (eventId) {
        window.fbq(method, event, parameters, { eventID: eventId });
      } else {
        window.fbq(method, event, parameters);
      }
      markMetaEventSent(dedupeKey);
    } catch {
      // A blocked or broken analytics script must never interrupt signup.
    }
    return;
  }

  if (attempt < 8) {
    window.setTimeout(
      () => sendMetaEvent(method, event, parameters, dedupeKey, attempt + 1, eventId),
      250,
    );
  }
}

export function trackMetaStandardEvent(
  event: MetaStandardEvent,
  dedupeKey: string,
  parameters: Record<string, unknown> = {},
  eventId?: string,
) {
  if (typeof window === "undefined") return;
  sendMetaEvent("track", event, parameters, dedupeKey, 0, eventId);
}

export function trackMetaCustomEvent(
  event: string,
  dedupeKey: string,
  parameters: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  sendMetaEvent("trackCustom", event, parameters, dedupeKey);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const consent = useMetaMeasurementConsent();
  const [ready, setReady] = useState(false);
  const enabled = consent === "granted" && Boolean(META_PIXEL_ID);

  useEffect(() => {
    if (enabled && ready && pathname) {
      window.fbq?.("consent", "grant");
      window.fbq?.("track", "PageView");
    }
  }, [enabled, ready, pathname]);

  if (!enabled) return null;
  const pixelCode = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
    t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${META_PIXEL_ID}');
  `;
  return <Script id="meta-pixel" strategy="afterInteractive" onReady={() => setReady(true)}>{pixelCode}</Script>;
}
