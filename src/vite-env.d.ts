/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Neon connection string used directly from the browser to insert contact
   * form submissions. This is intentionally public (baked into the client
   * bundle) — see src/lib/contact.ts for why, and what that means.
   */
  readonly VITE_NEON_CONTACT_URL?: string;

  /**
   * Groq API key used directly from the browser to power the chatbot.
   * Also intentionally public — see src/lib/groqChat.ts.
   */
  readonly VITE_GROQ_API_KEY?: string;

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
