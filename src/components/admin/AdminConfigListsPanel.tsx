"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Search, Settings2 } from "lucide-react";

import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminFormGridSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { useAdminData } from "@/components/admin/useAdminData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ProviderServiceTypeItem,
  ProviderServiceTypeSettings,
  getDefaultProviderServiceTypeSettings,
} from "@/lib/providerServiceTypes";
import {
  type ConfigListStatusFilter,
  countActiveProviderServiceTypeItems,
  createEmptyProviderServiceTypeItem,
  filterProviderServiceTypeItems,
  upsertProviderServiceTypeItem,
} from "@/lib/adminConfigLists";

type ProviderServiceTypesResponse = {
  item: ProviderServiceTypeSettings;
  defaults: ProviderServiceTypeSettings;
};

type ServiceTypeEditorState = {
  mode: "list" | "edit";
  index: number | null;
  draft: ProviderServiceTypeItem;
};

type ConfigListRegistryEntry = {
  key: "provider-service-types";
  title: string;
  description: string;
  activeCount: number;
  totalCount: number;
};

function cloneProviderServiceTypeSettings(
  settings: ProviderServiceTypeSettings
): ProviderServiceTypeSettings {
  return {
    items: settings.items.map((item) => ({
      ...item,
      labels: { ...item.labels },
    })),
  };
}

const STATUS_FILTER_OPTIONS: Array<{
  value: ConfigListStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Toate" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function AdminConfigListsPanel() {
  const {
    data,
    loading,
    error,
    reload,
  } = useAdminData<ProviderServiceTypesResponse>("/api/admin/provider-service-types");
  const [savedState, setSavedState] = useState<ProviderServiceTypeSettings>(
    getDefaultProviderServiceTypeSettings()
  );
  const [draftState, setDraftState] = useState<ProviderServiceTypeSettings>(
    getDefaultProviderServiceTypeSettings()
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConfigListStatusFilter>("all");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorState, setEditorState] = useState<ServiceTypeEditorState>({
    mode: "list",
    index: null,
    draft: createEmptyProviderServiceTypeItem(10),
  });

  useEffect(() => {
    if (data?.item) {
      const nextState = cloneProviderServiceTypeSettings(data.item);
      setSavedState(nextState);
      setDraftState(cloneProviderServiceTypeSettings(nextState));
    }
  }, [data]);

  const registryEntries = useMemo<ConfigListRegistryEntry[]>(() => [
    {
      key: "provider-service-types",
      title: "Tipuri servicii provider",
      description:
        "Lista folosită în onboarding-ul public și în aplicația mobilă.",
      activeCount: countActiveProviderServiceTypeItems(savedState),
      totalCount: savedState.items.length,
    },
  ], [savedState]);

  const filteredItems = useMemo(
    () => draftState.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (
        filterProviderServiceTypeItems([item], searchValue, statusFilter).length > 0
      )),
    [draftState.items, searchValue, statusFilter]
  );
  const draftActiveCount = useMemo(
    () => countActiveProviderServiceTypeItems(draftState),
    [draftState]
  );
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draftState) !== JSON.stringify(savedState),
    [draftState, savedState]
  );

  function resetDrawerState(baseState = savedState) {
    setDraftState(cloneProviderServiceTypeSettings(baseState));
    setSearchValue("");
    setStatusFilter("all");
    setSaveError(null);
    setSaveOk(false);
    setEditorState({
      mode: "list",
      index: null,
      draft: createEmptyProviderServiceTypeItem((baseState.items.length + 1) * 10),
    });
  }

  function openManageList() {
    resetDrawerState(savedState);
    setDrawerOpen(true);
  }

  function closeDrawer(nextOpen: boolean) {
    if (!nextOpen) {
      resetDrawerState(savedState);
    }
    setDrawerOpen(nextOpen);
  }

  function openAddEditor() {
    setEditorState({
      mode: "edit",
      index: null,
      draft: createEmptyProviderServiceTypeItem((draftState.items.length + 1) * 10),
    });
    setSaveOk(false);
  }

  function openEditEditor(index: number) {
    const currentItem = draftState.items[index];

    if (!currentItem) {
      return;
    }

    setEditorState({
      mode: "edit",
      index,
      draft: {
        ...currentItem,
        labels: { ...currentItem.labels },
      },
    });
    setSaveOk(false);
  }

  function closeEditor() {
    setEditorState({
      mode: "list",
      index: null,
      draft: createEmptyProviderServiceTypeItem((draftState.items.length + 1) * 10),
    });
  }

  function updateDraftItem(
    field: keyof Pick<ProviderServiceTypeItem, "value" | "enabled" | "sortOrder">,
    value: string | number | boolean
  ) {
    setEditorState((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        [field]: value,
      },
    }));
  }

  function updateDraftLabel(locale: "ro" | "en", value: string) {
    setEditorState((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        labels: {
          ...prev.draft.labels,
          [locale]: value,
        },
      },
    }));
  }

  function saveEditorDraft() {
    setDraftState((prev) => (
      upsertProviderServiceTypeItem(prev, editorState.draft, editorState.index)
    ));
    setSaveError(null);
    setSaveOk(false);
    closeEditor();
  }

  function updateItemEnabled(index: number, enabled: boolean) {
    setDraftState((prev) => ({
      items: prev.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, enabled } : item
      )),
    }));
    setSaveError(null);
    setSaveOk(false);
  }

  async function saveDraftState() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await adminFetch("/api/admin/provider-service-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftState),
      });

      if (!res.ok) {
        throw new Error(
          await readAdminResponseError(
            res,
            "Nu am putut salva tipurile de servicii."
          )
        );
      }

      const json = await res.json();
      const nextState = cloneProviderServiceTypeSettings(
        json?.item || draftState
      );
      setSavedState(nextState);
      setDraftState(cloneProviderServiceTypeSettings(nextState));
      await reload();
      setSaveOk(true);
      setEditorState({
        mode: "list",
        index: null,
        draft: createEmptyProviderServiceTypeItem((nextState.items.length + 1) * 10),
      });
    } catch (nextError) {
      setSaveError(
        nextError instanceof Error
          ? nextError.message
          : "Nu am putut salva tipurile de servicii."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4">
          {registryEntries.map((entry) => (
            <Card key={entry.key}>
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {entry.title}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {entry.activeCount} active / {entry.totalCount} total
                  </Badge>
                  <Button type="button" onClick={openManageList}>
                    Gestionează
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        {loading && <AdminFormGridSkeleton fields={4} />}
      </div>

      <Sheet open={drawerOpen} onOpenChange={closeDrawer}>
        <SheetContent
          side="right"
          className="flex h-full flex-col p-0 sm:max-w-2xl"
        >
          <div className="border-b border-border px-6 py-5">
            <SheetHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <SheetTitle>Tipuri servicii provider</SheetTitle>
                  <SheetDescription>
                    Valoarea stabilă rămâne cheia salvată pe profilul
                    prestatorului; itemele inactive rămân valabile pentru
                    profilele existente.
                  </SheetDescription>
                </div>
                <Badge variant="outline">
                  {draftActiveCount} active / {draftState.items.length} total
                </Badge>
              </div>
            </SheetHeader>
          </div>

          {editorState.mode === "list" ? (
            <>
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Caută după valoare sau label"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </div>
                <div className="flex items-center rounded-md border border-border p-1">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        statusFilter === option.value
                          ? "rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                          : "rounded-sm px-3 py-1.5 text-sm text-muted-foreground"
                      }
                      onClick={() => setStatusFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={openAddEditor}>
                    <Plus className="size-4" />
                    Adaugă tip serviciu
                  </Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  {filteredItems.length ? (
                    filteredItems.map(({ item, index: sourceIndex }) => (
                        <div
                          key={`${item.value}-${item.sortOrder}-${sourceIndex}`}
                          className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_110px_110px_auto] md:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {item.labels.ro || item.value || "Tip serviciu nou"}
                              </p>
                              <Badge variant={item.enabled ? "success" : "outline"}>
                                {item.enabled ? "Activ" : "Inactiv"}
                              </Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.value || "Fără valoare stabilă"} · EN: {item.labels.en || "—"}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sortare {item.sortOrder}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.enabled ? "Vizibil la selecție" : "Ascuns la selecție"}
                          </div>
                          <div className="flex items-center justify-start gap-2 md:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditEditor(sourceIndex)}
                            >
                              <Pencil className="size-4" />
                              Editează
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemEnabled(sourceIndex, !item.enabled)}
                            >
                              {item.enabled ? "Dezactivează" : "Reactivează"}
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Nu există iteme care să corespundă filtrului curent.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <Button type="button" variant="ghost" size="sm" onClick={closeEditor}>
                  <ArrowLeft className="size-4" />
                  Înapoi la listă
                </Button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">
                    {editorState.index === null
                      ? "Adaugă tip serviciu"
                      : "Editează tip serviciu"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Editează valoarea stabilă și textele afișate în UI.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Valoare stabilă</label>
                    <Input
                      placeholder="Curatenie rezidentiala"
                      value={editorState.draft.value}
                      onChange={(event) =>
                        updateDraftItem("value", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Label RO</label>
                    <Input
                      placeholder="Curățenie rezidențială"
                      value={editorState.draft.labels.ro}
                      onChange={(event) =>
                        updateDraftLabel("ro", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Label EN</label>
                    <Input
                      placeholder="Residential cleaning"
                      value={editorState.draft.labels.en}
                      onChange={(event) =>
                        updateDraftLabel("en", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sortare</label>
                    <Input
                      type="number"
                      value={editorState.draft.sortOrder}
                      onChange={(event) =>
                        updateDraftItem(
                          "sortOrder",
                          Number(event.target.value || 0)
                        )
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 self-end rounded-md border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={editorState.draft.enabled}
                      onChange={(event) =>
                        updateDraftItem("enabled", event.target.checked)
                      }
                    />
                    Activ
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 mt-auto border-t border-border bg-background px-6 py-4">
            {editorState.mode === "list" ? (
              <SheetFooter className="items-start sm:items-center">
                <div className="mr-auto space-y-1">
                  {saveError && (
                    <p className="text-sm text-rose-500">{saveError}</p>
                  )}
                  {saveOk && !saveError && (
                    <p className="text-sm text-emerald-600">
                      Tipurile de servicii au fost salvate.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetDrawerState(savedState)}
                  disabled={saving || !hasUnsavedChanges}
                >
                  Anulează modificările
                </Button>
                <Button
                  type="button"
                  onClick={saveDraftState}
                  disabled={saving || !hasUnsavedChanges}
                >
                  {saving ? "Se salvează..." : "Salvează lista"}
                </Button>
              </SheetFooter>
            ) : (
              <SheetFooter>
                <Button type="button" variant="outline" onClick={closeEditor}>
                  Anulează
                </Button>
                <Button type="button" onClick={saveEditorDraft}>
                  {editorState.index === null ? "Adaugă" : "Salvează"}
                </Button>
              </SheetFooter>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
