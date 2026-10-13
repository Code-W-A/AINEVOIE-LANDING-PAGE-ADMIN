import { createHmac, timingSafeEqual } from "node:crypto";

const PURPOSE = "provider-meta-consent-v1";
export function createProviderMetaConsentToken(uid: string) {
  const secret = process.env.PROVIDER_APP_CLICK_SECRET;
  if (!secret) return undefined;
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      purpose: PURPOSE,
      expiresAt: Date.now() + 15552000000,
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(`${PURPOSE}:${payload}`).digest("base64url")}`;
}

export function verifyProviderMetaConsentToken(token: unknown) {
  const secret = process.env.PROVIDER_APP_CLICK_SECRET;
  if (!secret || typeof token !== "string" || token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret)
    .update(`${PURPOSE}:${payload}`)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.purpose === PURPOSE &&
      typeof data.uid === "string" &&
      data.uid &&
      !data.uid.includes("/") &&
      typeof data.expiresAt === "number" &&
      data.expiresAt > Date.now()
      ? (data.uid as string)
      : null;
  } catch {
    return null;
  }
}
