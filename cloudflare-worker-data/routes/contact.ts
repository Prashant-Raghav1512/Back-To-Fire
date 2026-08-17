import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString, isOneOf, isOptionalString } from '../validate';

const PURPOSES = ['Membership', 'Program', 'Event', 'Others'] as const;

interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  purpose: (typeof PURPOSES)[number];
  purposeDetail?: string;
  message: string;
}

function isContactBody(body: unknown): body is ContactBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.name, 200) &&
    isNonEmptyString(b.email, 200) &&
    isOptionalString(b.phone, 40) &&
    isOneOf(b.purpose, PURPOSES) &&
    isOptionalString(b.purposeDetail, 500) &&
    isNonEmptyString(b.message, 5000)
  );
}

export async function submitContact(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isContactBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO contact_submissions (name, email, phone, purpose, purpose_detail, message)
    VALUES (
      ${body.name.trim()},
      ${body.email.trim()},
      ${body.phone?.trim() || null},
      ${body.purpose},
      ${body.purpose === 'Others' ? body.purposeDetail?.trim() || null : null},
      ${body.message.trim()}
    )
  `;
  return json({ ok: true }, headers);
}
