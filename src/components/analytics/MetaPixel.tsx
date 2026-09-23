"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

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
) {
  if (wasMetaEventSent(dedupeKey)) return;

  if (typeof window.fbq === "function") {
    window.fbq(method, event, parameters);
    markMetaEventSent(dedupeKey);
    return;
  }

  if (attempt < 8) {
    window.setTimeout(
      () => sendMetaEvent(method, event, parameters, dedupeKey, attempt + 1),
      250,
    );
  }
}

export function trackMetaStandardEvent(
  event: MetaStandardEvent,
  dedupeKey: string,
  parameters: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  sendMetaEvent("track", event, parameters, dedupeKey);
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

  if (!META_PIXEL_ID) return null;
  if (pathname?.includes("/providers/onboarding")) return null;

  const pixelCode = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
    t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${META_PIXEL_ID}');
    fbq('track', 'PageView');
  `;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {pixelCode}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta requires a raw tracking pixel. */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
