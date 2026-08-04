import { neon } from '@neondatabase/serverless';

// SECURITY NOTE: this connection string is shipped in the client bundle and
// is visible to anyone who opens devtools. Neon's connection proxy only
// authenticates roles created through its own control plane, and every such
// role is automatically a member of `neon_superuser` (full read/write/DDL on
// the whole database) — there is no way on this Neon project to scope a
// browser-connectable role down to insert-only. This was a deliberate,
// informed tradeoff, not an oversight: anyone can read or delete everything
// in this database via this credential.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  if (!connectionString) {
    throw new Error('Contact form is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  const sql = neon(connectionString);
  await sql`
    INSERT INTO contact_submissions (name, email, message)
    VALUES (${payload.name.trim()}, ${payload.email.trim()}, ${payload.message.trim()})
  `;
}
