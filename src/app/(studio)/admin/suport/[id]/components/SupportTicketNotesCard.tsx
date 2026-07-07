"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SupportTicketNotesCard({ adminNote }: { adminNote: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notițe interne</CardTitle>
        <CardDescription>Informații pentru echipa de suport, invizibile solicitantului.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{adminNote}</p>
      </CardContent>
    </Card>
  );
}
