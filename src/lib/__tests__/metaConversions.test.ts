import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => ({ after: mocks.after }));
import { scheduleProviderLead } from "../metaConversions";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const input = (headers = {}) => ({
  request: new Request("https://ai-nevoie.ro/api/providers/onboarding", {
    headers,
  }),
  uid: "provider-123",
  email: " USER@example.com ",
  phone: "+40 700 000 000",
  locale: "ro" as const,
});

describe("server Lead delivery", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("META_CAPI_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456");
    vi.stubEnv("META_CONVERSIONS_API_ACCESS_TOKEN", "test-secret");
    vi.stubEnv("META_GRAPH_API_VERSION", "v23.0");
    vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends only after the response, with shared ID and normalized hashes", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ events_received: 1 })),
    );
    const eventId = scheduleProviderLead(
      input({
        cookie: "_fbp=fb.1.123.456; _fbc=fb.1.123.click-id; session=private",
        "user-agent": "test browser",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await mocks.after.mock.calls[0][0]();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v23.0/123456/events");
    const { data } = JSON.parse(options.body);
    expect(data[0]).toMatchObject({
      event_id: eventId,
      event_name: "Lead",
      action_source: "website",
      event_source_url: "https://ai-nevoie.ro/ro/providers/quick-signup",
      user_data: {
        em: [hash("user@example.com")],
        ph: [hash("40700000000")],
        external_id: [hash("provider-123")],
        fbp: "fb.1.123.456",
        fbc: "fb.1.123.click-id",
      },
    });
    expect(options.body).not.toContain("USER@example");
    expect(options.body).not.toContain("test-secret");
    expect(options.body).not.toContain("session");
  });

  it.each([
    "META_CAPI_ENABLED",
    "META_CONVERSIONS_API_ACCESS_TOKEN",
    "META_GRAPH_API_VERSION",
    "NEXT_PUBLIC_META_PIXEL_ID",
  ])("does not schedule without %s", (key) => {
    vi.stubEnv(key, "");
    expect(scheduleProviderLead(input())).toMatch(/^provider-lead-/);
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("does not send live events from previews", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    scheduleProviderLead(input());
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("allows marked test events in previews", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("META_CAPI_TEST_EVENT_CODE", "TEST123");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ events_received: 1 })),
    );
    scheduleProviderLead(input({ cookie: "_fbc=malformed" }));
    await mocks.after.mock.calls[0][0]();
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.test_event_code).toBe("TEST123");
    expect(payload.data[0].user_data.fbc).toBeUndefined();
  });

  it.each(["sec-gpc", "dnt"])("respects %s opt-out", (header) => {
    scheduleProviderLead(input({ [header]: "1" }));
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("retries a timeout once with the identical event and contains failure", async () => {
    fetchMock.mockRejectedValue(new Error("network secret"));
    scheduleProviderLead(input());
    await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(
      fetchMock.mock.calls[1][1].body,
    );
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
      "network secret",
    );
  });

  it("does not retry invalid credentials or leak Meta error bodies", async () => {
    fetchMock.mockResolvedValue(
      new Response("private diagnostic", { status: 400 }),
    );
    scheduleProviderLead(input());
    await mocks.after.mock.calls[0][0]();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
      "private diagnostic",
    );
  });

  it("does not break signup when scheduling fails", () => {
    mocks.after.mockImplementation(() => {
      throw new Error("missing request scope");
    });
    expect(scheduleProviderLead(input())).toBeUndefined();
  });
});
