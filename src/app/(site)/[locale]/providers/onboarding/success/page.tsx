import { Link } from "@/i18n/navigation";
import AppStoreLinks from "@/components/AppStoreLinks";
import { routing } from "@/i18n/routing";
import { CheckCircle2, CircleHelp, MailCheck, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export default async function ProviderOnboardingSuccessPage({
  params,
}: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ProviderSuccess" });

  const nextSteps = [
    {
      title: t("s1t"),
      description: t("s1d"),
      Icon: MailCheck,
    },
    {
      title: t("s2t"),
      description: t("s2d"),
      Icon: ShieldCheck,
    },
    {
      title: t("s3t"),
      description: t("s3d"),
      Icon: CheckCircle2,
    },
  ];

  return (
    <main className="pt-[120px] pb-24 sm:pt-[160px]">
      <section className="container max-w-[1100px]">
        <div className="shadow-card dark:bg-dark dark:shadow-card-dark mx-auto max-w-[820px] rounded-2xl bg-white p-5 text-center sm:p-10">
          <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-5 sm:h-16 sm:w-16">
            <CheckCircle2 className="text-primary h-7 w-7 sm:h-10 sm:w-10" />
          </div>
          <span className="text-primary mb-2 block text-base font-medium sm:mb-3 sm:text-lg">
            {t("badge")}
          </span>
          <h1 className="mb-3 text-2xl font-bold text-black sm:mb-4 sm:text-4xl dark:text-white">
            {t("title")}
          </h1>
          <p className="text-body mx-auto max-w-[680px] text-sm leading-6 sm:text-base">
            {t("intro")}
          </p>
          <div className="border-primary/20 bg-primary/5 mx-auto mt-5 max-w-[660px] rounded-xl border px-4 py-4 sm:mt-7 sm:px-6 sm:py-5">
            <h2 className="text-lg font-semibold text-black sm:text-xl dark:text-white">
              {t("downloadTitle")}
            </h2>
            <p className="text-body mx-auto mt-2 max-w-[560px] text-sm leading-5 sm:leading-6">
              {t("downloadDescription")}
            </p>
            <AppStoreLinks
              androidLabel={t("downloadAndroid")}
              iosLabel={t("downloadIos")}
              className="mt-3 justify-center sm:mt-4"
            />
            <p className="text-body mx-auto mt-2 max-w-[560px] text-sm sm:mt-3">
              {t("downloadStatusHint")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {nextSteps.map((step) => (
            <article
              key={step.title}
              className="shadow-card dark:bg-dark dark:shadow-card-dark rounded-2xl bg-white p-6"
            >
              <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                <step.Icon className="text-primary h-5 w-5" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
                {step.title}
              </h2>
              <p className="text-body text-sm">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="shadow-card dark:bg-dark dark:shadow-card-dark mt-8 rounded-2xl bg-white p-6">
          <div className="flex flex-wrap items-start gap-3">
            <CircleHelp className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">
                {t("helpTitle")}
              </h3>
              <p className="text-body text-sm">
                {t("helpBefore")}{" "}
                <a
                  href="mailto:contact@ai-nevoie.ro"
                  className="text-primary hover:underline"
                >
                  contact@ai-nevoie.ro
                </a>
                {t("helpAfter")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white"
          >
            {t("backHome")}
          </Link>
          <Link
            href="/providers/onboarding/form"
            className="border-stroke dark:border-stroke-dark hover:border-primary inline-flex rounded-md border px-6 py-3 text-sm font-medium text-black dark:text-white"
          >
            {t("registerAnother")}
          </Link>
        </div>
      </section>
    </main>
  );
}
