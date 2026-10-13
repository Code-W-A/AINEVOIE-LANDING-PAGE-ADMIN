import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderDocument } from "@/lib/adminProviderDetail";

export function ProviderAcquisition({
  provider,
}: {
  provider: ProviderDocument;
}) {
  const campaign = provider.campaignAttribution;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sursa înscrierii și calificarea</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Sursă: {provider.source || "Necunoscută"}</p>
        <p>
          Campanie: {campaign?.utm_campaign || "Fără atribuire înregistrată"}
        </p>
        <p>
          Canal:{" "}
          {[campaign?.utm_source, campaign?.utm_medium]
            .filter(Boolean)
            .join(" / ") || "Necunoscut"}
        </p>
        {campaign?.utm_content && (
          <p>Variantă reclamă: {campaign.utm_content}</p>
        )}
        <p>
          Profil trimis la verificare:{" "}
          {provider.reviewState?.submittedAt ? "Da" : "Nu"}
        </p>
        <p>Prestator aprobat: {provider.status === "approved" ? "Da" : "Nu"}</p>
        <p className="text-muted-foreground">
          Acord pentru măsurarea Meta la înscriere:{" "}
          {provider.metaAcquisition?.measurementConsent === true
            ? "Acceptat"
            : "Neacordat"}
          . Atribuirea unei campanii nu confirmă livrarea evenimentului către
          Meta.
        </p>
      </CardContent>
    </Card>
  );
}
