import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getAdminDb: vi.fn(), captureServerException: vi.fn() }));
vi.mock("@/lib/firebaseAdmin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/sentryServer", () => ({ captureServerException: mocks.captureServerException }));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "server-time", increment: (n: number) => ({ increment: n }) },
}));
import { createProviderAppClickToken } from "@/lib/providerAppClickToken";
import { POST } from "./route";

const firstId = "a0000000-0000-4000-8000-000000000001";
const secondId = "a0000000-0000-4000-8000-000000000002";
function request(overrides: Record<string, unknown> = {}) {
  return new Request("https://example.com/api/providers/quick-signup/app-click", {
    method: "POST",
    body: JSON.stringify({ token: createProviderAppClickToken("provider-1"), platform: "android", eventId: firstId, ...overrides }),
  });
}

function fakeDb(providerExists = true) {
  const stats: Record<string, unknown> = {};
  const events = new Set<string>();
  const update = vi.fn((_ref, changes) => {
    for (const [key, value] of Object.entries(changes)) {
      const increment = (value as { increment?: number })?.increment;
      stats[key] = increment ? Number(stats[key] || 0) + increment : value;
    }
  });
  const create = vi.fn((ref) => events.add(ref.path));
  const get = vi.fn(async (ref) => ref.path === "providers/provider-1" ? {
    exists: providerExists,
    get: (key: string) => ({ firstClickedAt: stats[`${key}.firstClickedAt`] }),
  } : { exists: events.has(ref.path) });
  const providerRef = { path: "providers/provider-1", collection: (name: string) => ({
    doc: (id: string) => ({ path: `providers/provider-1/${name}/${id}` }),
  }) };
  const doc = vi.fn(() => providerRef);
  const db = { collection: vi.fn(() => ({ doc })), runTransaction: vi.fn(async (fn) => fn({ get, update, create })) };
  mocks.getAdminDb.mockReturnValue(db);
  return { db, stats, update, create, doc };
}

describe("app store click API", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("PROVIDER_APP_CLICK_SECRET", "test-secret"); });
  afterEach(() => vi.unstubAllEnvs());

  it("attributes separate Android and iOS clicks to the signed provider", async () => {
    const { stats, doc } = fakeDb();
    expect((await POST(request())).status).toBe(200);
    expect((await POST(request({ platform: "ios", eventId: secondId }))).status).toBe(200);
    expect(doc).toHaveBeenCalledWith("provider-1");
    expect(stats["appDownloadClicks.android.count"]).toBe(1);
    expect(stats["appDownloadClicks.ios.count"]).toBe(1);
    expect(stats["appDownloadClicks.android.firstClickedAt"]).toBe("server-time");
    expect(stats["appDownloadClicks.ios.lastClickedAt"]).toBe("server-time");
  });
  it("deduplicates retried event IDs, including different UUID casing", async () => {
    const { stats, update, create } = fakeDb();
    await POST(request());
    const response = await POST(request({ eventId: firstId.toUpperCase() }));
    expect(await response.json()).toEqual({ status: "duplicate" });
    expect(stats["appDownloadClicks.android.count"]).toBe(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });
  it("counts distinct repeat clicks and preserves the first timestamp", async () => {
    const { stats } = fakeDb();
    await POST(request());
    stats["appDownloadClicks.android.firstClickedAt"] = "earlier-time";
    await POST(request({ eventId: secondId }));
    expect(stats["appDownloadClicks.android.count"]).toBe(2);
    expect(stats["appDownloadClicks.android.firstClickedAt"]).toBe("earlier-time");
  });
  it("rejects missing, forged and expired tokens without accessing Firestore", async () => {
    const expired = createProviderAppClickToken("provider-1");
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 25 * 60 * 60 * 1000);
    for (const token of [undefined, "forged", expired]) {
      expect((await POST(request({ token }))).status).toBe(401);
    }
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });
  it("rejects invalid bodies without accessing Firestore", async () => {
    for (const fields of [{ platform: "windows" }, { eventId: "../event" }]) {
      expect((await POST(request(fields))).status).toBe(400);
    }
    expect((await POST(new Request("https://example.com", { method: "POST", body: "{" }))).status).toBe(400);
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });
  it("does not recreate deleted providers", async () => {
    const { update, create } = fakeDb(false);
    expect((await POST(request())).status).toBe(404);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it("reports database failures without including the token", async () => {
    mocks.getAdminDb.mockImplementation(() => { throw new Error("offline"); });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.captureServerException).toHaveBeenCalledOnce();
  });
});
