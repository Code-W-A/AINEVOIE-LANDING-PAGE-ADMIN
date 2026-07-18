import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { retryProviderPayoutInvoice } from "@/lib/adminPayments";
import { captureServerException } from "@/lib/sentryServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const item = await retryProviderPayoutInvoice({
      requestId: id,
      adminUid: admin.uid,
    });
    return NextResponse.json({ item, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "";
    if (message === "payout_request_not_found") {
      return NextResponse.json({ error: "Cererea de payout nu există." }, { status: 404 });
    }
    if (message === "payout_invoice_not_failed") {
      return NextResponse.json(
        { error: "Doar o factură eșuată poate fi retrimisă." },
        { status: 409 },
      );
    }

    captureServerException(error, {
      route: "api/admin/provider-payout-requests/[id]/invoice/retry/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut reîncerca generarea facturii." },
      { status: 500 },
    );
  }
}
