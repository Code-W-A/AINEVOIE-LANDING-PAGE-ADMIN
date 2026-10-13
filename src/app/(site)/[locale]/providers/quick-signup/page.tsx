import QuickProviderSignupForm from "./QuickProviderSignupForm";
import { routing } from "@/i18n/routing";
import {
  ROMANIA_COUNTIES,
  ROMANIA_URBAN_LOCALITIES,
} from "@/lib/romaniaLocations";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ service?: string }> };

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function QuickProviderSignupPage({ params, searchParams }: PageProps) {
  const [{ locale }, { service }] = await Promise.all([params, searchParams]);
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const cities = ROMANIA_URBAN_LOCALITIES.map((city) => ({
    countyCode: city.countyCode,
    code: city.cityCode,
    name: city.cityName,
  }));

  return (
    <main className="pt-[140px] pb-20 sm:pt-[160px] sm:pb-24">
      <section className="container max-w-[1180px]">
        <QuickProviderSignupForm counties={ROMANIA_COUNTIES} cities={cities} initialService={service} />
      </section>
    </main>
  );
}
