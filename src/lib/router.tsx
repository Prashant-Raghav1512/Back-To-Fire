import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// GitHub Pages project sites are served under /<repo-name>/, not the domain
// root, so the app's own internal route ("/contact") and the real browser
// path ("/Back-To-Fire/contact") differ by this prefix. Vite exposes the
// configured `base` (see vite.config.ts) as BASE_URL — '/' locally, '/Back-To-Fire/' in production.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function toInternalPath(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) {
    return pathname.slice(BASE.length) || '/';
  }
  return pathname || '/';
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
