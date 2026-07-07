"use client";

import { CheckCircle2, Save } from "lucide-react";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import {
  formatSupportTicketEntityTypeLabel,
  formatSupportTicketPriorityLabel,
  formatSupportTicketStatusLabel,
} from "@/lib/adminSupportTicketLabels";
import {
  isSupportTicketClosed,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  type TicketDraft,
} from "@/lib/adminSupportTicketDetail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SupportTicketUpdateCard({
  draft,
  pending,
  ticketStatus,
  onDraftChange,
  onSave,
  onMarkResolved,
}: {
  draft: TicketDraft;
  pending: boolean;
  ticketStatus: string;
  onDraftChange: (updater: (current: TicketDraft) => TicketDraft) => void;
  onSave: () => void;
  onMarkResolved: () => void;
}) {
  const showMarkResolved = !isSupportTicketClosed(ticketStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizează tichet</CardTitle>
        <CardDescription>Modifică statusul, responsabilul sau legăturile asociate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Status</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.status}
              disabled={pending}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, status: event.target.value }))
              }
            >
              {SUPPORT_TICKET_STATUSES.map((nextStatus) => (
                <option key={nextStatus} value={nextStatus}>
                  {formatSupportTicketStatusLabel(nextStatus)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Prioritate</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.priority}
              disabled={pending}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, priority: event.target.value }))
              }
            >
              {SUPPORT_TICKET_PRIORITIES.map((nextPriority) => (
                <option key={nextPriority} value={nextPriority}>
                  {formatSupportTicketPriorityLabel(nextPriority)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="ticket-assignee" className="space-y-1.5 text-sm scroll-mt-24">
          <span className="font-medium">Responsabil</span>
          <AdminEntityLookup
            value={draft.assignedAdminUid}
            entityType="admin"
            disabled={pending}
            placeholder="Admin responsabil"
            onValueChange={(nextValue) =>
              onDraftChange((current) => ({ ...current, assignedAdminUid: nextValue }))
            }
          />
        </div>

        <div id="ticket-related-entity" className="space-y-1.5 text-sm scroll-mt-24">
          <span className="font-medium">Entitate asociată</span>
          <div className="grid gap-2 md:grid-cols-[200px_minmax(0,1fr)]">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={draft.relatedEntityType}
              disabled={pending}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  relatedEntityType: event.target.value as "booking" | "provider" | "user",
                  relatedEntityId: "",
                }))
              }
            >
              <option value="booking">Programare</option>
              <option value="provider">Prestator</option>
              <option value="user">Utilizator</option>
            </select>

            <AdminEntityLookup
              value={draft.relatedEntityId}
              entityType={draft.relatedEntityType}
              disabled={pending}
              placeholder={`Selectează ${formatSupportTicketEntityTypeLabel(draft.relatedEntityType).toLowerCase()}`}
              onValueChange={(nextValue) =>
                onDraftChange((current) => ({ ...current, relatedEntityId: nextValue }))
              }
            />
          </div>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Notă internă</span>
          <textarea
            className="min-h-[96px] w-full rounded-md border border-input bg-background p-3 text-sm"
            value={draft.adminNote}
            placeholder="Adaugă context pentru echipa de suport"
            disabled={pending}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, adminNote: event.target.value }))
            }
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Se salvează..." : "Salvează modificările"}
          </Button>
          {showMarkResolved ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onMarkResolved}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marchează ca rezolvat
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
