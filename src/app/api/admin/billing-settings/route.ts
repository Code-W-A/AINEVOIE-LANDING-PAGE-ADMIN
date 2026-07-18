import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import {
  BILLING_SETTINGS_COLLECTION,
  BILLING_SETTINGS_DOC,
  getDefaultBillingSettings,
  sanitizeBillingSettings,
  validateBillingSettings,
} from "@/lib/billingSettings";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";

export const dynamic = "force-dynamic";

async function loadBillingSettings() {
  const snapshot = await getAdminDb()
    .collection(BILLING_SETTINGS_COLLECTION)
    .doc(BILLING_SETTINGS_DOC)
    .get();

  return snapshot.exists
    ? sanitizeBillingSettings(snapshot.data())
    : getDefaultBillingSettings();
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({
      item: await loadBillingSettings(),
      defaults: getDefaultBillingSettings(),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    captureServerException(error, {
      route: "api/admin/billing-settings/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut încărca setările de facturare." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const item = sanitizeBillingSettings(await request.json());
    const validationError = validateBillingSettings(item);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await getAdminDb()
      .collection(BILLING_SETTINGS_COLLECTION)
      .doc(BILLING_SETTINGS_DOC)
      .set({
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: admin.uid,
      }, { merge: true });

    return NextResponse.json({
      item,
      defaults: getDefaultBillingSettings(),
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    captureServerException(error, {
      route: "api/admin/billing-settings/route.ts",
    });
    return NextResponse.json(
      { error: "Nu am putut salva setările de facturare." },
      { status: 500 },
    );
  }
}
