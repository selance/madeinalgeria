/**
 * Opt-in tokens for the newsletter. The raw token travels only in the emailed
 * link; the DB stores its SHA-256, so a leaked DB dump can't confirm or
 * unsubscribe anyone. One token per subscriber serves both the confirm link and
 * the unsubscribe link, and is never rotated — unsubscribe links printed in old
 * newsletter mail have to keep working.
 */

const TOKEN_BYTES = 32;

export function mintToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Unsubscribe signature for bulk mail.
 *
 * Campaign recipients are addresses an admin pasted in — they may have no row
 * anywhere, so there is no stored token to hand them. Signing the address itself
 * gives every recipient a working unsubscribe link with no extra state, and the
 * HMAC stops anyone unsubscribing a third party by editing the query string.
 */
async function unsubscribeKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function signEmail(email: string, secret: string): Promise<string> {
  const key = await unsubscribeKey(secret);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  // base64url — it has to survive a query string untouched.
  return btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function verifyEmailSignature(
  email: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected = await signEmail(email, secret);
  if (expected.length !== signature.length) return false;
  // Constant-time-ish: compare every char, never short-circuit.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
