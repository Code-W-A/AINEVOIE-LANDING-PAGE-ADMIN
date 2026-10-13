import launchServices from "./launchServiceCatalog.json";

export const PROVIDER_SERVICE_TYPES_COLLECTION = "admin_settings";
export const PROVIDER_SERVICE_TYPES_DOC = "provider_service_types";

export type ProviderServiceTypeLocale = "ro" | "en";

export const PROVIDER_SERVICE_TYPE_ICONS = [
  "Wrench",
  "Zap",
  "Sparkles",
  "Hammer",
  "Truck",
  "HeartHandshake",
  "Scissors",
] as const;
export type ProviderServiceTypeIcon =
  (typeof PROVIDER_SERVICE_TYPE_ICONS)[number];

export type ProviderServiceTypeItem = {
  value: string;
  labels: Record<ProviderServiceTypeLocale, string>;
  descriptions?: Record<ProviderServiceTypeLocale, string>;
  icon?: ProviderServiceTypeIcon;
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

export function normalizeProviderServiceTypeOption(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOption(value: string) {
  return normalizeProviderServiceTypeOption(value);
}

function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toTitleCaseWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateProviderServiceTypeValueFromLabel(labelRo: string) {
  const normalized = removeDiacritics(readString(labelRo, 120))
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return toTitleCaseWords(normalized);
}

export function makeUniqueProviderServiceTypeValue(
  baseValue: string,
  existingValues: string[],
  currentValue = "",
) {
  const normalizedCurrentValue = normalizeOption(currentValue);
  const taken = new Set(
    existingValues
      .map((value) => normalizeOption(value))
      .filter((value) => value && value !== normalizedCurrentValue),
  );
  const initialValue = readString(baseValue, 120);

  if (!initialValue) {
    return "";
  }

  if (!taken.has(normalizeOption(initialValue))) {
    return initialValue;
  }

  let suffix = 2;
  while (taken.has(normalizeOption(`${initialValue} ${suffix}`))) {
    suffix += 1;
  }

  return `${initialValue} ${suffix}`;
}

export function getDefaultProviderServiceTypeItems(): ProviderServiceTypeItem[] {
  return [
    ...launchServices.map((item) => ({
      ...item,
      icon: item.icon as ProviderServiceTypeIcon,
    })),
    {
      value: "Curatenie rezidentiala",
      labels: { ro: "Curățenie rezidențială", en: "Residential cleaning" },
      enabled: false,
      sortOrder: 110,
    },
    {
      value: "Curatenie birouri",
      labels: { ro: "Curățenie birouri", en: "Office cleaning" },
      enabled: false,
      sortOrder: 120,
    },
    {
      value: "Curatenie dupa renovare",
      labels: { ro: "Curățenie după renovare", en: "Post-renovation cleaning" },
      enabled: false,
      sortOrder: 130,
    },
    {
      value: "Curatenie canapele",
      labels: { ro: "Curățenie canapele", en: "Upholstery cleaning" },
      enabled: false,
      sortOrder: 140,
    },
    {
      value: "Curatenie geamuri",
      labels: { ro: "Curățenie geamuri", en: "Window cleaning" },
      enabled: false,
      sortOrder: 150,
    },
    {
      value: "Curatenie industriala",
      labels: { ro: "Curățenie industrială", en: "Industrial cleaning" },
      enabled: false,
      sortOrder: 160,
    },
  ];
}

export function getDefaultProviderServiceTypeSettings(): ProviderServiceTypeSettings {
  return { items: getDefaultProviderServiceTypeItems() };
}

export function sanitizeProviderServiceTypeSettings(
  raw: unknown,
): ProviderServiceTypeSettings {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawItems = Array.isArray(source.items) ? source.items : [];
  const seen = new Set<string>();
  const items: ProviderServiceTypeItem[] = [];

  rawItems.slice(0, MAX_SERVICE_TYPES).forEach((rawItem, index) => {
    const item =
      rawItem && typeof rawItem === "object"
        ? (rawItem as Record<string, unknown>)
        : {};
    const labelsSource =
      item.labels && typeof item.labels === "object"
        ? (item.labels as Record<string, unknown>)
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

    const descriptionsSource =
      item.descriptions && typeof item.descriptions === "object"
        ? (item.descriptions as Record<string, unknown>)
        : null;
    const icon = PROVIDER_SERVICE_TYPE_ICONS.find((name) => name === item.icon);

    items.push({
      value,
      labels: {
        ro: roLabel,
        en: enLabel,
      },
      ...(descriptionsSource
        ? {
            descriptions: {
              ro: readString(descriptionsSource.ro, 500),
              en: readString(descriptionsSource.en, 500),
            },
          }
        : {}),
      ...(icon ? { icon } : {}),
      enabled: item.enabled !== false,
      sortOrder: Number.isFinite(parsedSortOrder)
        ? Math.round(parsedSortOrder)
        : (index + 1) * 10,
    });
  });

  return {
    items: items.length
      ? sortProviderServiceTypeItems(items)
      : getDefaultProviderServiceTypeItems(),
  };
}

export function sortProviderServiceTypeItems(items: ProviderServiceTypeItem[]) {
  return [...items].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.labels.ro.localeCompare(b.labels.ro, "ro") ||
      a.value.localeCompare(b.value),
  );
}

export function validateProviderServiceTypeSettings(
  settings: ProviderServiceTypeSettings,
) {
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

export function getPublicProviderServiceTypes(
  settings: ProviderServiceTypeSettings,
) {
  return sortProviderServiceTypeItems(settings.items)
    .filter((item) => item.enabled)
    .map((item) => ({
      value: item.value,
      labels: item.labels,
      ...(item.descriptions ? { descriptions: item.descriptions } : {}),
      ...(item.icon ? { icon: item.icon } : {}),
      sortOrder: item.sortOrder,
    }));
}

export function isProviderServiceTypeValue(
  value: string,
  settings: ProviderServiceTypeSettings,
) {
  const normalizedValue = normalizeOption(value);
  return settings.items.some(
    (item) => item.enabled && normalizeOption(item.value) === normalizedValue,
  );
}

export function resolveProviderServiceTypeValue(
  value: string,
  settings: ProviderServiceTypeSettings,
) {
  const normalizedValue = normalizeOption(value);
  return (
    settings.items.find(
      (item) => item.enabled && normalizeOption(item.value) === normalizedValue,
    )?.value || ""
  );
}

// Build a reviewable admin draft. Existing profile keys remain unchanged.
export function prepareLaunchProviderServiceTypeSettings(
  settings: ProviderServiceTypeSettings,
): ProviderServiceTypeSettings {
  const remaining = [...settings.items];
  const active = launchServices.map((service) => {
    const index = remaining.findIndex(
      (item) =>
        normalizeOption(item.value) === normalizeOption(service.value) ||
        normalizeOption(item.labels.ro) === normalizeOption(service.labels.ro),
    );
    const existing = index === -1 ? null : remaining.splice(index, 1)[0];
    return {
      ...service,
      value: existing?.value || service.value,
      icon: service.icon as ProviderServiceTypeIcon,
    };
  });
  return {
    items: [
      ...active,
      ...remaining.map((item) => ({ ...item, enabled: false })),
    ],
  };
}
