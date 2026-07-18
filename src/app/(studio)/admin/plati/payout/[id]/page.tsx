"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Copy, Download, RefreshCw, Save } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { useAdminData } from "@/components/admin/useAdminData";
import { humanProviderLabel } from "@/lib/adminHumanize";
import {
  formatPayoutRequestLinkLabel,
  formatPayoutRequestShortId,
} from "@/lib/adminPaymentLabels";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import type {
  ProviderPayoutDetailsAdminItem,
  ProviderPayoutRequestDetailAdminItem,
} from "@/lib/adminPayments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderPayoutRequestDetailResponse = {
  item?: ProviderPayoutRequestDetailAdminItem;
};

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function payoutBadgeVariant(status?: string | null) {
  if (status === "paid") return "success";
  if (status === "requested") return "warning";
  return "outline";
}

function formatMoneyValue(amount: number, currency = "RON") {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency || "RON",
  }).format(amount);
}

function infoRow(labelValue: string, value: string) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{labelValue}</p>
      <p className="mt-1 break-words text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

function payoutDetailsSourceLabel(source: ProviderPayoutDetailsAdminItem["source"]) {
  if (source === "snapshot") return "Snapshot la cerere";
  if (source === "live_provider") return "Date live din profilul prestatorului";
  return "Indisponibile";
}

export default function AdminProviderPayoutRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = decodeURIComponent(params.id || "");
  const endpoint = useMemo(
    () => `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}`,
    [requestId],
  );
  const { data, loading, error, reload } = useAdminData<ProviderPayoutRequestDetailResponse>(endpoint);
  const item = data?.item;

  const [adminNote, setAdminNote] = useState("");
  const [pendingSaveNote, setPendingSaveNote] = useState(false);
  const [pendingMarkPaid, setPendingMarkPaid] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }
    setAdminNote(item.adminNote || "");
  }, [item]);

  async function handleCopyIban(value: string | null) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage("IBAN copiat.");
    } catch {
      setCopyMessage("Nu am putut copia IBAN-ul.");
    }
  }

  async function handleSaveNote() {
    if (!requestId) {
      return;
    }

    setPendingSaveNote(true);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNote }),
        },
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut salva nota."));
      }

      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut salva nota.");
    } finally {
      setPendingSaveNote(false);
    }
  }

  async function handleMarkPaid() {
    if (!requestId) {
      return;
    }

    setPendingMarkPaid(true);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNote }),
        },
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut marca payout-ul ca plătit."));
      }

      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut marca payout-ul ca plătit.");
    } finally {
      setPendingMarkPaid(false);
    }
  }

  async function handleDownloadInvoice() {
    if (!requestId || !item) return;
    setPendingInvoice(true);
    setActionError(null);
    try {
      const response = await adminFetch(
        `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}/invoice`,
      );
      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut descărca factura."));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${item.invoice.displayNumber || `factura-${requestId}`}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut descărca factura.");
    } finally {
      setPendingInvoice(false);
    }
  }

  async function handleRetryInvoice() {
    if (!requestId) return;
    setPendingInvoice(true);
    setActionError(null);
    try {
      const response = await adminFetch(
        `/api/admin/provider-payout-requests/${encodeURIComponent(requestId)}/invoice/retry`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut reîncerca factura."));
      }
      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut reîncerca factura.");
    } finally {
      setPendingInvoice(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminTableSkeleton rows={4} columns={2} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/admin/plati">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la plăți
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-rose-500">
            {error || "Cererea de payout nu a fost găsită."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const payoutDetails = item.payoutDetails;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/plati">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la plăți
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {formatPayoutRequestLinkLabel({
                  providerNetAmount: item.providerNetAmount,
                  currency: item.currency,
                  requestedAtLabel: formatAdminDateTime(item.requestedAt, { includeSeconds: true }),
                })}
              </h1>
              <Badge variant={payoutBadgeVariant(item.status)}>{label(item.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cerere payout provider · {item.paymentIds.length} plăți incluse · ID {formatPayoutRequestShortId(item.requestId)}
            </p>
          </div>
        </div>
        {item.providerId ? (
          <Button asChild variant="outline">
            <Link href={`/admin/prestatori/${encodeURIComponent(item.providerId)}`}>
              Deschide profilul prestatorului
            </Link>
          </Button>
        ) : null}
      </div>

      {actionError ? <p className="text-sm text-rose-500">{actionError}</p> : null}
      {copyMessage ? <p className="text-sm text-muted-foreground">{copyMessage}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Date bancare</CardTitle>
            <CardDescription>
              {payoutDetailsSourceLabel(payoutDetails.source)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!payoutDetails.isComplete ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Datele bancare sunt incomplete. Verifică profilul prestatorului înainte de transfer.
              </p>
            ) : null}
            {infoRow("Titular cont", payoutDetails.accountHolderName || "-")}
            {infoRow("Bancă", payoutDetails.bankName || "-")}
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">IBAN</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="break-all text-sm font-medium">{payoutDetails.iban || "-"}</p>
                {payoutDetails.iban ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => { void handleCopyIban(payoutDetails.iban); }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiază
                  </Button>
                ) : null}
              </div>
            </div>
            {infoRow(
              "Actualizat la",
              formatAdminDateTime(payoutDetails.updatedAt, { includeSeconds: true }),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sumar financiar</CardTitle>
            <CardDescription>
              Suma de transferat către {humanProviderLabel({
                displayName: item.provider.displayName,
                email: item.provider.email,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {infoRow("Brut", formatMoneyValue(item.grossAmount, item.currency))}
            {infoRow("Comision platformă", formatMoneyValue(item.platformFeeAmount, item.currency))}
            {infoRow("Net provider", formatMoneyValue(item.providerNetAmount, item.currency))}
            {infoRow("Monedă", item.currency)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factură payout</CardTitle>
          <CardDescription>
            Documentul fiscal generat din snapshot-urile păstrate la momentul cererii.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infoRow("Număr", item.invoice.displayNumber || "-")}
            {infoRow("Status", label(item.invoice.status))}
            {infoRow("Emisă la", formatAdminDateTime(item.invoice.issuedAt, { includeSeconds: true }))}
            {infoRow("Total", formatMoneyValue(item.invoice.totalAmount, item.currency))}
            {infoRow("Net", formatMoneyValue(item.invoice.netAmount, item.currency))}
            {infoRow("TVA", formatMoneyValue(item.invoice.vatAmount, item.currency))}
            {infoRow("Cotă TVA", `${item.invoice.vatRate || 0}%`)}
          </div>
          {item.invoice.error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {item.invoice.error}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {item.invoice.issuer ? (
              <div className="rounded-md border p-3 text-sm">
                <p className="mb-2 font-semibold">Emitent (snapshot)</p>
                <p>{item.invoice.issuer.legalName || "-"}</p>
                <p>CUI: {item.invoice.issuer.cui || "-"}</p>
                <p>Registru: {item.invoice.issuer.tradeRegister || "-"}</p>
                <p>{item.invoice.issuer.fiscalAddress || "-"}</p>
              </div>
            ) : null}
            {item.invoice.buyer ? (
              <div className="rounded-md border p-3 text-sm">
                <p className="mb-2 font-semibold">Cumpărător (snapshot)</p>
                <p>{item.invoice.buyer.legalName || "-"}</p>
                <p>CUI: {item.invoice.buyer.cui || "-"}</p>
                <p>Registru: {item.invoice.buyer.tradeRegister || "-"}</p>
                <p>{item.invoice.buyer.fiscalAddress || "-"}</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {item.invoice.status === "ready" ? (
              <Button
                type="button"
                variant="outline"
                disabled={pendingInvoice}
                onClick={() => { void handleDownloadInvoice(); }}
              >
                <Download className="mr-2 h-4 w-4" />
                Descarcă PDF
              </Button>
            ) : null}
            {item.invoice.status === "failed" ? (
              <Button
                type="button"
                variant="outline"
                disabled={pendingInvoice}
                onClick={() => { void handleRetryInvoice(); }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reîncearcă generarea
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plăți incluse</CardTitle>
          <CardDescription>Plățile care fac parte din această cerere de payout.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plată</TableHead>
                <TableHead>Programare</TableHead>
                <TableHead>Status plată</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.payments.map((payment) => (
                <TableRow key={payment.paymentId}>
                  <TableCell className="font-medium">{payment.paymentId}</TableCell>
                  <TableCell>
                    {payment.bookingId ? (
                      <Link
                        href={`/admin/programari/${encodeURIComponent(payment.bookingId)}`}
                        className="underline underline-offset-2"
                      >
                        {payment.bookingId}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{label(payment.status)}</TableCell>
                  <TableCell>{label(payment.providerPayoutStatus)}</TableCell>
                  <TableCell>{formatMoneyValue(payment.providerNetAmount, payment.currency)}</TableCell>
                </TableRow>
              ))}
              {!item.payments.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Nu există plăți asociate acestei cereri.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Acțiuni admin</CardTitle>
            <CardDescription>Salvează note interne sau marchează transferul ca efectuat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-note" className="text-sm font-medium">Notă admin</label>
              <textarea
                id="admin-note"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adminNote}
                disabled={pendingSaveNote || pendingMarkPaid}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Ex: transfer efectuat din contul companiei, referință bancară..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pendingSaveNote || pendingMarkPaid}
                onClick={() => { void handleSaveNote(); }}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvează nota
              </Button>
              {item.status === "requested" ? (
                <Button
                  type="button"
                  disabled={pendingSaveNote || pendingMarkPaid || item.invoice.status !== "ready"}
                  onClick={() => { void handleMarkPaid(); }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marchează plătit
                </Button>
              ) : null}
            </div>
            {item.status === "requested" && item.invoice.status !== "ready" ? (
              <p className="text-xs text-amber-700">
                Payout-ul poate fi marcat plătit numai după ce factura este gata.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Istoric</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {infoRow("Solicitat la", formatAdminDateTime(item.requestedAt, { includeSeconds: true }))}
            {infoRow("Plătit la", formatAdminDateTime(item.paidAt, { includeSeconds: true }))}
            {infoRow("Admin uid", item.paidByAdminUid || "-")}
            {infoRow("Creat la", formatAdminDateTime(item.createdAt, { includeSeconds: true }))}
            {infoRow("Actualizat la", formatAdminDateTime(item.updatedAt, { includeSeconds: true }))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
