// Goes through the data API Worker (see cloudflare-worker-data/) rather
// than connecting to Neon directly from the browser — the real database
// credential lives server-side now. See cloudflare-worker-data/README.md.
const API_URL = import.meta.env.VITE_DATA_API_URL;

export type ContactPurpose = 'Membership' | 'Program' | 'Event' | 'Others';

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  purpose: ContactPurpose;
  /** Only meaningful (and only ever sent) when purpose is 'Others'. */
  purposeDetail: string;
  message: string;
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  if (!API_URL) {
    throw new Error('Contact form is not configured (VITE_DATA_API_URL is unset).');
  }

  const res = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim() || undefined,
      purpose: payload.purpose,
      purposeDetail: payload.purpose === 'Others' ? payload.purposeDetail.trim() || undefined : undefined,
      message: payload.message.trim(),
    }),
  });

  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Request failed with status ${res.status}`);
  }
}
