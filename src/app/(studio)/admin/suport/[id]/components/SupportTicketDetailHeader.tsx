"use client";

import Link from "next/link";
import { ChevronLeft, Link2, UserRound, CheckCircle2 } from "lucide-react";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import {
  formatSupportTicketPriorityLabel,
  formatSupportTicketRoleLabel,
  formatSupportTicketSlaAge,
  formatSupportTicketStatusLabel,
  formatSupportTicketTopicLabel,
} from "@/lib/adminSupportTicketLabels";
import {
  isSupportTicketClosed,
  scrollToTicketSection,
  supportTicketPriorityVariant,
  supportTicketStatusVariant,
  type SupportTicketItem,
} from "@/lib/adminSupportTicketDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SupportTicketDetailHeader({
  item,
  pending,
  onMarkResolved,
}: {
  item: SupportTicketItem;
  pending: boolean;
  onMarkResolved: () => void;
}) {
  const requesterLabel = item.requesterRole === "provider"
    ? humanProviderLabel({
      displayName: item.requester.displayName,
      email: item.requester.email,
    })
    : humanUserLabel({
      displayName: item.requester.displayName,
      email: item.requester.email,
    });

  return (
    <Card>
      <CardContent className="p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/suport">
            <ChevronLeft className="h-4 w-4" />
            Înapoi la suport
          </Link>
        </Button>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Tichet: {item.subject || item.ticketId}
              </h1>
              <Badge variant={supportTicketStatusVariant(item.status)}>
                {formatSupportTicketStatusLabel(item.status)}
              </Badge>
              <Badge variant={supportTicketPriorityVariant(item.priority)}>
                {formatSupportTicketPriorityLabel(item.priority)}
              </Badge>
              <Badge variant="outline">{formatSupportTicketTopicLabel(item.topic)}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {formatSupportTicketTopicLabel(item.topic)}
              {" · "}
              {formatSupportTicketRoleLabel(item.requester.role)}
              {" · "}
              Solicitant: {requesterLabel}
              {" · "}
              Creat {formatAdminDateTime(item.createdAt, { includeSeconds: true })}
              {" · "}
              SLA {formatSupportTicketSlaAge(item.slaAgeMinutes)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToTicketSection("ticket-assignee")}
            >
              <UserRound className="h-4 w-4" />
              Atribuie responsabil
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToTicketSection("ticket-related-entity")}
            >
              <Link2 className="h-4 w-4" />
              Leagă entitate
            </Button>
            {!isSupportTicketClosed(item.status) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={onMarkResolved}
              >
                <CheckCircle2 className="h-4 w-4" />
                Marchează rezolvat
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
