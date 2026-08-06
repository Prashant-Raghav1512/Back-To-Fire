# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Born to Fire — a calisthenics/home-fitness marketing site for India (React + TypeScript + Vite + Tailwind), deployed as a **fully static site to GitHub Pages** with **no backend server of any kind**. Every dynamic feature (database reads/writes, AI chat) either happens at build time or talks to a third-party service directly from the browser — there is deliberately no API layer. Live at https://prashant-raghav1512.github.io/Back-To-Fire/, repo at github.com/Prashant-Raghav1512/Back-To-Fire.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build; automatically runs `prebuild` (Neon → JSON sync) and `postbuild` (404.html generation), see Architecture below
- `npm run typecheck` — `tsc --noEmit`, the only type-checking command
- `npm run lint` — ESLint
- `npm run preview` — serve the built `dist/` locally
- `npm run fetch-content` — manually re-run the Neon → JSON sync without doing a full build

There is no test suite in this repo.

## Architecture

### No backend, by design

This project was migrated off an earlier Vercel-serverless-functions setup specifically to keep everything on GitHub (`@supabase/supabase-js` in `package.json` is unused leftover from the original scaffold — nothing imports it). The result is two very different patterns for talking to Neon Postgres, and it matters not to conflate them:

1. **Build-time, secure** (`DATABASE_URL`): `scripts/fetch-content.mjs` runs before every build via the `prebuild` script, reads `exercises`/`programs` from Neon using `@neondatabase/serverless`'s HTTP driver (not the WebSocket `Client` — GitHub Actions' runner has no global `WebSocket`), and writes the result to `src/data/exercises.json` / `programs.json`. Those generated JSON files are committed to the repo and imported by `src/data/content.ts`. If `DATABASE_URL` isn't set, the script no-ops and the build uses whatever JSON is already checked in. **`DATABASE_URL` is never shipped to the browser.**

2. **Browser-time, deliberately insecure** (`VITE_NEON_CONTACT_URL`, `VITE_GROQ_API_KEY`): the contact form (`src/lib/contact.ts`) and the AI chatbot (`src/lib/groqChat.ts`) call Neon and Groq *directly from client-side JS*, so both credentials ship in the public bundle. This was investigated, not overlooked: Neon's connection proxy only authenticates roles created through its own control plane, and every such role is automatically added to `neon_superuser` (full read/write/DDL on the whole database), with no way for this project's owner role to strip that membership — there is no scoped/insert-only Neon role possible on this project. The contact form uses a dedicated `contact_public` role (separate from the build-time role) purely so it can be rotated independently if abused, not because it's actually restricted. Read the comments at the top of `contact.ts` and `groqChat.ts` before treating this as a bug to fix.

### GitHub Pages routing (fragile — verify all three cases below after touching it)

GitHub Pages serves this repo at `/Back-To-Fire/`, not the domain root, and there's no server-side routing. Two mechanisms make client-side routing work, both required together:

- `src/lib/router.tsx` reads Vite's `import.meta.env.BASE_URL` and strips/re-adds it when translating between the app's internal paths (`/contact`) and the real browser path (`/Back-To-Fire/contact`). `vite.config.ts` sets `base` from a `VITE_BASE_PATH` env var that the deploy workflow computes from the repo name at build time.
- `scripts/copy-404.mjs` (the `postbuild` script) copies `dist/index.html` to `dist/404.html`. GitHub Pages serves that file (still with an HTTP 404 status) for any unmatched path — this is what makes a direct load or refresh on `/contact` work instead of hitting GitHub's own generic 404 page.

These broke independently before (commit `e2fe407`). After any change to routing, the `base` config, or the build scripts, check: a fresh direct load of a non-home route, a page refresh on a non-home route, and a client-side nav-link click.

### Content model

`src/data/types.ts` defines the `Exercise`/`Program`/`FitnessEvent` shapes. `src/data/content.ts` re-exports those types plus the Neon-sourced `exercises`/`programs` arrays (from the generated JSON — see above) and two purely static arrays, `benefits` and `navLinks`, that are not Neon-backed. `db/schema.sql` is the source of truth for the Neon schema (`programs`, `exercises`, `contact_submissions`, `enrollments` tables) — it's an idempotent create+seed script, safe to run against a fresh database.

### Events

`src/data/events.ts` is a hand-maintained static array (`events`), following the `benefits`/`navLinks` pattern above, not Neon-backed — add/edit events by hand in that file. Critically, **status (`upcoming`/`ongoing`/`ended`) is never stored**, only `startDate`/`endDate`; `src/lib/events.ts`'s `getEventStatus` derives it by comparing against `new Date()` at render time, so it's never possible for a displayed status to drift out of sync with reality. Each event also carries an `agenda` (ordered `EventAgendaItem[]`, each with its own `date`/optional `time`) and an optional `recap` string. `src/pages/EventsPage.tsx` (route `/events`) groups events into three sections via `groupEventsByStatus`; `HomePage.tsx` shows a 3-event spotlight (ongoing + soonest upcoming). Every event card (on both pages) opens `src/components/EventModal.tsx`, which shows "What happened" + the `recap` for ended events, "What to expect" (the full agenda) for upcoming events, or — for ongoing events — the agenda split into "what's happened so far" vs. "what's coming up next" via `getAgendaItemStatus`, which resolves each item's own `date`+`time` against `now`. Expressing interest in an ongoing/upcoming event uses the same `EnrollButton` described in "Enrollments" below.

### Enrollments

Signed-in users can enroll in a program (`src/pages/ProgramsPage.tsx`'s "Start" buttons) or an event (`EnrollButton` in `EventsPage.tsx`/`EventModal.tsx`) — this writes a row to Neon's `enrollments` table, it does **not** redirect to the contact form. `src/lib/enrollments.ts` holds the browser-side `enroll()`/`getMyEnrollments()` functions and the `useMyEnrollments()` hook (fetches the signed-in user's rows once per page, exposes `isEnrolledIn(type, id)` and a `refresh()` to call after a new enrollment). `src/components/EnrollButton.tsx` is the one shared button used everywhere enrollment happens — it owns the sign-in gate, the in-flight/enrolled/error states, and calls `onEnrolled` (always a `refresh()` from the hook) on success. `src/pages/ProfilePage.tsx` (route `/profile`, reachable from the "My Enrollments" item in the `<UserButton>` menu in `Navbar.tsx` — deliberately not in `navLinks`, since it's account-scoped, not marketing nav) lists everything the signed-in user has joined, split into "My Programs" and "My Events".

`enrollments` rows are keyed by `clerk_user_id` (Clerk's user id — there's no `users` table in Neon, since accounts live in Clerk, not this database) plus a snapshot of `item_title`/`item_detail` taken at enrollment time, so a user's history still reads sensibly even if a program/event is later edited or removed from `src/data/*`. Enrollment writes/reads reuse the same browser-exposed `VITE_NEON_CONTACT_URL` connection as the contact form, rather than a new dedicated credential — see the comment at the top of `enrollments.ts` for why (short version: every Neon role on this project is already `neon_superuser` regardless, and provisioning a genuinely new role requires the Neon dashboard/API, which this environment has no credentials for).

### Paid membership plans & gym branches

`src/data/paidPlans.ts` (`ageGroups` + `paidPlans`, not Neon-backed) defines paid coaching memberships — a separate concept from the free `programs` in `content.ts`. Three age groups (`youth`/`adults`/`seniors`) each have exactly three tiers (Basic/Standard/Premium); every tier includes calisthenics lessons, gym branch access, and a diet plan, and **only Premium** sets `hasPersonalTrainer: true` — that split is a deliberate product decision (see the comment on `PaidPlan` in `types.ts`), not something to "fix" by adding a trainer elsewhere. `src/components/MembershipPlans.tsx` (rendered on `/programs`, below the free programs) is an age-group tab switcher over these plans; it reuses the same `EnrollButton`/`useMyEnrollments` machinery as free programs, with `itemType: 'program'` — paid plans are stored in the same `enrollments` table via the plan's `id`, no schema change needed, since "enrolling" just registers interest the same way it does everywhere else on this backend-less site (there's no real payment flow).

`src/data/gymBranches.ts` is a static list of branch locations (locality-level lat/lng, good enough for "which is closest," not survey-grade). `src/lib/gymBranches.ts`'s `useNearestBranches()` hook sorts them by distance from the browser's own Geolocation API (Haversine formula, no backend) once the visitor opts in via `locate()`; `src/components/GymBranchLocator.tsx` (also on `/programs`) renders the list and flags the nearest one once located.

### Chatbot: client-side RAG, no server, global floating widget

`src/lib/search.ts` is a from-scratch BM25 implementation (no external dependency) indexing `src/data/knowledgeBase.ts`. Most of that array is hand-written chunks, not auto-derived from `content.ts` — **except** the event chunks, which are the one deliberate exception: `knowledgeBase.ts` appends `getEventKnowledgeChunks()` from `src/lib/events.ts` at module load, because a hand-written "this event is upcoming" sentence would silently go stale the instant the event started or ended. If you add a new hand-written chunk, it goes in the `staticKnowledgeBase` array, not near the event-chunk logic. `src/lib/groqChat.ts` takes the top-3 BM25 matches for a user's message and feeds them as context to Groq's chat completions API (`llama-3.3-70b-versatile`) with a system prompt instructing it to answer only from that context and admit when it doesn't know; the prompt also names the persona (`Ankit Baiyanpuria`) so the model answers consistently if asked its name.

The bot is split into two components on purpose: `src/components/ChatBot.tsx` is body-only (message list, suggestions, input — no header, no card chrome, fills `h-full` of whatever contains it) and keeps conversation history client-side, replaying recent turns to Groq so follow-up questions work; `src/components/ChatWidget.tsx` owns the floating bubble, the small window frame, and the header (name/"Online now"/close button), and is mounted once in `App.tsx` **outside** the route switch, so its open/closed state and message history persist across client-side page navigation instead of resetting per page — this is what makes it "appear on every page" rather than being embedded once on Contact like before. The opening message is hardcoded to start with "RAM RAM BHAI SAREYANE" — don't move that into the BM25-driven/Groq-generated reply path, it's a fixed local greeting shown before any API call happens. The BM25 tuning (title-term weighting via `TITLE_WEIGHT`, light stemming, the `MIN_MATCH_RATIO` filter) exists to fix real regressions found by testing against paraphrased questions, not arbitrary constants — re-verify against varied phrasings if you touch the scoring.

### Exercise 3D visualizer

The Exercises page's interactive demo is a from-scratch three.js scene, not a DOM/SVG animation. Split in two on purpose:

- `src/lib/exerciseVisualizer.ts` is framework-agnostic — no React, no DOM queries beyond the `<canvas>` it's given. `createExerciseVisualizer(canvas, width, height)` builds the scene (rig, props, lighting, ground) and returns an imperative `VisualizerHandle` (`selectExercise`, `setPlaying`, `setSpeed`, `setCamera`, `resize`, `subscribe`, `dispose`). The rig is a **two-bone IK** system (`ik2`/`legIK`/`armIK`) — every exercise pose is defined as a fixed world-space hand/foot *target* (see the `ANCHOR` constants) that the IK solver reaches for, not as hand-tuned joint rotations, which is what keeps 18 very different exercises (prone, hanging, inverted, single-leg...) sharing one solver. Exercise ids in `EXERCISES`/`EXERCISE_ORDER` are deliberately identical to the `id`s in `src/data/exercises.json`, so the two never need a translation table.
- `src/components/ExerciseDemo.tsx` owns all React state (selected exercise, play/pause, speed, camera preset, live rep count) and talks to the engine only through the handle — it never reaches into three.js internals. It mounts the scene in a `useEffect` sized off its container via `ResizeObserver` (not `window.resize` — the visualizer lives in a fixed-height section, not the full viewport) and fully disposes the engine (cancels the RAF loop, disposes the renderer/controls/geometries) on unmount, which is what makes it safe under React 18 StrictMode's dev-only double-invoke.

Styling is `src/styles/visualizer.css`, imported directly by `ExerciseDemo.tsx` (not `main.tsx`) — every class is prefixed `viz-` and scoped under `.viz-root` specifically so it can't collide with the site's Tailwind/`.card`/`.badge` classes; the panels (pills, info card, stat card, camera buttons) are `position: absolute` within `.viz-root`, not `position: fixed` to the viewport, unlike the standalone prototype this was ported from.

`three` is pinned to an exact version matching `@types/three` (both `0.160.0` at time of writing) since core `three` doesn't ship its own type declarations at that version — bump them together, not independently.

### Path alias

`@/` maps to `src/`, configured in both `vite.config.ts` and `tsconfig.app.json` — keep them in sync if either changes.

## Env vars / secrets

Full explanations are in `.env.example`. Summary:

| Var | Used by | Shipped to browser? |
|---|---|---|
| `DATABASE_URL` | `scripts/fetch-content.mjs` (build time only) | No |
| `VITE_NEON_CONTACT_URL` | `src/lib/contact.ts` | Yes, deliberately |
| `VITE_GROQ_API_KEY` | `src/lib/groqChat.ts` | Yes, deliberately |
| `VITE_CLERK_PUBLISHABLE_KEY` | `src/main.tsx` | Yes — this one is meant to be public (it's not a secret, just an app identifier) |

Locally these go in `.env.local` (gitignored, not committed). In CI they're GitHub Actions secrets consumed by `.github/workflows/deploy-pages.yml`; `VITE_BASE_PATH` is computed automatically from `github.event.repository.name` in that workflow and never needs to be set by hand.

## Auth (Clerk)

Auth is [Clerk](https://clerk.com)'s React SDK (`@clerk/clerk-react`), used entirely client-side — fitting the "no backend" constraint, unlike the Neon/Groq browser calls this isn't a deliberate insecurity, Clerk's publishable key is designed to be public. `ClerkProvider` wraps the app in `src/main.tsx`. Browsing every page works fully signed-out; the only gated actions are the ones that write something — submitting the contact form (`src/pages/ContactPage.tsx`) and enrolling in a program or event (see "Enrollments" above) — all check `useUser()`'s `isSignedIn` and fall back to `openSignIn()` (a modal, via `useClerk()`) instead of a dedicated route, since the app's hand-rolled router (`src/lib/router.tsx`) doesn't integrate with Clerk's routing props. The "Forgot password?" flow is built into Clerk's prebuilt `<SignIn/>`/modal UI automatically whenever email/password is enabled as a sign-in strategy in the Clerk Dashboard — no app code implements it. `Navbar.tsx`'s `<UserButton>` adds one custom menu item ("My Enrollments" → `/profile`) via `<UserButton.MenuItems><UserButton.Action .../></UserButton.MenuItems>`, Clerk's supported custom-action API — not `<UserButton.Link href=.../>`, since a raw `href` would bypass the SPA router and force a full page reload.
