import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db';
import { withCors } from './_cors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, message } = (req.body ?? {}) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ error: 'Name, email, and message are all required' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    res.status(400).json({ error: 'One or more fields is too long' });
    return;
  }

  try {
    await sql`
      INSERT INTO contact_submissions (name, email, message)
      VALUES (${name.trim()}, ${email.trim()}, ${message.trim()})
    `;
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to save contact submission', err);
    res.status(500).json({ error: 'Failed to save your message' });
  }
}
