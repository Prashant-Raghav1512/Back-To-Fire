# Data API (Cloudflare Worker)

Replaces every browser-direct Neon connection (`VITE_NEON_CONTACT_URL`, now
retired) with an authenticated API: contact form, newsletter, enrollments,
memberships, community (profile/chat/posts/comments), friends, direct
messages, Friend IDs, and the article/exercise translation cache. Holds the
real Neon credential server-side and verifies the visitor's actual Clerk
session before trusting any user-scoped request — see `auth.ts`. Free on
Cloudflare's free tier for this volume of traffic, same as the Groq proxy
(`../cloudflare-worker/`) this mirrors.

## Deploy it (one-time)

1. **Log in** (from this `cloudflare-worker-data/` folder — skip if you're
   already logged in from setting up the Groq proxy):

   ```bash
   npx wrangler login
   ```

2. **Set the two secrets**:

   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put CLERK_SECRET_KEY
   ```

   - `DATABASE_URL` — a Neon connection string (the same value currently in
     `VITE_NEON_CONTACT_URL`, or `DATABASE_URL` from your Neon dashboard —
     any Neon role on this project works, since none can be scoped down
     further; see the project's `CLAUDE.md` for why).
   - `CLERK_SECRET_KEY` — from the
     [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys)
     (not the publishable key already used elsewhere in this project — the
     *secret* key, shown right next to it on the same page).

   Each command prompts you to paste the value — stored encrypted on
   Cloudflare's side, never written to any file in this repo.

3. **Deploy**:

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints the Worker's URL, something like:

   ```
   https://born-to-fire-data-api.<your-subdomain>.workers.dev
   ```

   Copy that URL — you need it in the next step.

## Wire it up to the site

1. Add a new GitHub Actions repository secret named `VITE_DATA_API_URL` set
   to the Worker URL from above (Settings → Secrets and variables → Actions
   → New repository secret). Add the same value to your local `.env.local`
   for local dev.
2. Add `VITE_DATA_API_URL` to the `env:` block of the build step in
   `.github/workflows/deploy-pages.yml`.
3. Once deployed and verified working, `VITE_NEON_CONTACT_URL` can be
   removed from GitHub Actions secrets and `.env.local` — the client no
   longer reads it anywhere (every `src/lib/*.ts` file that used to import
   `@neondatabase/serverless` directly now calls this Worker instead).

## If you ever change domains

`ALLOWED_ORIGIN` in `wrangler.toml` is a plain comma-separated allowlist of
browser origins permitted to call this Worker (CORS) — it also doubles as
the Clerk token's `authorizedParties` list (see `auth.ts`), so a session
token issued for this site can't be replayed from another origin. If this
site ever moves off `prashant-raghav1512.github.io`, update that list and
redeploy (`npx wrangler deploy`).

## Local development

`npx wrangler dev` runs the Worker locally (default `http://localhost:8787`
— since the Groq proxy already uses that port locally, run this one on a
different port, e.g. `npx wrangler dev --port 8788`) using a `.dev.vars`
file (gitignored) holding real `DATABASE_URL` / `CLERK_SECRET_KEY` values
for local testing only. Point your local `.env.local`'s `VITE_DATA_API_URL`
at that local URL to test end-to-end without touching the deployed Worker.
