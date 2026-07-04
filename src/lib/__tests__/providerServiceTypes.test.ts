import { describe, expect, it } from "vitest";
import {
  getDefaultProviderServiceTypeItems,
  getPublicProviderServiceTypes,
  isProviderServiceTypeValue,
  resolveProviderServiceTypeValue,
  sanitizeProviderServiceTypeSettings,
  validateProviderServiceTypeSettings,
} from "../providerServiceTypes";

describe("providerServiceTypes", () => {
  it("falls back to default provider service types when settings are missing", () => {
    const settings = sanitizeProviderServiceTypeSettings(null);

    expect(settings.items).toEqual(getDefaultProviderServiceTypeItems());
    expect(isProviderServiceTypeValue("Curatenie birouri", settings)).toBe(true);
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
    expect(resolveProviderServiceTypeValue("instalatii", settings)).toBe("Instalatii");
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

    expect(validateProviderServiceTypeSettings(settings)).toBe("Păstrează cel puțin un tip de serviciu activ.");
  });
});
