import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderDocument } from "@/lib/adminProviderDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function ProviderAppDownloadClicks({ provider }: { provider: ProviderDocument }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Butoane aplicație mobilă</CardTitle>
        <CardDescription>Apăsări pe pagina de final a înscrierii rapide. Instalarea aplicației nu este confirmată.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {(["android", "ios"] as const).map((platform) => {
          const stats = provider.appDownloadClicks?.[platform];
          const count = stats?.count ?? 0;
          return (
            <div key={platform} className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{platform === "android" ? "Android · Google Play" : "iPhone · App Store"}</p>
              {count > 0 ? (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Apăsări: {count}</p>
                  <p>Ultima apăsare: {formatAdminDateTime(stats?.lastClickedAt)}</p>
                </div>
              ) : <p className="mt-2 text-sm text-muted-foreground">Fără apăsări înregistrate</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
