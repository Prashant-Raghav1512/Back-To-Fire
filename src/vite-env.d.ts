/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed Neon-backed API (e.g. https://your-project.vercel.app). Unset in local dev falls back to bundled data. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
