import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyProviderMetaConsentToken } from "@/lib/providerMetaConsentToken";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const uid = verifyProviderMetaConsentToken(token);
    if (!uid)
      return NextResponse.json(
        { error: "Invalid consent token" },
        { status: 401 },
      );
    // This capability only revokes consent. It cannot grant consent or modify a profile.
    await getAdminDb().collection("providers").doc(uid).update({
      "metaAcquisition.measurementConsent": false,
      "metaAcquisition.userData": FieldValue.delete(),
      "metaAcquisition.revokedAt": FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ revoked: true });
  } catch {
    return NextResponse.json(
      { error: "Consent update unavailable" },
      { status: 503 },
    );
  }
}
