import { describe, expect, it, vi, afterEach } from "vitest";
import { hasServerMetaMeasurementConsent, sanitizeProviderCampaignAttribution } from "../providerAcquisition";
import { createProviderMetaConsentToken, verifyProviderMetaConsentToken } from "../providerMetaConsentToken";
import { verifyProviderAppClickToken } from "../providerAppClickToken";

afterEach(() => vi.unstubAllEnvs());
describe("provider acquisition", () => {
  it("keeps campaign labels but excludes personal data and arbitrary fields", () => {
    expect(sanitizeProviderCampaignAttribution({ utm_campaign: "oradea_lead", utm_source: "facebook", utm_content: "email@example.com", fbclid: "private", uid: "uid" })).toEqual({ utm_campaign: "oradea_lead", utm_source: "facebook" });
  });
  it("requires exact consent and honors privacy signals", () => {
    expect(hasServerMetaMeasurementConsent(new Request("https://example.com", { headers: { cookie: "ainevoie_meta_consent=granted", "sec-gpc": "1" } }))).toBe(false);
    expect(hasServerMetaMeasurementConsent(new Request("https://example.com", { headers: { cookie: "ainevoie_meta_consent=granted" } }))).toBe(true);
    expect(hasServerMetaMeasurementConsent(new Request("https://example.com"))).toBe(false);
  });
  it("binds revocation to one provider and cannot be reused for app-click attribution", () => {
    vi.stubEnv("PROVIDER_APP_CLICK_SECRET", "test-secret");
    const token = createProviderMetaConsentToken("provider-1");
    expect(verifyProviderMetaConsentToken(token)).toBe("provider-1");
    expect(verifyProviderMetaConsentToken(`${token}tampered`)).toBeNull();
    expect(verifyProviderAppClickToken(token)).toBeNull();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 15552000001);
    expect(verifyProviderMetaConsentToken(token)).toBeNull();
    vi.useRealTimers();
  });
});
