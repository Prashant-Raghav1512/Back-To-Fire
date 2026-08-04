/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Neon connection string used directly from the browser to insert contact
   * form submissions. This is intentionally public (baked into the client
   * bundle) — see src/lib/contact.ts for why, and what that means.
   */
  readonly VITE_NEON_CONTACT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
