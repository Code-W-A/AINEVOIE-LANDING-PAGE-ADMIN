import type {
  ProviderServiceTypeItem,
  ProviderServiceTypeSettings,
} from "@/lib/providerServiceTypes";

export type ConfigListStatusFilter = "all" | "active" | "inactive";

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function createEmptyProviderServiceTypeItem(
  sortOrder: number
): ProviderServiceTypeItem {
  return {
    value: "",
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
  draft: ProviderServiceTypeItem,
  index: number | null
): ProviderServiceTypeSettings {
  const nextItem: ProviderServiceTypeItem = {
    ...draft,
    value: draft.value.trim(),
    labels: {
      ro: draft.labels.ro.trim(),
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
