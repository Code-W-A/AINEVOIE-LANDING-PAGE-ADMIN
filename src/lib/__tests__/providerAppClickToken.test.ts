import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProviderAppClickToken, verifyProviderAppClickToken } from "../providerAppClickToken";

describe("provider app click tokens", () => {
  beforeEach(() => {
    vi.stubEnv("PROVIDER_APP_CLICK_SECRET", "test-secret-for-app-clicks");
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("associates a signed token with its provider", () => {
    expect(verifyProviderAppClickToken(createProviderAppClickToken("provider-1"))).toBe("provider-1");
  });
  it("rejects changed payloads and signatures", () => {
    const token = createProviderAppClickToken("provider-1")!;
    const [payload, signature] = token.split(".");
    expect(verifyProviderAppClickToken(`${Buffer.from('{"uid":"other"}').toString("base64url")}.${signature}`)).toBeNull();
    expect(verifyProviderAppClickToken(`${payload}.bad`)).toBeNull();
    expect(verifyProviderAppClickToken(`${token}.extra`)).toBeNull();
  });
  it("expires exactly 24 hours after signup", () => {
    const token = createProviderAppClickToken("provider-1");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1);
    expect(verifyProviderAppClickToken(token)).toBe("provider-1");
    vi.advanceTimersByTime(1);
    expect(verifyProviderAppClickToken(token)).toBeNull();
  });
  it("disables tracking when the secret is absent", () => {
    vi.stubEnv("PROVIDER_APP_CLICK_SECRET", "");
    expect(createProviderAppClickToken("provider-1")).toBeUndefined();
    expect(verifyProviderAppClickToken("anything")).toBeNull();
  });
  it("rejects malformed tokens and invalid provider paths", () => {
    for (const token of [null, {}, "", "x".repeat(2049), createProviderAppClickToken("a/b")]) {
      expect(verifyProviderAppClickToken(token)).toBeNull();
    }
  });
});
