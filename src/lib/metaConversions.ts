// Server-only: imported exclusively by the onboarding route.
import { createHash } from "node:crypto";
import { after } from "next/server";

type ProviderLead = {
  request: Request;
  uid: string;
  email: string;
  phone: string;
  locale: "ro" | "en";
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function readMetaCookie(request: Request, name: "_fbp" | "_fbc") {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  // Do not forward arbitrary cookie contents or manufacture click identifiers.
  return value &&
    value.length <= 500 &&
    /^fb\.\d+\.\d+\.[A-Za-z0-9._-]+$/.test(value)
    ? value
    : undefined;
}

/** Never throws: measurement cannot change a successful signup into an error. */
export function scheduleProviderLead(input: ProviderLead): string | undefined {
  try {
    const eventId = `provider-lead-${hash(input.uid)}`;
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
    const token = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
    const version = process.env.META_GRAPH_API_VERSION?.trim();
    const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
    if (
      process.env.META_CAPI_ENABLED !== "true" ||
      !pixelId ||
      !/^\d+$/.test(pixelId) ||
      !token ||
      !version ||
      !/^v\d+\.0$/.test(version)
    )
      return eventId;

    // Preview/local environments may only send explicitly marked test events.
    if (process.env.VERCEL_ENV !== "production" && !testCode) return eventId;
    if (
      input.request.headers.get("sec-gpc") === "1" ||
      input.request.headers.get("dnt") === "1"
    )
      return eventId;

    const userData = {
      em: [hash(input.email.trim().toLowerCase())],
      ph: [hash(input.phone.replace(/\D/g, ""))],
      external_id: [hash(input.uid)],
      client_user_agent: input.request.headers.get("user-agent") || undefined,
      fbp: readMetaCookie(input.request, "_fbp"),
      fbc: readMetaCookie(input.request, "_fbc"),
    };
    const payload = JSON.stringify({
      data: [
        {
          event_name: "Lead",
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: `https://ai-nevoie.ro/${input.locale}/providers/quick-signup`,
          user_data: userData,
          custom_data: { content_name: "Provider quick signup" },
        },
      ],
      ...(testCode ? { test_event_code: testCode } : {}),
    });

    after(async () => {
      // Reuse the exact payload/time/ID on retry so Meta can deduplicate it.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/${version}/${pixelId}/events`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: payload,
              signal: AbortSignal.timeout(2500),
              cache: "no-store",
            },
          );
          if (response.ok) {
            const result = (await response.json()) as {
              events_received?: number;
            };
            if (result.events_received === 1) return;
          } else if (response.status < 500 && response.status !== 429) {
            // Never log Meta response bodies, credentials or personal data.
            console.warn("[meta-capi] Lead rejected", {
              status: response.status,
              eventId,
            });
            return;
          }
        } catch {
          // Timeout/network errors get one bounded retry after the response.
        }
      }
      console.warn("[meta-capi] Lead delivery unconfirmed", { eventId });
    });
    return eventId;
  } catch {
    console.warn("[meta-capi] Lead scheduling failed");
    return undefined;
  }
}
