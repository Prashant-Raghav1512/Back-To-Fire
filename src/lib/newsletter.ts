import { neon } from '@neondatabase/serverless';

// SECURITY NOTE: same browser-exposed connection as the contact form
// (src/lib/contact.ts) — see that file's SECURITY NOTE for why a separate
// role wouldn't add real access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(email: string): Promise<void> {
  if (!connectionString) {
    throw new Error('Newsletter signup is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new Error('Please enter a valid email address.');
  }

  const sql = neon(connectionString);
  await sql`
    INSERT INTO newsletter_subscribers (email)
    VALUES (${trimmed})
    ON CONFLICT (email) DO NOTHING
  `;
}
