import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let docData: Record<string, unknown> | null = null;

  return {
    devLogServerError: vi.fn(),
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
        get: async () => ({
          exists: Boolean(mocks.getDocData()),
          data: () => mocks.getDocData(),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/devServerErrorLog", () => ({
  devLogServerError: mocks.devLogServerError,
}));

import { GET } from "../route";

describe("public provider service types route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDocData(null);
  });

  it("returns default active provider service types when settings are missing", async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.items.length).toBeGreaterThan(0);
    expect(json.item.items[0]).toMatchObject({
      value: "Curatenie rezidentiala",
      labels: expect.objectContaining({ ro: "Curățenie rezidențială" }),
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
});
