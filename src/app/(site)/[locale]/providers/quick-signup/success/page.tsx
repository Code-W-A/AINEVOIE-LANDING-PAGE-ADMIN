import AppStoreLinks from "@/components/AppStoreLinks";
import ProviderAppPreview from "@/components/ProviderAppPreview";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function QuickProviderSignupSuccessPage({
  params,
}: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: "QuickProviderSignupSuccess",
  });
  const benefits = [
    { label: t("benefitRequests"), Icon: BriefcaseBusiness },
    { label: t("benefitSchedule"), Icon: CalendarCheck2 },
    { label: t("benefitStatus"), Icon: BadgeCheck },
  ];

  return (
    <main className="pt-[140px] pb-24 sm:pt-[160px]">
      <section className="container max-w-[1040px]">
        <div className="shadow-card dark:bg-dark dark:shadow-card-dark relative overflow-hidden rounded-3xl bg-white px-5 py-6 sm:px-10 sm:py-12 lg:px-14">
          <div className="bg-primary/[0.08] pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl" />
          <div className="relative text-center">
            <div className="bg-primary/10 text-primary mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t("badge")}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-black sm:mt-5 sm:text-4xl dark:text-white">
              {t("title")}
            </h1>
            <p className="text-body mx-auto mt-3 max-w-[680px] text-sm leading-6 sm:text-base sm:leading-7">
              {t("description")}
            </p>
          </div>

          <div className="relative mt-6 grid items-center gap-8 sm:mt-8 lg:mt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="text-center lg:text-left">
              <span className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                {t("appEyebrow")}
              </span>
              <h2 className="mt-2 text-xl font-bold text-black sm:mt-3 sm:text-3xl dark:text-white">
                {t("appTitle")}
              </h2>
              <p className="text-body mt-2 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-7">
                {t("appDescription")}
              </p>

              <ul
                className="mt-5 grid gap-2.5 text-left sm:mt-6 sm:gap-3"
                aria-label={t("benefitsLabel")}
              >
                {benefits.map(({ label, Icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 text-sm font-medium text-black dark:text-white"
                  >
                    <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              <p className="text-primary mt-5 text-sm font-semibold sm:mt-7">
                {t("downloadHint")}
              </p>
              <AppStoreLinks
                androidLabel={t("downloadAndroid")}
                iosLabel={t("downloadIos")}
                featured
                className="mt-3"
              />
              <p className="text-body mt-4 text-xs leading-5">
                {t("activationNote")}
              </p>
            </div>

            <div className="mx-auto w-full max-w-[380px] lg:max-w-none">
              <ProviderAppPreview
                locale={locale as "ro" | "en"}
                variant="duo"
                labels={{
                  requests: t("previewRequests"),
                  calendar: t("previewCalendar"),
                  reviews: t("previewReviews"),
                }}
              />
            </div>
          </div>

          <div className="relative mt-8 border-t border-slate-100 pt-6 text-center dark:border-white/10">
            <Link
              href="/"
              className="text-body hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("backHome")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
