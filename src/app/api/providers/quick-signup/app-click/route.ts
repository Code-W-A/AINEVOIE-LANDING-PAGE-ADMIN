import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyProviderAppClickToken } from "@/lib/providerAppClickToken";
import { captureServerException } from "@/lib/sentryServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || (body.platform !== "android" && body.platform !== "ios") ||
      typeof body.eventId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.eventId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const uid = verifyProviderAppClickToken(body.token);
  if (!uid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

  try {
    const db = getAdminDb();
    const providerRef = db.collection("providers").doc(uid);
    const eventRef = providerRef.collection("appDownloadClickEvents").doc(body.eventId.toLowerCase());
    const result = await db.runTransaction(async (transaction) => {
      const [provider, event] = await Promise.all([
        transaction.get(providerRef),
        transaction.get(eventRef),
      ]);
      if (!provider.exists) return "missing";
      if (event.exists) return "duplicate";
      const platform = body.platform as "android" | "ios";
      const stats = provider.get(`appDownloadClicks.${platform}`);
      const now = FieldValue.serverTimestamp();
      transaction.update(providerRef, {
        [`appDownloadClicks.${platform}.count`]: FieldValue.increment(1),
        [`appDownloadClicks.${platform}.firstClickedAt`]: stats?.firstClickedAt ?? now,
        [`appDownloadClicks.${platform}.lastClickedAt`]: now,
      });
      transaction.create(eventRef, { platform, createdAt: now });
      return "recorded";
    });
    if (result === "missing") return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    return NextResponse.json({ status: result });
  } catch (error) {
    captureServerException(error, { route: "api/providers/quick-signup/app-click" });
    return NextResponse.json({ error: "Could not record click" }, { status: 500 });
  }
}
