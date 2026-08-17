// Goes through the data API Worker (see cloudflare-worker-data/) rather
// than connecting to Neon directly from the browser.
const API_URL = import.meta.env.VITE_DATA_API_URL;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(email: string): Promise<void> {
  if (!API_URL) {
    throw new Error('Newsletter signup is not configured (VITE_DATA_API_URL is unset).');
  }
  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new Error('Please enter a valid email address.');
  }

  const res = await fetch(`${API_URL}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmed }),
  });

  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Request failed with status ${res.status}`);
  }
}
