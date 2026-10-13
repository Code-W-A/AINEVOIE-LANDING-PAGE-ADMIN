"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import services from "@/lib/launchServiceCatalog.json";

const illustrations: Record<string, string> = {
  Instalator: "pipeline-maintenance",
  Electrician: "electrician",
  "Curatenie Menaj": "cleaning-service",
  "Renovari Si Meseriasi": "construction-worker",
  "Mutari Si Transport": "moving",
  "Bone Si Ingrijire Persoane": "family",
  Beauty: "hairdresser",
};

export default function LaunchServices() {
  const locale = useLocale() === "en" ? "en" : "ro";
  const ro = locale === "ro";

  return (
    <section
      id="services"
      className="container py-12 md:py-16"
      aria-labelledby="launch-services-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="launch-services-title"
          className="text-3xl font-bold tracking-tight text-black dark:text-white"
        >
          {ro
            ? "7 domenii de servicii pentru început"
            : "7 service categories to start with"}
        </h2>
        <p className="text-body mt-4 leading-relaxed dark:text-slate-300">
          {ro
            ? "Construim rețeaua de prestatori Ainevoie. Disponibilitatea fiecărui serviciu depinde de prestatorii verificați din zona ta."
            : "We are building the Ainevoie provider network. Each service depends on verified providers available in your area."}
        </p>
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-4 md:mt-10 md:gap-5">
        {services.map((item) => (
          <li
            key={item.value}
            className="w-full min-[360px]:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
          >
            <Link
              href={{
                pathname: "/providers/quick-signup",
                query: { service: item.value },
              }}
              aria-label={`${item.labels[locale]} — ${ro ? "Înscrie-te ca prestator" : "Join as a provider"}`}
              className="group border-stroke hover:border-primary focus-visible:border-primary dark:border-stroke-dark dark:hover:border-primary flex h-full flex-col rounded-3xl border bg-white p-4 shadow-[0_4px_20px_rgba(44,62,80,0.04)] transition-[border-color,box-shadow] hover:shadow-[0_10px_30px_rgba(211,84,0,0.1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 md:p-5 dark:bg-slate-800"
            >
              <div className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-orange-50 to-orange-50/20 py-3 md:py-4 dark:from-slate-700 dark:to-slate-700/30">
                <Image
                  src={`/images/services/storyset/${illustrations[item.value]}.svg`}
                  alt=""
                  width={150}
                  height={150}
                  className="h-[110px] w-[110px] object-contain md:h-[150px] md:w-[150px]"
                />
              </div>
              <h3 className="mt-4 text-base leading-snug font-semibold text-black md:text-lg dark:text-white">
                {item.labels[locale]}
              </h3>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {item.descriptions[locale]}
              </p>
              <span className="text-primary mt-auto flex items-center justify-between gap-2 border-t border-orange-100 pt-3 text-xs font-semibold md:text-sm dark:border-slate-700 dark:text-orange-300">
                {ro ? "Ofer acest serviciu" : "I offer this service"}
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <a
          href="https://storyset.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          {ro ? "Ilustrații de Storyset" : "Illustrations by Storyset"}
        </a>
      </p>
    </section>
  );
}
