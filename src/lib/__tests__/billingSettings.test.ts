import { describe, expect, it } from "vitest";
import {
  getDefaultBillingSettings,
  sanitizeBillingSettings,
  validateBillingSettings,
} from "../billingSettings";

describe("billing settings", () => {
  it("returns empty safe defaults", () => {
    expect(sanitizeBillingSettings(null)).toEqual(getDefaultBillingSettings());
  });

  it("normalizes fiscal identifiers and optional bank details", () => {
    const settings = sanitizeBillingSettings({
      legalName: " AInevoie SRL ",
      cui: " ro12345678 ",
      tradeRegister: " j40/123/2026 ",
      fiscalAddress: " București ",
      email: " FACTURI@AINEVOIE.RO ",
      iban: "ro49 aaaa 1b31 0075 9384 0000",
      bank: "Banca Demo",
    });

    expect(settings.cui).toBe("RO12345678");
    expect(settings.tradeRegister).toBe("J40/123/2026");
    expect(settings.email).toBe("facturi@ainevoie.ro");
    expect(settings.iban).toBe("RO49AAAA1B31007593840000");
    expect(validateBillingSettings(settings)).toBeNull();
  });

  it("requires legal invoice fields and paired bank details", () => {
    expect(validateBillingSettings(getDefaultBillingSettings())).toMatch(/Denumirea/);

    const settings = sanitizeBillingSettings({
      legalName: "AInevoie SRL",
      cui: "RO12345678",
      tradeRegister: "J40/123/2026",
      fiscalAddress: "București",
      email: "facturi@ainevoie.ro",
      bank: "Banca Demo",
    });
    expect(validateBillingSettings(settings)).toMatch(/IBAN/);
  });
});
