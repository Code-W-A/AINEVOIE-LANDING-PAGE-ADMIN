"use client";

import Link from "next/link";
import { humanAdminLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatSupportTicketRoleLabel } from "@/lib/adminSupportTicketLabels";
import {
  getSupportTicketRequesterHref,
  hasSupportTicketRelatedEntities,
  type SupportTicketItem,
} from "@/lib/adminSupportTicketDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

export function SupportTicketSidebar({ item }: { item: SupportTicketItem }) {
  const requesterHref = getSupportTicketRequesterHref(item);
  const requesterLabel = item.requesterRole === "provider"
    ? humanProviderLabel({
      displayName: item.requester.displayName,
      email: item.requester.email,
    })
    : humanUserLabel({
      displayName: item.requester.displayName,
      email: item.requester.email,
    });

  const assigneeLabel = item.assignedAdminUid
    ? humanAdminLabel({
      displayName: item.assignedAdminSnapshot?.displayName,
      email: item.assignedAdminSnapshot?.email,
    })
    : null;

  const hasRelated = hasSupportTicketRelatedEntities(item);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Solicitant</CardTitle>
          <CardDescription>Cine a deschis tichetul.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FieldValue label="Nume" value={requesterLabel} />
          <FieldValue label="Rol" value={formatSupportTicketRoleLabel(item.requester.role)} />
          {requesterHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={requesterHref}>Vezi profil</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsabil</CardTitle>
          <CardDescription>Cine gestionează tichetul în admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {assigneeLabel ? (
            <FieldValue label="Admin" value={assigneeLabel} />
          ) : (
            <p className="text-sm text-muted-foreground">Neasignat</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entități asociate</CardTitle>
          <CardDescription>Legături către programare, prestator sau utilizator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasRelated ? (
            <p className="text-sm text-muted-foreground">
              Nu există încă o legătură asociată acestui tichet.
            </p>
          ) : (
            <>
              {item.relatedEntity?.bookingId ? (
                <div className="space-y-2">
                  <FieldValue
                    label="Programare"
                    value={item.relatedBooking?.status
                      ? `${item.relatedEntity.bookingId} · ${item.relatedBooking.status}`
                      : item.relatedEntity.bookingId}
                  />
                  {item.relatedBooking?.scheduledStartAt ? (
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDateTime(item.relatedBooking.scheduledStartAt)}
                    </p>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/programari/${encodeURIComponent(item.relatedEntity.bookingId)}`}>
                      Vezi programarea
                    </Link>
                  </Button>
                </div>
              ) : null}

              {item.relatedEntity?.providerId ? (
                <div className="space-y-2">
                  <FieldValue
                    label="Prestator"
                    value={humanProviderLabel({
                      displayName: item.relatedProvider?.displayName,
                      email: item.relatedProvider?.email,
                    })}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/prestatori/${encodeURIComponent(item.relatedEntity.providerId)}`}>
                      Vezi prestatorul
                    </Link>
                  </Button>
                </div>
              ) : null}

              {item.relatedEntity?.userId ? (
                <div className="space-y-2">
                  <FieldValue
                    label="Utilizator"
                    value={humanUserLabel({
                      displayName: item.relatedUser?.displayName,
                      email: item.relatedUser?.email,
                    })}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/utilizatori/${encodeURIComponent(item.relatedEntity.userId)}`}>
                      Vezi utilizatorul
                    </Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
