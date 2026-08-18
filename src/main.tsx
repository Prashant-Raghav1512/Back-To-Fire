import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Clerk's publishable key, unlike VITE_NEON_CONTACT_URL / VITE_GROQ_API_KEY
// elsewhere in this app, is *meant* to ship to the browser — see CLAUDE.md's
// "Auth (Clerk)" section.
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — set it in .env.local (see .env.example).');
}

// Every one of these defaults to the bare domain root when unset, which
// 404s on GitHub Pages project sites like this one (the site actually lives
// under /Back-To-Fire/, and nothing is published at the domain root
// itself): afterSignOutUrl covers sign-out and the sign-out that
// automatically happens on account deletion; the sign-up ones cover a
// brand-new user's very first sign-up. signInFallbackRedirectUrl/
// signUpFallbackRedirectUrl (not the deprecated afterSignInUrl/
// afterSignUpUrl, and not the "Force" variants, which would override any
// redirect_url this app might set later) only kick in when nothing more
// specific was already requested — the same "just go home" behavior as
// afterSignOutUrl. BASE_URL resolves to '/' locally and '/Back-To-Fire/' in
// production, matching whatever this build was actually deployed under.
const baseUrl = import.meta.env.BASE_URL;

// Every route but Home is a separately-fetched, content-hashed chunk (see
// CLAUDE.md's "Route-based code splitting") and GitHub Pages replaces every
// file on each deploy rather than keeping old hashed filenames around — so a
// browser holding a cached index.html from before the latest deploy tries to
// lazy-load a page chunk that's already 404ing, React throws, and with
// nothing to catch it the visitor gets a blank white screen with zero
// explanation. Vite fires this event specifically for that case; reloading
// picks up the current index.html/chunk manifest and recovers automatically
// instead of leaving the visitor stuck.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl={baseUrl}
      signInFallbackRedirectUrl={baseUrl}
      signUpFallbackRedirectUrl={baseUrl}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
