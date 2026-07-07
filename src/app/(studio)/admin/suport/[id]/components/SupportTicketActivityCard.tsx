"use client";

import {
  buildSupportTicketTimelineEvents,
  type SupportTicketItem,
} from "@/lib/adminSupportTicketDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SupportTicketActivityCard({ item }: { item: SupportTicketItem }) {
  const timelineEvents = buildSupportTicketTimelineEvents(item);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activitate tichet</CardTitle>
        <CardDescription>Evenimentele importante din viața acestui tichet.</CardDescription>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nu există încă activitate înregistrată.</p>
        ) : (
          <div className="space-y-3">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatAdminDateTime(event.at, { includeSeconds: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
