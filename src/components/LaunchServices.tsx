"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Hammer,
  HeartHandshake,
  Scissors,
  Sparkles,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ProviderServiceTypeItem } from "@/lib/providerServiceTypes";

const icons = {
  Hammer,
  HeartHandshake,
  Scissors,
  Sparkles,
  Truck,
  Wrench,
  Zap,
};

export default function LaunchServices() {
  const locale = useLocale() === "en" ? "en" : "ro";
  const [services, setServices] = useState<ProviderServiceTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    async function load() {
      try {
        const response = await fetch("/api/provider-service-types", {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Service catalog unavailable");
        const data = await response.json();
        if (!Array.isArray(data?.item?.items))
          throw new Error("Invalid service catalog");
        if (!controller.signal.aborted) setServices(data.item.items);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  const [selected, setSelected] = useState<string | null>(null);
  const service = services.find((item) => item.value === selected);
  const ro = locale === "ro";

  return (
    <section
      id="services"
      className="container py-16"
      aria-labelledby="launch-services-title"
    >
      <h2
        id="launch-services-title"
        className="text-center text-3xl font-bold text-black dark:text-white"
      >
        {ro
          ? `${!loading && !error ? `${services.length} ` : ""}domenii de servicii pentru început`
          : `${!loading && !error ? `${services.length} ` : ""}service categories to start with`}
      </h2>
      <p className="text-body mx-auto mt-4 max-w-2xl text-center">
        {ro
          ? "Construim rețeaua de prestatori Ainevoie. Disponibilitatea fiecărui serviciu depinde de prestatorii verificați din zona ta."
          : "We are building the Ainevoie provider network. Each service depends on verified providers available in your area."}
      </p>
      {loading ? (
        <p role="status" className="text-body mt-8 text-center">
          {ro ? "Se încarcă serviciile…" : "Loading services…"}
        </p>
      ) : error ? (
        <div role="alert" className="text-body mt-8 text-center">
          <p>
            {ro
              ? "Nu am putut încărca serviciile."
              : "We could not load the services."}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="text-primary mt-3 rounded px-3 py-2 font-semibold focus-visible:outline-2"
          >
            {ro ? "Reîncearcă" : "Try again"}
          </button>
        </div>
      ) : services.length === 0 ? (
        <p className="text-body mt-8 text-center">
          {ro
            ? "Momentan nu sunt categorii de servicii disponibile."
            : "No service categories are currently available."}
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {services.map((item) => {
              const Icon = icons[item.icon as keyof typeof icons] || Wrench;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected === item.value}
                  aria-controls="launch-service-details"
                  onClick={() => setSelected(item.value)}
                  className="border-stroke hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary/5 dark:border-stroke-dark flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center text-sm font-semibold text-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 dark:text-white"
                >
                  <Icon className="text-primary h-6 w-6" aria-hidden="true" />
                  {item.labels[locale]}
                </button>
              );
            })}
          </div>
          <div
            id="launch-service-details"
            aria-live="polite"
            className="bg-primary/5 mt-6 rounded-2xl p-6 text-center"
          >
            {service ? (
              <>
                <h3 className="font-semibold text-black dark:text-white">
                  {service.labels[locale]}
                </h3>
                <p className="text-body mt-2">
                  {service.descriptions?.[locale]}
                </p>
                <p className="text-body mt-2 text-sm">
                  {ro
                    ? "Domeniu planificat pentru lansare. Alegerea categoriei nu creează o rezervare și nu confirmă disponibilitatea unui prestator."
                    : "Planned launch category. Selecting it does not create a booking or confirm provider availability."}
                </p>
                <Link
                  href={{
                    pathname: "/providers/quick-signup",
                    query: { service: service.value },
                  }}
                  className="bg-primary hover:bg-primary/90 mt-4 inline-flex rounded-lg px-5 py-3 font-semibold text-white"
                >
                  {ro
                    ? "Ofer acest serviciu · Înscrie-mă ca prestator"
                    : "I offer this service · Join as a provider"}
                </Link>
              </>
            ) : (
              <p className="text-body">
                {ro
                  ? "Alege un domeniu pentru a vedea exemplele de servicii."
                  : "Select a category to see examples of services."}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
