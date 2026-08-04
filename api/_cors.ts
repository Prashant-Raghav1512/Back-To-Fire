import type { VercelResponse } from '@vercel/node';

// Restrict this to your GitHub Pages origin in production via the
// ALLOWED_ORIGIN env var, e.g. https://<username>.github.io
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';

export function withCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}
