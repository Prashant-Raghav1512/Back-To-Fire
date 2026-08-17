# Groq proxy (Cloudflare Worker)

Proxies the two Groq API calls this site makes (the main chatbot and the
Tools page's protein estimator) so the Groq API keys never ship to the
browser. Free on Cloudflare's free tier for this volume of traffic.

## Deploy it (one-time)

1. **Install wrangler and log in** (from this `cloudflare-worker/` folder):

   ```bash
   npx wrangler login
   ```

   This opens a browser to authorize wrangler against your Cloudflare
   account (free to sign up if you don't have one).

2. **Set the two secrets** — your existing Groq keys from
   [console.groq.com/keys](https://console.groq.com/keys) (the same values
   currently in `VITE_GROQ_API_KEY` / `VITE_GROQ_PROTEIN_API_KEY`):

   ```bash
   npx wrangler secret put GROQ_CHAT_KEY
   npx wrangler secret put GROQ_PROTEIN_KEY
   ```

   Each command prompts you to paste the key — it's stored encrypted on
   Cloudflare's side, never written to any file in this repo.

3. **Deploy**:

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints the Worker's URL, something like:

   ```
   https://born-to-fire-groq-proxy.<your-subdomain>.workers.dev
   ```

   Copy that URL — you need it in the next step.

## Wire it up to the site

1. Add a new GitHub Actions repository secret named `VITE_GROQ_PROXY_URL`
   set to the Worker URL from above (Settings → Secrets and variables →
   Actions → New repository secret). Add the same value to your local
   `.env.local` for local dev.
2. Add `VITE_GROQ_PROXY_URL` to the `env:` block of the build step in
   `.github/workflows/deploy-pages.yml`, the same way `VITE_GROQ_API_KEY`
   is already listed there.
3. You can now remove the old `VITE_GROQ_API_KEY` / `VITE_GROQ_PROTEIN_API_KEY`
   GitHub Actions secrets and `.env.local` entries — the client no longer
   reads them (see `src/lib/groqChat.ts` / `proteinChat.ts`). Don't delete
   them from GroqCloud itself, though — the Worker's `GROQ_CHAT_KEY` /
   `GROQ_PROTEIN_KEY` secrets (set above) are the same key values, just
   held server-side now instead of client-side.

## If you ever change domains

`ALLOWED_ORIGIN` in `wrangler.toml` is a plain comma-separated allowlist of
browser origins permitted to call this Worker (CORS). If this site ever
moves off `prashant-raghav1512.github.io`, update that list and redeploy
(`npx wrangler deploy`).

## Local development

`npx wrangler dev` runs the Worker locally (default `http://localhost:8787`)
using the same secrets set via `wrangler secret put` above. Point your
local `.env.local`'s `VITE_GROQ_PROXY_URL` at that local URL to test
end-to-end without touching the deployed Worker.
