import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import CompanyInfo from "../components/Legal/CompanyInfo";
import ro from "../../messages/ro.json";
import en from "../../messages/en.json";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import companyInfo from "./companyInfo.json";

describe("public company identification", () => {
  it("matches the mobile configuration", () => {
    const mobile = JSON.parse(readFileSync(path.resolve(process.cwd(), "../expo-mobile-app/src/features/shared/config/companyInfo.json"), "utf8"));
    expect(companyInfo).toEqual(mobile);
  });

  it.each(["ro", "en"])("identifies the same operator in the %s terms", (locale) => {
    const text = readFileSync(path.resolve(process.cwd(), `content/legal/${locale}/terms.md`), "utf8");
    for (const value of Object.values(companyInfo)) expect(text).toContain(value);
    expect(text).not.toMatch(/Până la publicarea|Until full company details|CAEN 7020/);
  });
});

describe("translated company information", () => {
  it.each(["ro", "en"] as const)("renders localized labels and official values in %s", (locale) => {
    const messages = locale === "ro" ? ro : en;
    const providerProps = {
      locale, messages, timeZone: "Europe/Bucharest", children: React.createElement(CompanyInfo),
    };
    const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, providerProps));
    for (const value of Object.values(companyInfo)) expect(html).toContain(value);
    for (const label of Object.values(messages.CompanyInfo)) expect(html).toContain(label);
  });
});
