import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function createProviderAppClickToken(uid: string): string | undefined {
  const secret = process.env.PROVIDER_APP_CLICK_SECRET;
  if (!secret) return undefined;
  const payload = Buffer.from(JSON.stringify({
    uid,
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
    sessionId: randomUUID(),
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyProviderAppClickToken(token: unknown): string | null {
  const secret = process.env.PROVIDER_APP_CLICK_SECRET;
  if (!secret || typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;
  const expected = createHmac("sha256", secret).update(parts[0]).digest();
  const signature = Buffer.from(parts[1], "base64url");
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (typeof payload.uid !== "string" || !payload.uid || payload.uid.includes("/") ||
        typeof payload.expiresAt !== "number" || !Number.isFinite(payload.expiresAt) ||
        payload.expiresAt <= Date.now()) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
