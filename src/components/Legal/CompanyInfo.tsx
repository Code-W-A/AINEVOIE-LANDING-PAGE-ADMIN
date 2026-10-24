"use client";

import React from "react";
import companyInfo from "@/config/companyInfo.json";
import { useTranslations } from "next-intl";

export default function CompanyInfo() {
  const t = useTranslations("CompanyInfo");

  return (
    <section aria-label={t("title")} className="text-body text-sm leading-relaxed">
      <h3 className="mb-2 font-semibold text-black dark:text-white">{t("title")}</h3>
      <p className="mb-2">{t("operator")}</p>
      <dl className="space-y-2">
        {Object.entries(companyInfo).map(([field, value]) => (
          <div key={field} className="break-words">
            <dt className="font-medium text-black dark:text-white">{t(field)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
