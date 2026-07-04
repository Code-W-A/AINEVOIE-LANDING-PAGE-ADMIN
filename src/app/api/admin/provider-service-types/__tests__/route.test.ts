import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let docData: Record<string, unknown> | null = null;

  return {
    requireAdmin: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    devLogServerError: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    getDocData: () => docData,
    setDocData: (value: Record<string, unknown> | null) => {
      docData = value;
    },
    setDoc: vi.fn(async (payload: Record<string, unknown>) => {
      docData = {
        ...(docData || {}),
        ...payload,
      };
    }),
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
          exists: Boolean(mocks.getDocData()),
          data: () => mocks.getDocData(),
        }),
        set: mocks.setDoc,
      }),
    }),
  }),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

vi.mock("@/lib/devServerErrorLog", () => ({
  devLogServerError: mocks.devLogServerError,
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: mocks.serverTimestamp,
  },
}));

import { GET, PUT } from "../route";

describe("admin provider service types route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDocData(null);
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("returns current settings and defaults on GET", async () => {
    mocks.setDocData({
      items: [
        {
          value: "Instalatii",
          labels: { ro: "Instalații", en: "Plumbing" },
          enabled: true,
          sortOrder: 10,
        },
      ],
    });

    const response = await GET(new Request("https://example.com/api/admin/provider-service-types"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.items).toEqual([
      {
        value: "Instalatii",
        labels: { ro: "Instalații", en: "Plumbing" },
        enabled: true,
        sortOrder: 10,
      },
    ]);
    expect(json.defaults.items.length).toBeGreaterThan(0);
  });

  it("persists sanitized settings on PUT", async () => {
    const response = await PUT(new Request("https://example.com/api/admin/provider-service-types", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            value: " Instalatii ",
            labels: { ro: " Instalații ", en: " Plumbing " },
            enabled: true,
            sortOrder: 10,
          },
        ],
      }),
    }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.items).toEqual([
      {
        value: "Instalatii",
        labels: { ro: "Instalații", en: "Plumbing" },
        enabled: true,
        sortOrder: 10,
      },
    ]);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            value: "Instalatii",
            labels: { ro: "Instalații", en: "Plumbing" },
            enabled: true,
            sortOrder: 10,
          },
        ],
        updatedAt: "server-timestamp",
      }),
      { merge: true },
    );
  });

  it("rejects settings without an active service type", async () => {
    const response = await PUT(new Request("https://example.com/api/admin/provider-service-types", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            value: "Legacy",
            labels: { ro: "Legacy", en: "Legacy" },
            enabled: false,
            sortOrder: 10,
          },
        ],
      }),
    }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Păstrează cel puțin un tip de serviciu activ.");
  });
});
