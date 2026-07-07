"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SupportTicketItem } from "@/lib/adminSupportTicketDetail";

export function SupportTicketProblemCard({ item }: { item: SupportTicketItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Problema raportată</CardTitle>
        <CardDescription>Ce a semnalat solicitantul și contextul inițial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Subiect</p>
          <p className="text-sm font-semibold">{item.subject || "-"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mesaj</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {item.initialMessage || "Nu există mesaj inițial."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
