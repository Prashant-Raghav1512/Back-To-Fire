// Server-side mirrors of caps that used to be enforced client-side only
// (src/lib/community.ts's BLOCKED_WORDS, src/lib/imageUpload.ts /
// videoUpload.ts's size gates) — a client that skips the app's own JS
// entirely could previously skip these too, since the only real gate was
// whichever code happened to run in the browser.

export const BLOCKED_WORDS = ['fuck', 'bitch', 'bastard', 'asshole', 'chutiya', 'madarchod', 'behenchod'];

export function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

// Generous ceilings above the client's own compressed-output caps (image
// ~900,000 base64 chars, video ~8MB input -> ~11.2MB base64 chars) to leave
// room for the data-URI prefix and encoding overhead without allowing
// arbitrarily large payloads from a client that bypasses compression.
export const MAX_IMAGE_DATA_URL_CHARS = 1_000_000;
export const MAX_VIDEO_DATA_URL_CHARS = 12_000_000;

export function isNonEmptyString(v: unknown, maxLength: number): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLength;
}

export function isOptionalString(v: unknown, maxLength: number): v is string | undefined {
  return v === undefined || v === null || (typeof v === 'string' && v.length <= maxLength);
}

export function isOneOf<T extends string>(v: unknown, options: readonly T[]): v is T {
  return typeof v === 'string' && (options as readonly string[]).includes(v);
}

export function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}
