import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin, requireAdminOrSupport } from "@/lib/adminAuth";
import {
  getAdminProviderPayoutRequestDetail,
  updateAdminProviderPayoutRequestNote,
} from "@/lib/adminPayments";
import { captureServerException } from "@/lib/sentryServer";
import { serializeRouteError } from "@/lib/adminRouteError";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function payoutErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "missing_request_id") {
    return NextResponse.json({ error: "ID-ul cererii de payout lipsește." }, { status: 400 });
  }
  if (message === "payout_request_not_found") {
    return NextResponse.json({ error: "Cererea de payout nu există." }, { status: 404 });
  }
  if (message === "payout_request_note_not_allowed") {
    return NextResponse.json({ error: "Nota nu poate fi actualizată pentru acest status." }, { status: 409 });
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminOrSupport(_request);
    const { id } = await context.params;
    const item = await getAdminProviderPayoutRequestDetail(id);

    return NextResponse.json({ item });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    const knownResponse = payoutErrorResponse(error);
    if (knownResponse) {
      return knownResponse;
    }

    const debug = serializeRouteError(error, "provider-payout-requests.detail");
    captureServerException(error, {
      route: "api/admin/provider-payout-requests/[id]/route.ts",
      extra: debug,
    });
    console.error("[admin/provider-payout-requests] detail failed", debug);

    return NextResponse.json(
      {
        error: "Nu am putut încărca detaliul cererii de payout.",
        debug,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const item = await updateAdminProviderPayoutRequestNote({
      requestId: id,
      adminNote: typeof body?.adminNote === "string" ? body.adminNote : "",
      adminUid: admin.uid,
    });

    return NextResponse.json({ item, status: "ok" });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    const knownResponse = payoutErrorResponse(error);
    if (knownResponse) {
      return knownResponse;
    }

    captureServerException(error, {
      route: "api/admin/provider-payout-requests/[id]/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut salva nota pentru cererea de payout." },
      { status: 500 },
    );
  }
}
