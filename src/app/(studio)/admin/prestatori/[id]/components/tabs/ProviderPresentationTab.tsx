"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatValue,
  getCoverageText,
  getDisplayName,
  getLocationLabel,
  getSpecialization,
  readNumber,
  readString,
  type ProviderDocument,
} from "@/lib/adminProviderDetail";
import { AvatarPreview } from "../shared/AvatarPreview";
import { FieldValue } from "../shared/FieldValue";

export function ProviderPresentationTab({
  provider,
  providerDirectory,
  avatarPreviewUrl,
  avatarPreviewLoading,
  providerId,
  canEditProfile,
  onSaved,
}: {
  provider: ProviderDocument;
  providerDirectory?: Record<string, unknown> | null;
  avatarPreviewUrl: string | null;
  avatarPreviewLoading: boolean;
  providerId: string;
  canEditProfile: boolean;
  onSaved: () => void;
}) {
  const displayName = getDisplayName(provider);
  const profile = provider.professionalProfile || {};
  const specialization = getSpecialization(provider);
  const locationLabel = getLocationLabel(provider);
  const coverageText = getCoverageText(provider);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmedByProvider, setConfirmedByProvider] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [form, setForm] = useState({
    businessName: readString(profile.businessName),
    displayName: readString(profile.displayName),
    specialization: readString(profile.specialization),
    baseRateAmount: String(readNumber(profile.baseRateAmount) ?? ""),
    shortBio: readString(profile.shortBio),
  });

  useEffect(() => {
    setForm({
      businessName: readString(profile.businessName),
      displayName: readString(profile.displayName),
      specialization: readString(profile.specialization),
      baseRateAmount: String(readNumber(profile.baseRateAmount) ?? ""),
      shortBio: readString(profile.shortBio),
    });
  }, [profile.businessName, profile.displayName, profile.specialization, profile.baseRateAmount, profile.shortBio]);

  useEffect(() => {
    let active = true;
    void adminFetch("/api/provider-service-types", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { item?: { items?: Array<{ value?: string; labels?: { ro?: string } }> } };
        if (!active) return;
        setServiceOptions((payload.item?.items || []).flatMap((item) => item.value
          ? [{ value: item.value, label: item.labels?.ro || item.value }]
          : []));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await adminFetch(`/api/admin/providers/${encodeURIComponent(providerId)}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, baseRateAmount: Number(form.baseRateAmount), confirmedByProvider }),
      });
      if (!response.ok) throw new Error(await readAdminResponseError(response, "Nu am putut salva profilul."));
      setSaved(true);
      setEditing(false);
      setConfirmedByProvider(false);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nu am putut salva profilul.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prezentare publică</CardTitle>
          <CardDescription>Informațiile pe care le văd clienții în aplicație.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <AvatarPreview
              src={avatarPreviewUrl}
              loading={avatarPreviewLoading}
              name={displayName}
            />
            {avatarPreviewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => window.open(avatarPreviewUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                Deschide imaginea
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldValue label="Nume public" value={formatValue(profile.displayName || readString(providerDirectory?.displayName))} />
            <FieldValue label="Categorie" value={formatValue(readString(providerDirectory?.categoryPrimary) || specialization)} />
            <FieldValue label="Localitate" value={locationLabel} />
            <FieldValue label="Zonă" value={formatValue(readString(providerDirectory?.coverageAreaText) || coverageText)} />
            <FieldValue
              label="Tarif"
              value={formatCurrency(
                readNumber(providerDirectory?.baseRateAmount) ?? profile.baseRateAmount,
                readString(providerDirectory?.baseRateCurrency) || profile.baseRateCurrency
              )}
            />
            <FieldValue
              label="Program"
              value={formatValue(readString(providerDirectory?.availabilitySummary) || profile.availabilitySummary)}
            />
            <div className="sm:col-span-2">
              <FieldValue label="Descriere" value={formatValue(profile.shortBio)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {canEditProfile && <Card>
        <CardHeader>
          <CardTitle>Completare asistată</CardTitle>
          <CardDescription>
            Adminul poate introduce datele confirmate de prestator. Documentele, acordurile și aprobarea rămân pași separați.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!editing ? (
            <div className="space-y-3">
              {saved && <p role="status" className="text-sm text-emerald-700">Datele profilului au fost salvate.</p>}
              <Button type="button" variant="outline" onClick={() => { setEditing(true); setError(""); setSaved(false); }}>
                Completează datele profilului
              </Button>
              <p className="text-xs text-muted-foreground">Zona de lucru, serviciile active, programul, poza și actele nu se completează din acest formular.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="provider-business-name" className="text-sm font-medium">Nume firmă / activitate</label>
                  <Input id="provider-business-name" maxLength={120} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="provider-display-name" className="text-sm font-medium">Nume afișat public</label>
                  <Input id="provider-display-name" maxLength={80} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="provider-specialization" className="text-sm font-medium">Categorie de servicii</label>
                  <select id="provider-specialization" value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Alege categoria</option>
                    {form.specialization && !serviceOptions.some((option) => option.value === form.specialization) && <option value={form.specialization}>{form.specialization}</option>}
                    {serviceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="provider-base-rate" className="text-sm font-medium">Tarif de pornire (RON)</label>
                  <Input id="provider-base-rate" type="number" min="1" max="100000" step="0.01" value={form.baseRateAmount} onChange={(event) => setForm({ ...form, baseRateAmount: event.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="provider-short-bio" className="text-sm font-medium">Descriere publică</label>
                  <textarea id="provider-short-bio" maxLength={800} rows={4} value={form.shortBio} onChange={(event) => setForm({ ...form, shortBio: event.target.value })} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={confirmedByProvider} onChange={(event) => setConfirmedByProvider(event.target.checked)} className="mt-1" />
                <span>Prestatorul mi-a comunicat sau a confirmat aceste informații pentru profilul său.</span>
              </label>
              <p className="text-xs text-muted-foreground">Modificarea va fi înregistrată în istoricul administrativ. Nu încarcă acte și nu aprobă prestatorul.</p>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={saveProfile} disabled={saving || !confirmedByProvider}>{saving ? "Se salvează…" : "Salvează datele"}</Button>
                <Button type="button" variant="outline" onClick={() => { setEditing(false); setError(""); }}>Renunță</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}
