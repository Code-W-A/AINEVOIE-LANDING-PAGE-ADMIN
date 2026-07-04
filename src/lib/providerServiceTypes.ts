export const PROVIDER_SERVICE_TYPES_COLLECTION = "admin_settings";
export const PROVIDER_SERVICE_TYPES_DOC = "provider_service_types";

export type ProviderServiceTypeLocale = "ro" | "en";

export type ProviderServiceTypeItem = {
  value: string;
  labels: Record<ProviderServiceTypeLocale, string>;
  enabled: boolean;
  sortOrder: number;
};

export type ProviderServiceTypeSettings = {
  items: ProviderServiceTypeItem[];
};

const MAX_SERVICE_TYPES = 50;

function readString(value: unknown, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeOption(value: string) {
  return value.trim().toLowerCase();
}

export function getDefaultProviderServiceTypeItems(): ProviderServiceTypeItem[] {
  return [
    {
      value: "Curatenie rezidentiala",
      labels: { ro: "Curățenie rezidențială", en: "Residential cleaning" },
      enabled: true,
      sortOrder: 10,
    },
    {
      value: "Curatenie birouri",
      labels: { ro: "Curățenie birouri", en: "Office cleaning" },
      enabled: true,
      sortOrder: 20,
    },
    {
      value: "Curatenie dupa renovare",
      labels: { ro: "Curățenie după renovare", en: "Post-renovation cleaning" },
      enabled: true,
      sortOrder: 30,
    },
    {
      value: "Curatenie canapele",
      labels: { ro: "Curățenie canapele", en: "Upholstery cleaning" },
      enabled: true,
      sortOrder: 40,
    },
    {
      value: "Curatenie geamuri",
      labels: { ro: "Curățenie geamuri", en: "Window cleaning" },
      enabled: true,
      sortOrder: 50,
    },
    {
      value: "Curatenie industriala",
      labels: { ro: "Curățenie industrială", en: "Industrial cleaning" },
      enabled: true,
      sortOrder: 60,
    },
  ];
}

export function getDefaultProviderServiceTypeSettings(): ProviderServiceTypeSettings {
  return { items: getDefaultProviderServiceTypeItems() };
}

export function sanitizeProviderServiceTypeSettings(raw: unknown): ProviderServiceTypeSettings {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawItems = Array.isArray(source.items) ? source.items : [];
  const seen = new Set<string>();
  const items: ProviderServiceTypeItem[] = [];

  rawItems.slice(0, MAX_SERVICE_TYPES).forEach((rawItem, index) => {
    const item = rawItem && typeof rawItem === "object" ? rawItem as Record<string, unknown> : {};
    const labelsSource = item.labels && typeof item.labels === "object"
      ? item.labels as Record<string, unknown>
      : {};
    const value = readString(item.value, 120);
    const normalizedValue = normalizeOption(value);

    if (!value || seen.has(normalizedValue)) {
      return;
    }

    seen.add(normalizedValue);
    const roLabel = readString(labelsSource.ro, 120) || value;
    const enLabel = readString(labelsSource.en, 120) || roLabel;
    const parsedSortOrder = Number(item.sortOrder);

    items.push({
      value,
      labels: {
        ro: roLabel,
        en: enLabel,
      },
      enabled: item.enabled !== false,
      sortOrder: Number.isFinite(parsedSortOrder) ? Math.round(parsedSortOrder) : (index + 1) * 10,
    });
  });

  return {
    items: items.length ? sortProviderServiceTypeItems(items) : getDefaultProviderServiceTypeItems(),
  };
}

export function sortProviderServiceTypeItems(items: ProviderServiceTypeItem[]) {
  return [...items].sort((a, b) => (
    a.sortOrder - b.sortOrder
    || a.labels.ro.localeCompare(b.labels.ro, "ro")
    || a.value.localeCompare(b.value)
  ));
}

export function validateProviderServiceTypeSettings(settings: ProviderServiceTypeSettings) {
  if (!settings.items.length) {
    return "Adaugă cel puțin un tip de serviciu.";
  }

  if (!settings.items.some((item) => item.enabled)) {
    return "Păstrează cel puțin un tip de serviciu activ.";
  }

  const seen = new Set<string>();
  for (const item of settings.items) {
    if (!item.value.trim()) {
      return "Fiecare tip de serviciu trebuie să aibă o valoare stabilă.";
    }
    if (!item.labels.ro.trim() || !item.labels.en.trim()) {
      return "Completează etichetele RO și EN pentru fiecare tip de serviciu.";
    }
    const normalizedValue = normalizeOption(item.value);
    if (seen.has(normalizedValue)) {
      return "Valorile tipurilor de servicii trebuie să fie unice.";
    }
    seen.add(normalizedValue);
  }

  return null;
}

export function getPublicProviderServiceTypes(settings: ProviderServiceTypeSettings) {
  return sortProviderServiceTypeItems(settings.items)
    .filter((item) => item.enabled)
    .map((item) => ({
      value: item.value,
      labels: item.labels,
      sortOrder: item.sortOrder,
    }));
}

export function isProviderServiceTypeValue(value: string, settings: ProviderServiceTypeSettings) {
  const normalizedValue = normalizeOption(value);
  return settings.items.some((item) => item.enabled && normalizeOption(item.value) === normalizedValue);
}

export function resolveProviderServiceTypeValue(value: string, settings: ProviderServiceTypeSettings) {
  const normalizedValue = normalizeOption(value);
  return settings.items.find((item) => item.enabled && normalizeOption(item.value) === normalizedValue)?.value || "";
}
