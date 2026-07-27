import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "curllab-super-secret-key-12345";

export interface SessionData {
  username: string;
  createdAt: number;
}

export function createSessionToken(username: string): string {
  const payload: SessionData = { username, createdAt: Date.now() };
  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("hex");
  return `${Buffer.from(payloadStr).toString("base64")}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;
    const payloadStr = Buffer.from(payloadBase64, "base64").toString("utf8");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("hex");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr) as SessionData;
    // Expire after 7 days
    if (Date.now() - payload.createdAt > 7 * 24 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
