import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveProviderAppClickToken, trackProviderAppClick } from "../providerAppClickClient";

describe("quick signup click client", () => {
  const storage = new Map<string, string>();
  const fetchMock = vi.fn();
  beforeEach(() => {
    storage.clear();
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("sends separate events from the persisted tab token", () => {
    saveProviderAppClickToken("signed-token");
    trackProviderAppClick("android");
    trackProviderAppClick("ios");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const options = fetchMock.mock.calls.map((call) => call[1]);
    const bodies = options.map((option) => JSON.parse(option.body));
    expect(bodies[0]).toMatchObject({ token: "signed-token", platform: "android" });
    expect(bodies[1]).toMatchObject({ token: "signed-token", platform: "ios" });
    expect(bodies[0].eventId).not.toBe(bodies[1].eventId);
    expect(options[0]).toMatchObject({ method: "POST", keepalive: true });
    expect(storage.size).toBe(1);
  });
  it("does not attribute direct visits or a signup without tracking", () => {
    trackProviderAppClick("android");
    saveProviderAppClickToken("previous-provider");
    saveProviderAppClickToken();
    trackProviderAppClick("ios");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("tolerates unavailable storage and network failure", async () => {
    saveProviderAppClickToken("signed-token");
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(() => trackProviderAppClick("android")).not.toThrow();
    await Promise.resolve();
    vi.stubGlobal("sessionStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    });
    expect(() => saveProviderAppClickToken("token")).not.toThrow();
    expect(() => trackProviderAppClick("ios")).not.toThrow();
  });
});
