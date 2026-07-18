import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let data: Record<string, unknown> | null = null;
  return {
    requireAdmin: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    serverTimestamp: vi.fn(() => "server-time"),
    getData: () => data,
    setData: (next: Record<string, unknown> | null) => { data = next; },
    set: vi.fn(async (payload: Record<string, unknown>) => { data = payload; }),
  };
});

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: mocks.requireAdmin,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));
vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({
          exists: Boolean(mocks.getData()),
          data: mocks.getData,
        }),
        set: mocks.set,
      }),
    }),
  }),
}));
vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: mocks.serverTimestamp },
}));

import { GET, PUT } from "../route";

describe("admin billing settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setData(null);
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("returns defaults when billing settings are missing", async () => {
    const response = await GET(new Request("https://example.com/api/admin/billing-settings"));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.item.legalName).toBe("");
    expect(json.defaults.iban).toBe("");
  });

  it("validates and persists billing settings", async () => {
    const response = await PUT(new Request("https://example.com/api/admin/billing-settings", {
      method: "PUT",
      body: JSON.stringify({
        legalName: "AInevoie SRL",
        cui: "RO12345678",
        tradeRegister: "J40/123/2026",
        fiscalAddress: "București",
        email: "facturi@ainevoie.ro",
      }),
    }));
    expect(response.status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: "AInevoie SRL",
        updatedBy: "admin-1",
      }),
      { merge: true },
    );
  });

  it("rejects incomplete billing settings", async () => {
    const response = await PUT(new Request("https://example.com/api/admin/billing-settings", {
      method: "PUT",
      body: JSON.stringify({ legalName: "AInevoie SRL" }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
