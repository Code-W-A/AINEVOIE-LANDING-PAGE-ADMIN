import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { getMetadataBase } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import MetaPixel from "@/components/analytics/MetaPixel";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "Ainevoie",
  openGraph: {
    type: "website",
    siteName: "Ainevoie",
  },
};

export default async function SiteRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
