import { describe, expect, it } from "vitest";

import {
  countActiveProviderServiceTypeItems,
  createEmptyProviderServiceTypeItem,
  filterProviderServiceTypeItems,
  getProviderServiceTypeDuplicateWarnings,
  upsertProviderServiceTypeItem,
} from "../adminConfigLists";

describe("adminConfigLists", () => {
  const settings = {
    items: [
      {
        value: "Curatenie birouri",
        labels: { ro: "Curățenie birouri", en: "Office cleaning" },
        enabled: true,
        sortOrder: 10,
      },
      {
        value: "Legacy service",
        labels: { ro: "Serviciu vechi", en: "Legacy service" },
        enabled: false,
        sortOrder: 20,
      },
    ],
  };

  it("filters items by search across value and labels", () => {
    expect(filterProviderServiceTypeItems(settings.items, "birouri", "all")).toEqual([
      settings.items[0],
    ]);
    expect(filterProviderServiceTypeItems(settings.items, "legacy", "all")).toEqual([
      settings.items[1],
    ]);
  });

  it("filters items by active status", () => {
    expect(filterProviderServiceTypeItems(settings.items, "", "active")).toEqual([
      settings.items[0],
    ]);
    expect(filterProviderServiceTypeItems(settings.items, "", "inactive")).toEqual([
      settings.items[1],
    ]);
  });

  it("counts active items", () => {
    expect(countActiveProviderServiceTypeItems(settings)).toBe(1);
  });

  it("adds and updates draft items without mutating the original state", () => {
    const empty = createEmptyProviderServiceTypeItem(30);
    const added = upsertProviderServiceTypeItem(
      settings,
      {
        ...empty,
        labels: { ro: " Instalații ", en: " Plumbing " },
      },
      null
    );

    expect(added.items).toHaveLength(3);
    expect(added.items[2]).toEqual({
      value: "Instalatii",
      labels: { ro: "Instalații", en: "Plumbing" },
      enabled: true,
      sortOrder: 30,
    });

    const updated = upsertProviderServiceTypeItem(
      settings,
      {
        ...settings.items[0],
        labels: { ...settings.items[0].labels, ro: "Curățenie office" },
      },
      0
    );

    expect(updated.items[0].labels.ro).toBe("Curățenie office");
    expect(settings.items[0].labels.ro).toBe("Curățenie birouri");
  });

  it("keeps the existing value when editing an existing item", () => {
    const updated = upsertProviderServiceTypeItem(
      settings,
      {
        ...settings.items[0],
        labels: { ...settings.items[0].labels, ro: "Curățenie nouă" },
      },
      0
    );

    expect(updated.items[0].value).toBe("Curatenie birouri");
  });

  it("detects duplicate labels for editor warnings", () => {
    const warnings = getProviderServiceTypeDuplicateWarnings(
      settings.items,
      {
        labels: { ro: "curățenie birouri", en: "legacy service" },
        enabled: true,
        sortOrder: 30,
      },
      null
    );

    expect(warnings).toEqual({
      ro: true,
      en: true,
    });
  });
});
