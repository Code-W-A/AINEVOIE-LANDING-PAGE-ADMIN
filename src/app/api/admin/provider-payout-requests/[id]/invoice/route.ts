import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { getProviderPayoutInvoiceStorage } from "@/lib/adminPayments";
import { getAdminStorageBucket } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeFileName(value: string | null, requestId: string) {
  const base = (value || `factura-${requestId}`).replace(/[^\w.\-]+/g, "-");
  return `${base.replace(/^-+|-+$/g, "") || "factura"}.pdf`;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdminOrSupport(request);
    const { id } = await context.params;
    const invoice = await getProviderPayoutInvoiceStorage(id);
    const file = getAdminStorageBucket().file(invoice.storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      return NextResponse.json({ error: "Fișierul facturii nu există." }, { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const stream = Readable.toWeb(file.createReadStream());

    return new Response(stream as ReadableStream, {
      headers: {
        "Content-Type": metadata.contentType || "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName(invoice.displayNumber, id)}"`,
        "Cache-Control": "private, no-store",
        ...(metadata.size ? { "Content-Length": String(metadata.size) } : {}),
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "";
    if (message === "payout_request_not_found") {
      return NextResponse.json({ error: "Cererea de payout nu există." }, { status: 404 });
    }
    if (message === "payout_invoice_not_ready") {
      return NextResponse.json({ error: "Factura nu este pregătită pentru descărcare." }, { status: 409 });
    }

    captureServerException(error, {
      route: "api/admin/provider-payout-requests/[id]/invoice/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut descărca factura." },
      { status: 500 },
    );
  }
}
