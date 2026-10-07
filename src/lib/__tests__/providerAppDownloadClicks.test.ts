import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProviderAppDownloadClicks } from "@/app/(studio)/admin/prestatori/[id]/components/ProviderAppDownloadClicks";

describe("admin provider app clicks", () => {
  it("shows both platforms with no historical clicks for existing accounts", () => {
    const html = renderToStaticMarkup(createElement(ProviderAppDownloadClicks, { provider: {} }));
    expect(html).toContain("Android · Google Play");
    expect(html).toContain("iPhone · App Store");
    expect(html.match(/Fără apăsări înregistrate/g)).toHaveLength(2);
  });
  it("shows the count and the last click in Bucharest time", () => {
    const html = renderToStaticMarkup(createElement(ProviderAppDownloadClicks, { provider: {
      appDownloadClicks: { android: { count: 2, lastClickedAt: "2026-10-07T09:15:00.000Z" } },
    } }));
    expect(html).toContain("Apăsări: 2");
    expect(html).toContain("12:15");
    expect(html).toContain("Instalarea aplicației nu este confirmată");
    expect(html.match(/Fără apăsări înregistrate/g)).toHaveLength(1);
  });
});
