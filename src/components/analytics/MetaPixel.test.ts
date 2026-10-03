import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackMetaStandardEvent } from "./MetaPixel";

describe("Meta browser Lead", () => {
  const fbq = vi.fn();
  let stored: Map<string, string>;
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    stored = new Map();
    vi.stubGlobal("window", {
      fbq,
      setTimeout,
      sessionStorage: {
        getItem: (key: string) => stored.get(key),
        setItem: (key: string, value: string) => stored.set(key, value),
      },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("passes the server ID in Meta's deduplication options only once", () => {
    trackMetaStandardEvent("Lead", "lead-key", {}, "shared-id");
    trackMetaStandardEvent("Lead", "lead-key", {}, "shared-id");
    expect(fbq).toHaveBeenCalledExactlyOnceWith(
      "track",
      "Lead",
      {},
      { eventID: "shared-id" },
    );
  });
  it("preserves the ID while waiting for the pixel script", () => {
    window.fbq = undefined;
    trackMetaStandardEvent("Lead", "lead-key", {}, "shared-id");
    window.fbq = fbq;
    vi.advanceTimersByTime(250);
    expect(fbq).toHaveBeenCalledExactlyOnceWith(
      "track",
      "Lead",
      {},
      { eventID: "shared-id" },
    );
  });
  it("preserves older callers without an event ID", () => {
    trackMetaStandardEvent("CompleteRegistration", "old-key", {});
    expect(fbq).toHaveBeenCalledExactlyOnceWith(
      "track",
      "CompleteRegistration",
      {},
    );
  });
  it("does not break the success redirect if the pixel throws", () => {
    fbq.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() =>
      trackMetaStandardEvent("Lead", "lead-key", {}, "shared-id"),
    ).not.toThrow();
  });
});
