import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { AdminCallableError, callAdminCallable } from "@/lib/adminCallables";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await callAdminCallable(
      "adminUpdateProviderProfile",
      { ...body, providerId: decodeURIComponent(String(id || "")).trim() },
      "Nu am putut salva profilul prestatorului.",
      admin.idToken
    );
    return NextResponse.json(result);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof AdminCallableError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    captureServerException(error, { route: "api/admin/providers/[id]/profile/route.ts" });
    return NextResponse.json({ error: "Nu am putut salva profilul prestatorului." }, { status: 500 });
  }
}
