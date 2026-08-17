import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  const email = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).email : undefined;
  if (typeof email !== 'string') return errorResponse('Invalid request shape.', headers);

  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > 200) {
    return errorResponse('Please enter a valid email address.', headers);
  }

  const sql = db(env);
  await sql`INSERT INTO newsletter_subscribers (email) VALUES (${trimmed}) ON CONFLICT (email) DO NOTHING`;
  return json({ ok: true }, headers);
}
