import QuickProviderSignupForm from "./QuickProviderSignupForm";
import { routing } from "@/i18n/routing";
import { getCitiesByCounty } from "@/lib/romaniaLocations";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function QuickProviderSignupPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const cities = getCitiesByCounty("BH").map((city) => ({
    code: city.cityCode,
    name: city.cityName,
  }));

  return (
    <main className="pb-20 pt-[140px] sm:pb-24 sm:pt-[160px]">
      <section className="container max-w-[1180px]">
        <QuickProviderSignupForm cities={cities} />
      </section>
    </main>
  );
}
