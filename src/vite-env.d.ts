/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the data API Cloudflare Worker (see cloudflare-worker-data/)
   * that every src/lib/*.ts file which used to connect to Neon directly
   * from the browser now calls instead — the real Neon credential lives
   * server-side as a Worker secret, and the Worker verifies each visitor's
   * actual Clerk session before trusting any user-scoped request.
   */
  readonly VITE_DATA_API_URL?: string;

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
