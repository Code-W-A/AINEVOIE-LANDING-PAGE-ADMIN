import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/adminAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import { devLogServerError } from "@/lib/devServerErrorLog";
import {
  PROVIDER_SERVICE_TYPES_COLLECTION,
  PROVIDER_SERVICE_TYPES_DOC,
  getDefaultProviderServiceTypeSettings,
  sanitizeProviderServiceTypeSettings,
  validateProviderServiceTypeSettings,
} from "@/lib/providerServiceTypes";

export const dynamic = "force-dynamic";

async function loadSettings() {
  const db = getAdminDb();
  const snapshot = await db
    .collection(PROVIDER_SERVICE_TYPES_COLLECTION)
    .doc(PROVIDER_SERVICE_TYPES_DOC)
    .get();

  return snapshot.exists
    ? sanitizeProviderServiceTypeSettings(snapshot.data())
    : getDefaultProviderServiceTypeSettings();
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const item = await loadSettings();

    return NextResponse.json({
      item,
      defaults: getDefaultProviderServiceTypeSettings(),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/provider-service-types/route.ts",
    });
    devLogServerError("GET /api/admin/provider-service-types", error);
    return NextResponse.json(
      { error: "Nu am putut încărca tipurile de servicii." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const item = sanitizeProviderServiceTypeSettings(body);
    const validationError = validateProviderServiceTypeSettings(item);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const db = getAdminDb();
    await db
      .collection(PROVIDER_SERVICE_TYPES_COLLECTION)
      .doc(PROVIDER_SERVICE_TYPES_DOC)
      .set(
        {
          ...item,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({
      item,
      defaults: getDefaultProviderServiceTypeSettings(),
      status: "ok",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) {
      return authResponse;
    }

    captureServerException(error, {
      route: "api/admin/provider-service-types/route.ts",
    });
    devLogServerError("PUT /api/admin/provider-service-types", error);
    return NextResponse.json(
      { error: "Nu am putut salva tipurile de servicii." },
      { status: 500 }
    );
  }
}
