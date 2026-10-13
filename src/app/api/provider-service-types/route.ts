import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import { devLogServerError } from "@/lib/devServerErrorLog";
import {
  PROVIDER_SERVICE_TYPES_COLLECTION,
  PROVIDER_SERVICE_TYPES_DOC,
  getDefaultProviderServiceTypeSettings,
  getPublicProviderServiceTypes,
  sanitizeProviderServiceTypeSettings,
} from "@/lib/providerServiceTypes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(PROVIDER_SERVICE_TYPES_COLLECTION)
      .doc(PROVIDER_SERVICE_TYPES_DOC)
      .get();
    const settings = snapshot.exists
      ? sanitizeProviderServiceTypeSettings(snapshot.data())
      : getDefaultProviderServiceTypeSettings();
    const response = NextResponse.json({
      item: {
        items: getPublicProviderServiceTypes(settings),
      },
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    captureServerException(error, {
      route: "api/provider-service-types/route.ts",
    });
    devLogServerError("GET /api/provider-service-types", error);
    return NextResponse.json(
      {
        item: {
          items: getPublicProviderServiceTypes(getDefaultProviderServiceTypeSettings()),
        },
      },
      { status: 200 }
    );
  }
}
