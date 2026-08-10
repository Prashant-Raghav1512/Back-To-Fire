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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* afterSignOutUrl defaults to the bare domain root when unset, which
        404s on GitHub Pages project sites like this one (the site actually
        lives under /Back-To-Fire/, and nothing is published at the domain
        root itself) — this hit real users via account deletion, which
        signs the user out same as a normal sign-out. BASE_URL resolves to
        '/' locally and '/Back-To-Fire/' in production, matching whatever
        this build was actually deployed under. */}
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl={import.meta.env.BASE_URL}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
