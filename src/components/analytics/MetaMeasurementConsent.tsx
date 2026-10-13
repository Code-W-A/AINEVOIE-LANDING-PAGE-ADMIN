"use client";

import { useEffect, useState } from "react";
import {
  retryProviderConsentRevocation,
  setMetaMeasurementConsent,
  useMetaMeasurementConsent,
} from "@/lib/metaMeasurementConsent";

export default function MetaMeasurementConsent({ locale }: { locale: string }) {
  const choice = useMetaMeasurementConsent();
  const [editing, setEditing] = useState(false);
  const ro = locale !== "en";
  useEffect(() => {
    if (choice === "denied") void retryProviderConsentRevocation();
  }, [choice]);
  if (choice !== "unknown" && !editing)
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="fixed bottom-3 left-3 z-50 rounded-lg border bg-white px-3 py-2 text-xs text-black shadow dark:bg-slate-900 dark:text-white"
      >
        {ro ? "Preferințe de măsurare" : "Measurement preferences"}
      </button>
    );
  return (
    <aside
      aria-label={ro ? "Măsurarea reclamelor" : "Ad measurement"}
      className="fixed right-3 bottom-3 left-3 z-50 max-w-lg rounded-2xl border bg-white p-5 text-sm text-black shadow-lg dark:bg-slate-900 dark:text-white"
    >
      <p>
        {ro
          ? "Cu acordul tău, folosim Meta Pixel și Conversions API pentru a măsura reclamele și înscrierile. Poți refuza și te poți înscrie în continuare. Această alegere este separată de newsletter."
          : "With your permission, we use Meta Pixel and Conversions API to measure ads and signups. You can decline and still sign up. This choice is separate from the newsletter."}
      </p>
      <a
        href={ro ? "/privacy" : "/en/privacy"}
        className="mt-2 inline-block underline"
      >
        {ro ? "Politica de confidențialitate" : "Privacy policy"}
      </a>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => {
            setMetaMeasurementConsent(false);
            setEditing(false);
          }}
        >
          {ro ? "Refuz" : "Decline"}
        </button>
        <button
          type="button"
          className="bg-primary rounded-lg px-4 py-2 text-white"
          onClick={() => {
            setMetaMeasurementConsent(true);
            setEditing(false);
          }}
        >
          {ro ? "Accept măsurarea" : "Allow measurement"}
        </button>
      </div>
    </aside>
  );
}
