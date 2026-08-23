export type CipherPayload = {
  url: string;
  codename: string;
  briefing: string;
  createdAt: number;
  expiresAt: number | null;
  burnAfterReveal: boolean;
};

export type CipherEnvelope = {
  v: 1;
  mode: "key" | "code";
  iv: string;
  salt?: string;
  key?: string;
  data: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PBKDF2_ITERATIONS = 310_000;
const MAX_TOKEN_LENGTH = 24_000;
const MAX_URL_LENGTH = 4_096;

function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeEnvelope(envelope: CipherEnvelope) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(envelope)));
}

export function parseEnvelope(token: string): CipherEnvelope {
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    throw new Error("Invalid Cipher envelope size");
  }

  const raw = decoder.decode(base64UrlToBytes(token));
  const parsed = JSON.parse(raw) as Partial<CipherEnvelope>;

  if (
    parsed.v !== 1 ||
    (parsed.mode !== "key" && parsed.mode !== "code") ||
    typeof parsed.iv !== "string" ||
    typeof parsed.data !== "string" ||
    parsed.iv.length > 64 ||
    parsed.data.length > MAX_TOKEN_LENGTH
  ) {
    throw new Error("Invalid Cipher envelope");
  }

  if (parsed.mode === "key" && (typeof parsed.key !== "string" || parsed.key.length > 64)) {
    throw new Error("Missing embedded key");
  }

  if (parsed.mode === "code" && (typeof parsed.salt !== "string" || parsed.salt.length > 64)) {
    throw new Error("Missing derivation salt");
  }

  return parsed as CipherEnvelope;
}

async function importAesKey(raw: Uint8Array) {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function deriveKey(passcode: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealPayload(payload: CipherPayload, passcode: string) {
  const iv = randomBytes(12);
  const normalizedPasscode = passcode.trim();
  let envelope: CipherEnvelope;
  let key: CryptoKey;

  if (normalizedPasscode) {
    const salt = randomBytes(16);
    key = await deriveKey(normalizedPasscode, salt);
    envelope = {
      v: 1,
      mode: "code",
      iv: bytesToBase64Url(iv),
      salt: bytesToBase64Url(salt),
      data: "",
    };
  } else {
    const rawKey = randomBytes(32);
    key = await importAesKey(rawKey);
    envelope = {
      v: 1,
      mode: "key",
      iv: bytesToBase64Url(iv),
      key: bytesToBase64Url(rawKey),
      data: "",
    };
  }

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  envelope.data = bytesToBase64Url(new Uint8Array(encrypted));
  return encodeEnvelope(envelope);
}

export async function openPayload(token: string, passcode = "") {
  const envelope = parseEnvelope(token);
  const iv = base64UrlToBytes(envelope.iv);
  const encrypted = base64UrlToBytes(envelope.data);
  let key: CryptoKey;

  if (envelope.mode === "code") {
    if (!passcode.trim() || !envelope.salt) throw new Error("Access code required");
    key = await deriveKey(passcode.trim(), base64UrlToBytes(envelope.salt));
  } else {
    if (!envelope.key) throw new Error("Missing embedded key");
    key = await importAesKey(base64UrlToBytes(envelope.key));
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  const payload = JSON.parse(decoder.decode(decrypted)) as Partial<CipherPayload>;
  if (
    typeof payload.url !== "string" ||
    payload.url.length > MAX_URL_LENGTH ||
    !validateHttpUrl(payload.url) ||
    typeof payload.codename !== "string" ||
    payload.codename.length > 28 ||
    typeof payload.briefing !== "string" ||
    payload.briefing.length > 240 ||
    typeof payload.createdAt !== "number" ||
    (payload.expiresAt !== null && typeof payload.expiresAt !== "number") ||
    typeof payload.burnAfterReveal !== "boolean"
  ) {
    throw new Error("Invalid Cipher payload");
  }

  return payload as CipherPayload;
}

export async function fingerprintToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bytesToBase64Url(new Uint8Array(digest)).slice(0, 24);
}

export function validateHttpUrl(value: string) {
  if (!value || value.length > MAX_URL_LENGTH) return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function hostFromUrl(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "classified";
  }
}
