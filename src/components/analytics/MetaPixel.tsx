"use client";

import Script from "next/script";
import { useEffect } from "react";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.match(/^\d+$/)?.[0] ?? null;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export default function MetaPixel() {
  if (!META_PIXEL_ID) return null;

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

export function MetaPixelLeadEvent() {
  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead");
    }
  }, []);

  return null;
}
