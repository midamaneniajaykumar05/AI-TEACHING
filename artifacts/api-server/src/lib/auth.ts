import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const JWT_SECRET = process.env["SESSION_SECRET"];
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but not set.");
}
const ALGORITHM = "sha256";

// ---------------------------------------------------------------------------
// Password hashing (scrypt)
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(
  stored: string,
  supplied: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashed, "hex");
  if (buf.length !== storedBuf.length) return false;
  return timingSafeEqual(buf, storedBuf);
}

// ---------------------------------------------------------------------------
// JWT (HS256) — minimal implementation using Node.js crypto
// ---------------------------------------------------------------------------

function base64url(input: string | Buffer): string {
  const b64 = Buffer.isBuffer(input)
    ? input.toString("base64")
    : Buffer.from(input).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export interface JwtPayload {
  sub: number; // user id
  username: string;
  iat: number;
  exp: number;
}

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS }),
  );
  const sig = base64url(
    createHmac(ALGORITHM, JWT_SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = base64url(
      createHmac(ALGORITHM, JWT_SECRET).update(`${header}.${body}`).digest(),
    );
    if (sig !== expected) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
