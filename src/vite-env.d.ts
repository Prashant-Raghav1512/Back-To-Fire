/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Neon connection string used directly from the browser to insert contact
   * form submissions. This is intentionally public (baked into the client
   * bundle) — see src/lib/contact.ts for why, and what that means.
   */
  readonly VITE_NEON_CONTACT_URL?: string;

  /**
   * Base URL of the Groq proxy Cloudflare Worker (see cloudflare-worker/)
   * that both src/lib/groqChat.ts and proteinChat.ts call — the actual
   * Groq API keys live server-side as Worker secrets now, not here.
   */
  readonly VITE_GROQ_PROXY_URL?: string;

  /**
   * Clerk publishable key. Unlike the other VITE_ vars above, this one is
   * *meant* to be public by Clerk's own design (it only identifies which
   * Clerk app to talk to; it grants no privileges on its own) — see
   * src/main.tsx.
   */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
