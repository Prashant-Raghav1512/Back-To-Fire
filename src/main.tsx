import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import './styles/character.css';

// Clerk's publishable key, unlike VITE_NEON_CONTACT_URL / VITE_GROQ_API_KEY
// elsewhere in this app, is *meant* to ship to the browser — see CLAUDE.md's
// "Auth (Clerk)" section.
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — set it in .env.local (see .env.example).');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
