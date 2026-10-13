import { describe, expect, it } from "vitest";
import {
  generateProviderServiceTypeValueFromLabel,
  getDefaultProviderServiceTypeItems,
  getPublicProviderServiceTypes,
  isProviderServiceTypeValue,
  makeUniqueProviderServiceTypeValue,
  resolveProviderServiceTypeValue,
  sanitizeProviderServiceTypeSettings,
  validateProviderServiceTypeSettings,
  prepareLaunchProviderServiceTypeSettings,
} from "../providerServiceTypes";

describe("providerServiceTypes", () => {
  it("falls back to default provider service types when settings are missing", () => {
    const settings = sanitizeProviderServiceTypeSettings(null);

    expect(settings.items).toEqual(getDefaultProviderServiceTypeItems());
    expect(isProviderServiceTypeValue("Curatenie birouri", settings)).toBe(
      false,
    );
    expect(getPublicProviderServiceTypes(settings)).toHaveLength(7);
  });

  it("sanitizes settings, removes duplicate values, and derives missing labels", () => {
    const settings = sanitizeProviderServiceTypeSettings({
      items: [
        {
          value: " Instalatii ",
          labels: { ro: " Instalații " },
          enabled: true,
          sortOrder: 20.4,
        },
        {
          value: "instalatii",
          labels: { ro: "Duplicat", en: "Duplicate" },
          enabled: true,
          sortOrder: 10,
        },
      ],
    });

    expect(settings.items).toEqual([
      {
        value: "Instalatii",
        labels: { ro: "Instalații", en: "Instalații" },
        enabled: true,
        sortOrder: 20,
      },
    ]);
  });

  it("returns only active public items and rejects inactive values for new submissions", () => {
    const settings = sanitizeProviderServiceTypeSettings({
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

    expect(getPublicProviderServiceTypes(settings)).toEqual([
      {
        value: "Instalatii",
        labels: { ro: "Instalații", en: "Plumbing" },
        sortOrder: 20,
      },
    ]);
    expect(isProviderServiceTypeValue("Legacy", settings)).toBe(false);
    expect(resolveProviderServiceTypeValue("instalatii", settings)).toBe(
      "Instalatii",
    );
  });

  it("requires at least one active item", () => {
    const settings = sanitizeProviderServiceTypeSettings({
      items: [
        {
          value: "Legacy",
          labels: { ro: "Legacy", en: "Legacy" },
          enabled: false,
          sortOrder: 10,
        },
      ],
    });

    expect(validateProviderServiceTypeSettings(settings)).toBe(
      "Păstrează cel puțin un tip de serviciu activ.",
    );
  });

  it("generates stable values from Romanian labels", () => {
    expect(
      generateProviderServiceTypeValueFromLabel("Curățenie rezidențială"),
    ).toBe("Curatenie Rezidentiala");
  });

  it("makes auto-generated values unique with numeric suffixes", () => {
    expect(
      makeUniqueProviderServiceTypeValue("Curatenie Rezidentiala", [
        "Curatenie Rezidentiala",
        "Curatenie Rezidentiala 2",
      ]),
    ).toBe("Curatenie Rezidentiala 3");
  });
  it("round trips descriptions and icons while sanitizing unsupported icons", () => {
    const settings = sanitizeProviderServiceTypeSettings({
      items: [
        {
          value: "Beauty",
          labels: { ro: "Beauty", en: "Beauty" },
          descriptions: { ro: " Coafor ", en: " Hair " },
          icon: "Scissors",
          sortOrder: 20,
        },
        {
          value: "Other",
          labels: { ro: "Altele", en: "Other" },
          icon: "Unsupported",
          sortOrder: 10,
        },
      ],
    });
    expect(getPublicProviderServiceTypes(settings)[1]).toMatchObject({
      descriptions: { ro: "Coafor", en: "Hair" },
      icon: "Scissors",
    });
    expect(settings.items[0]).not.toHaveProperty("icon");
    expect(sanitizeProviderServiceTypeSettings(settings)).toEqual(settings);
  });

  it("prepares exactly seven active categories, preserves keys and is idempotent", () => {
    const before = sanitizeProviderServiceTypeSettings({
      items: [
        {
          value: "custom-plumber-key",
          labels: { ro: "Instalator", en: "Plumber" },
          enabled: false,
        },
        {
          value: "Legacy",
          labels: { ro: "Vechi", en: "Legacy" },
          enabled: true,
        },
      ],
    });
    const prepared = prepareLaunchProviderServiceTypeSettings(before);
    expect(getPublicProviderServiceTypes(prepared)).toHaveLength(7);
    expect(prepared.items[0].value).toBe("custom-plumber-key");
    expect(
      prepared.items.find((item) => item.value === "Legacy")?.enabled,
    ).toBe(false);
    expect(before.items.find((item) => item.value === "Legacy")?.enabled).toBe(
      true,
    );
    expect(prepareLaunchProviderServiceTypeSettings(prepared)).toEqual(
      prepared,
    );
  });
});
