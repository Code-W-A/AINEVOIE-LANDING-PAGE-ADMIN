"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatBookingAmount,
  formatCompactValue,
  formatBookingPaymentStatusLabel,
  getPaymentStatusVariant,
  type PaymentDocument,
} from "@/lib/adminBookingDetail";

export function BookingPaymentTab({ payment }: { payment: PaymentDocument | null }) {
  if (!payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plată</CardTitle>
          <CardDescription>Nu există informații de plată pentru această programare.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const status = String(payment.status || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plată</CardTitle>
        <CardDescription>Sumarul plății asociate programării.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldValue label={payment.paymentFlowProfile === 'offer_advance_v1' ? 'Avans în aplicație' : 'Total'} value={formatBookingAmount(payment)} />
        {payment.paymentFlowProfile === 'offer_advance_v1' && <>
          <FieldValue label="Total ofertă" value={`${payment.offerTotal} ${payment.currency}`} />
          <FieldValue label="De achitat direct prestatorului" value={`${payment.remainingAmount} ${payment.currency}`} />
          <FieldValue label="Comision platformă" value={`${payment.platformFeeAmount} ${payment.currency}`} />
          <FieldValue label="De virat prestatorului din avans" value="0" />
        </>}
        <FieldValue
          label="Status plată"
          value={<Badge variant={getPaymentStatusVariant(status)}>{formatBookingPaymentStatusLabel(status)}</Badge>}
        />
        <FieldValue label="Metodă" value={formatCompactValue(payment.method)} />
        <FieldValue label="Procesator" value={formatCompactValue(payment.processor)} />
      </CardContent>
    </Card>
  );
}
