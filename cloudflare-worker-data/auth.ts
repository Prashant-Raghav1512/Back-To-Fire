import { verifyToken } from '@clerk/backend';
import type { Env } from './env';

// Verifies the visitor's real Clerk session token and returns the verified
// user id (the JWT's `sub` claim) — never trust a clerkUserId the client
// sends in a request body/query string for anything this can supply.
// `authorizedParties` ties verification to this site's actual origins, so a
// token issued for a different Clerk-configured app can't be replayed here.
export async function verifyAuth(request: Request, env: Env, allowedOrigins: string[]): Promise<string | null> {
  const header = request.headers.get('Authorization');
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: allowedOrigins,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
