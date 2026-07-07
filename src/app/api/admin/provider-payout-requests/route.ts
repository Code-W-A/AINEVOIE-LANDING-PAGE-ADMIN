import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdminOrSupport } from "@/lib/adminAuth";
import { listAdminProviderPayoutRequests } from "@/lib/adminPayments";
import { serializeRouteError } from "@/lib/adminRouteError";
import { captureServerException } from "@/lib/sentryServer";

function readPositiveNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}

export async function GET(request: Request) {
  try {
    await requireAdminOrSupport(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || undefined;
    const providerId = searchParams.get("providerId")?.trim() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const page = readPositiveNumber(searchParams.get("page"), 1, 10_000);
    const pageSize = readPositiveNumber(searchParams.get("pageSize"), 5, 100);

    console.info("[admin/provider-payout-requests] list start", {
      status: status || "all",
      providerId: providerId || null,
      q: q || null,
      page,
      pageSize,
    });

    const allItems = await listAdminProviderPayoutRequests({
      status: status === "all" ? undefined : status,
      providerId,
      q,
      maxRows: 200,
    });

    const total = allItems.length;
    const start = (page - 1) * pageSize;
    const items = allItems.slice(start, start + pageSize);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    console.info("[admin/provider-payout-requests] list success", {
      count: items.length,
      total,
      status: status || "all",
    });

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
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
