"use client";
import { useState } from "react";
import {
  adminFetch,
  readAdminResponseError,
} from "@/components/admin/adminApi";
import { Button } from "@/components/ui/button";
import type { BookingDocument } from "@/lib/adminBookingDetail";
export function BookingOfferSummary({ booking }: { booking: BookingDocument }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resolved, setResolved] = useState(false);
  if (booking.paymentFlowProfile !== "offer_advance_v1") return null;
  const offer = booking.offer;
  async function decide(decision: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await adminFetch(
        `/api/admin/bookings/${encodeURIComponent(booking.bookingId || "")}/offer-cancellation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, reason }),
        },
      );
      if (!res.ok)
        throw new Error(
          await readAdminResponseError(res, "Decizia nu a putut fi salvată."),
        );
      setResolved(true);
      setMessage(
        "Decizia a fost salvată. Reîncarcă programarea pentru starea actualizată a plății.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Eroare la salvare.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="col-span-full space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Ofertă cu avans</h3>
      {offer ? (
        <>
          <p>{offer.description}</p>
          <p>
            Total: {offer.offerTotal} RON · Avans: {offer.advanceAmount} RON ·
            Direct prestatorului: {offer.remainingAmount} RON
          </p>
          <p>
            Versiunea {offer.version} · {{ sent: "Trimisă", accepted: "Acceptată", declined: "Refuzată" }[offer.status as "sent" | "accepted" | "declined"] || offer.status}
          </p>
        </>
      ) : (
        <p>Se așteaptă oferta prestatorului.</p>
      )}
      {booking.offerOperationalAlert && (
        <p role="alert" className="rounded border border-amber-500 p-3">
          Necesită intervenție: {({ refund_failed: "Rambursare eșuată — verifică motivul în Stripe înainte de orice nouă rambursare.", refund_stuck: "Rambursare în așteptare de peste 30 de minute.", payment_unresolved: "Plată neclarificată după expirarea rezervării.", reconciliation_failed: "Verificarea automată a plății a eșuat.", cancellation_review: "Solicitare de anulare de analizat." } as Record<string, string>)[booking.offerOperationalAlert.code] || booking.offerOperationalAlert.code}
        </p>
      )}
      {booking.refundSummary && <p role="status">Rambursare: {({ required: "Se reîncearcă automat", processing: "În procesare", failed: "Eșuată — necesită intervenție", refunded: "Finalizată" } as Record<string, string>)[booking.refundSummary.status || ""] || "În verificare"}{booking.refundSummary.stripeRefundId ? ` · ${booking.refundSummary.stripeRefundId}` : ""}</p>}
      <details>
        <summary>Procedură pentru neprezentare, lucrare incompletă sau extrauri contestate</summary>
        <p>Verifică oferta acceptată, ora programată și istoricul. Cere ambelor părți descrierea situației și dovezi prin ticketul de suport asociat. Înregistrează concluzia și motivul în dosarul programării.</p>
        <p>Înainte de ora programată: anularea rambursează integral avansul. După această oră: administratorul decide explicit. Nu considera diferența directă încasată doar pentru că lucrarea a fost finalizată. Extraurile nu modifică oferta acceptată sau comisionul.</p>
        <p>Pentru o rambursare eșuată verifică tranzacția în Stripe; nu repeta o rambursare cât timp cea existentă este în procesare. Sesizarea singură nu declanșează rambursare.</p>
      </details>
      {booking.cancellationRequest?.status === "pending_admin" && !resolved && (
        <>
          <p>
            Anulare solicitată după ora programată:{" "}
            {booking.cancellationRequest.reason}
          </p>
          <label className="block">
            Motivul deciziei
            <input
              className="block w-full rounded border p-2"
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !reason.trim()}
              onClick={() => decide("refund")}
            >
              Anulează și rambursează integral
            </Button>
            <Button
              variant="outline"
              disabled={busy || !reason.trim()}
              onClick={() => decide("retain")}
            >
              Anulează fără rambursare
            </Button>
            <Button
              variant="outline"
              disabled={busy || !reason.trim()}
              onClick={() => decide("reject")}
            >
              Respinge anularea
            </Button>
          </div>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
