import type {
  ProviderServiceTypeItem,
  ProviderServiceTypeSettings,
} from "@/lib/providerServiceTypes";
import {
  generateProviderServiceTypeValueFromLabel,
  makeUniqueProviderServiceTypeValue,
  normalizeProviderServiceTypeOption,
} from "@/lib/providerServiceTypes";

export type ConfigListStatusFilter = "all" | "active" | "inactive";
export type ProviderServiceTypeDraft = Omit<ProviderServiceTypeItem, "value"> & {
  value?: string;
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function createEmptyProviderServiceTypeItem(
  sortOrder: number,
  value = ""
): ProviderServiceTypeDraft {
  return {
    value,
    labels: { ro: "", en: "" },
    enabled: true,
    sortOrder,
  };
}

export function countActiveProviderServiceTypeItems(
  settings: ProviderServiceTypeSettings
) {
  return settings.items.filter((item) => item.enabled).length;
}

export function filterProviderServiceTypeItems(
  items: ProviderServiceTypeItem[],
  search: string,
  status: ConfigListStatusFilter
) {
  const normalizedSearch = normalizeSearchValue(search);

  return items.filter((item) => {
    if (status === "active" && !item.enabled) {
      return false;
    }

    if (status === "inactive" && item.enabled) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      item.value,
      item.labels.ro,
      item.labels.en,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function upsertProviderServiceTypeItem(
  settings: ProviderServiceTypeSettings,
  draft: ProviderServiceTypeDraft,
  index: number | null
): ProviderServiceTypeSettings {
  const trimmedRoLabel = draft.labels.ro.trim();
  const nextValue = index === null
    ? makeUniqueProviderServiceTypeValue(
      generateProviderServiceTypeValueFromLabel(trimmedRoLabel),
      settings.items.map((item) => item.value)
    )
    : String(draft.value || "").trim();
  const nextItem: ProviderServiceTypeItem = {
    ...draft,
    value: nextValue,
    labels: {
      ro: trimmedRoLabel,
      en: draft.labels.en.trim(),
    },
    sortOrder: Number(draft.sortOrder || 0),
  };

  if (index === null) {
    return {
      items: [...settings.items, nextItem],
    };
  }

  return {
    items: settings.items.map((item, itemIndex) => (
      itemIndex === index ? nextItem : item
    )),
  };
}

function hasMatchingLabel(
  items: ProviderServiceTypeItem[],
  locale: "ro" | "en",
  value: string,
  currentIndex: number | null
) {
  const normalizedValue = normalizeProviderServiceTypeOption(value);

  if (!normalizedValue) {
    return false;
  }

  return items.some((item, index) => (
    index !== currentIndex
    && normalizeProviderServiceTypeOption(item.labels[locale]) === normalizedValue
  ));
}

export function getProviderServiceTypeDuplicateWarnings(
  items: ProviderServiceTypeItem[],
  draft: ProviderServiceTypeDraft,
  currentIndex: number | null
) {
  return {
    ro: hasMatchingLabel(items, "ro", draft.labels.ro, currentIndex),
    en: hasMatchingLabel(items, "en", draft.labels.en, currentIndex),
  };
}
