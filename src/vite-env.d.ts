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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
