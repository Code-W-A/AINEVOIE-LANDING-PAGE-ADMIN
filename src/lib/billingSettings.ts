export const BILLING_SETTINGS_COLLECTION = "admin_settings";
export const BILLING_SETTINGS_DOC = "billing";

export type BillingSettings = {
  legalName: string;
  cui: string;
  tradeRegister: string;
  fiscalAddress: string;
  email: string;
  iban: string;
  bank: string;
};

export function getDefaultBillingSettings(): BillingSettings {
  return {
    legalName: "",
    cui: "",
    tradeRegister: "",
    fiscalAddress: "",
    email: "",
    iban: "",
    bank: "",
  };
}

function readString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function sanitizeBillingSettings(raw: unknown): BillingSettings {
  const source = raw && typeof raw === "object"
    ? raw as Record<string, unknown>
    : {};

  return {
    legalName: readString(source.legalName, 200),
    cui: readString(source.cui, 32).toUpperCase(),
    tradeRegister: readString(source.tradeRegister, 64).toUpperCase(),
    fiscalAddress: readString(source.fiscalAddress, 500),
    email: readString(source.email, 254).toLowerCase(),
    iban: readString(source.iban, 34).replace(/\s+/g, "").toUpperCase(),
    bank: readString(source.bank, 150),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CUI_PATTERN = /^(RO)?\d{2,10}$/;
const IBAN_PATTERN = /^RO\d{2}[A-Z0-9]{20}$/;

export function validateBillingSettings(settings: BillingSettings) {
  if (!settings.legalName) return "Denumirea legală este obligatorie.";
  if (!settings.cui) return "CUI-ul este obligatoriu.";
  if (!CUI_PATTERN.test(settings.cui)) return "CUI-ul nu are un format valid.";
  if (!settings.tradeRegister) return "Numărul de ordine în Registrul Comerțului este obligatoriu.";
  if (!settings.fiscalAddress) return "Adresa fiscală este obligatorie.";
  if (!settings.email) return "Emailul de facturare este obligatoriu.";
  if (!EMAIL_PATTERN.test(settings.email)) return "Emailul de facturare nu este valid.";
  if (settings.iban && !IBAN_PATTERN.test(settings.iban)) return "IBAN-ul nu este valid.";
  if (settings.iban && !settings.bank) return "Banca este obligatorie când este completat IBAN-ul.";
  if (!settings.iban && settings.bank) return "Completează IBAN-ul pentru banca introdusă.";
  return null;
}
