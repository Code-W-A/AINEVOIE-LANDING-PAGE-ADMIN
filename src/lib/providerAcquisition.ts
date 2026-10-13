export type ProviderCampaignAttribution = Partial<
  Record<
    "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term",
    string
  >
>;

export function sanitizeProviderCampaignAttribution(
  raw: unknown,
): ProviderCampaignAttribution {
  if (!raw || typeof raw !== "object") return {};
  const result: ProviderCampaignAttribution = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ] as const) {
    const value = (raw as Record<string, unknown>)[key];
    // Campaign labels only. Never store a URL, email, click ID or arbitrary query string.
    if (typeof value === "string" && /^[a-zA-Z0-9_. -]{1,120}$/.test(value))
      result[key] = value;
  }
  return result;
}

export function hasServerMetaMeasurementConsent(request: Request) {
  return (
    request.headers.get("sec-gpc") !== "1" &&
    request.headers.get("dnt") !== "1" &&
    Boolean(
      request.headers
        .get("cookie")
        ?.split(";")
        .some((part) => part.trim() === "ainevoie_meta_consent=granted"),
    )
  );
}
