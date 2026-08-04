import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db';
import { withCors } from './_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rows = await sql`
      SELECT id, title, duration, difficulty, description, features, icon
      FROM programs
      ORDER BY sort_order ASC
    `;
    res.status(200).json(rows);
  } catch (err) {
    console.error('Failed to fetch programs', err);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
}
