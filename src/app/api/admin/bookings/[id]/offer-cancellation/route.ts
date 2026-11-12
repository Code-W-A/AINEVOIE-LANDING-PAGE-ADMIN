import { NextResponse } from "next/server";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/adminAuth";
import { callAdminCallable, AdminCallableError } from "@/lib/adminCallables";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const { decision, reason } = await request.json();
    return NextResponse.json(
      await callAdminCallable(
        "resolveBookingOfferCancellation",
        { bookingId: id, decision, reason },
        "Decizia nu a putut fi salvată.",
        admin.idToken,
      ),
    );
  } catch (error) {
    const auth = adminAuthErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eroare la salvare." },
      { status: error instanceof AdminCallableError ? error.status : 500 },
    );
  }
}
