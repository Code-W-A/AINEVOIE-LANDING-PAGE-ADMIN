import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { listAdminProviderPayoutRequests } from "@/lib/adminPayments";
import { serializeRouteError } from "@/lib/adminRouteError";
import { captureServerException } from "@/lib/sentryServer";

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || undefined;

    console.info("[admin/provider-payout-requests] list start", {
      status: status || "all",
    });

    const items = await listAdminProviderPayoutRequests({
      status: status === "all" ? undefined : status,
      maxRows: 200,
    });

    console.info("[admin/provider-payout-requests] list success", {
      count: items.length,
      status: status || "all",
    });

    return NextResponse.json({ items });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    const debug = serializeRouteError(error, "provider-payout-requests.list");
    captureServerException(error, {
      route: "api/admin/provider-payout-requests/route.ts",
      extra: debug,
    });
    console.error("[admin/provider-payout-requests] list failed", debug);

    return NextResponse.json(
      {
        error: "Nu am putut încărca cererile de payout.",
        debug,
      },
      { status: 500 }
    );
  }
}
