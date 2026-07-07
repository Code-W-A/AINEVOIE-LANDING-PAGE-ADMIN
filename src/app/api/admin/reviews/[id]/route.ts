import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  AdminReviewError,
  deleteAdminReview,
  updateAdminReview,
  type ReviewUpdatePayload,
} from "@/lib/adminReviews";
import { captureServerException } from "@/lib/sentryServer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const reviewId = decodeURIComponent(String(id || "")).trim();
    const body = (await request.json().catch(() => ({}))) as ReviewUpdatePayload;
    const rating = body.rating !== undefined ? Number(body.rating) : undefined;
    const review = body.review !== undefined ? String(body.review || "") : undefined;
    const status = body.status ? String(body.status).trim() : undefined;
    const note = body.note !== undefined ? String(body.note || "") : undefined;

    const item = await updateAdminReview(
      reviewId,
      {
        rating,
        review,
        status: status as ReviewUpdatePayload["status"],
        note,
      },
      { uid: admin.uid }
    );

    return NextResponse.json({
      item,
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/reviews/[id]/route.ts:PATCH" });
    return NextResponse.json(
      { error: "Nu am putut actualiza review-ul." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const reviewId = decodeURIComponent(String(id || "")).trim();
    const result = await deleteAdminReview(reviewId, { uid: admin.uid });

    return NextResponse.json({
      ok: true,
      reviewId: result.reviewId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    if (error instanceof AdminReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    captureServerException(error, { route: "api/admin/reviews/[id]/route.ts:DELETE" });
    return NextResponse.json(
      { error: "Nu am putut șterge review-ul." },
      { status: 500 }
    );
  }
}
