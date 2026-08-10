import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// GitHub Pages project sites are served under /<repo-name>/, not the domain
// root, so the app's own internal route ("/contact") and the real browser
// path ("/Back-To-Fire/contact") differ by this prefix. Vite exposes the
// configured `base` (see vite.config.ts) as BASE_URL — '/' locally, '/Back-To-Fire/' in production.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function toInternalPath(pathname: string): string {
  let internal = pathname;
  if (BASE && internal.startsWith(BASE)) {
    internal = internal.slice(BASE.length) || '/';
  }
  // GitHub Pages 301-redirects any extensionless path ("/exercises") to add
  // a trailing slash ("/exercises/") before serving the 404-fallback SPA
  // shell — so a direct load or refresh on a non-home route arrives here
  // with a trailing slash the switch in App.tsx doesn't expect. Without
  // stripping it, `/exercises/` never matches `case '/exercises':` and
  // silently falls through to the Home page instead.
  if (internal.length > 1 && internal.endsWith('/')) {
    internal = internal.slice(0, -1);
  }
  return internal || '/';
}

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  path: '/',
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => toInternalPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(toInternalPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === toInternalPath(window.location.pathname)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', BASE + to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}
