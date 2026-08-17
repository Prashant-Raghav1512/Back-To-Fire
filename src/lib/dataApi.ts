// Shared fetch helpers for the data API Worker (see cloudflare-worker-data/)
// — every src/lib/*.ts file that used to connect to Neon directly from the
// browser now goes through this Worker instead. `authedFetch` attaches the
// visitor's real Clerk session token (see useAuth().getToken() at each call
// site) so the Worker can verify identity server-side rather than trusting
// a client-supplied clerkUserId.
export const DATA_API_URL = import.meta.env.VITE_DATA_API_URL;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!DATA_API_URL) {
    throw new Error('This feature is not configured (VITE_DATA_API_URL is unset).');
  }
  const res = await fetch(`${DATA_API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  return handle<T>(res);
}

export async function authedFetch<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  if (!token) throw new Error('You need to be signed in for this.');
  return apiFetch<T>(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  });
}
