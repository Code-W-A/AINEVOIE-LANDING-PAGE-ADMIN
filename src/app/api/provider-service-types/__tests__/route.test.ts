import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let docData: Record<string, unknown> | null = null;

  return {
    devLogServerError: vi.fn(),
    get: vi.fn(),
    getDocData: () => docData,
    setDocData: (value: Record<string, unknown> | null) => {
      docData = value;
    },
  };
});

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mocks.get,
      }),
    }),
  }),
}));

vi.mock("@/lib/sentryServer", () => ({ captureServerException: vi.fn() }));

vi.mock("@/lib/devServerErrorLog", () => ({
  devLogServerError: mocks.devLogServerError,
}));

import { GET } from "../route";

describe("public provider service types route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDocData(null);
    mocks.get.mockImplementation(async () => ({
      exists: Boolean(mocks.getDocData()),
      data: () => mocks.getDocData(),
    }));
  });

  it("returns default active provider service types when settings are missing", async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.items.length).toBeGreaterThan(0);
    expect(json.item.items[0]).toMatchObject({
      value: "Instalator",
      labels: expect.objectContaining({ ro: "Instalator" }),
    });
  });

  it("returns only enabled service types from Firestore settings", async () => {
    mocks.setDocData({
      items: [
        {
          value: "Legacy",
          labels: { ro: "Legacy", en: "Legacy" },
          enabled: false,
          sortOrder: 10,
        },
        {
          value: "Instalatii",
          labels: { ro: "Instalații", en: "Plumbing" },
          enabled: true,
          sortOrder: 20,
        },
      ],
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.items).toEqual([
      {
        value: "Instalatii",
        labels: { ro: "Instalații", en: "Plumbing" },
        sortOrder: 20,
      },
    ]);
  });
  it("returns editable homepage fields with no-store caching", async () => {
    mocks.setDocData({
      items: [
        {
          value: "Beauty",
          labels: { ro: "Beauty", en: "Beauty" },
          descriptions: { ro: "Coafor", en: "Hair" },
          icon: "Scissors",
          sortOrder: 70,
        },
      ],
    });
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await response.json()).item.items[0]).toMatchObject({
      descriptions: { ro: "Coafor", en: "Hair" },
      icon: "Scissors",
    });
  });

  it("returns a retryable error instead of a static catalog when Firestore fails", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Firestore unavailable"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Nu am putut încărca serviciile.",
    });
  });
});
