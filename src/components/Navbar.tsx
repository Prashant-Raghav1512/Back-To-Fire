import { useEffect, useState } from 'react';
import { Menu, X, Moon, Sun, CircleUser } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Logo } from './Logo';
import { navLinks } from '@/data/content';
import { useRouter } from '@/lib/router';
import { useTheme } from '@/lib/useTheme';

export function Navbar() {
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (p: string) => {
    navigate(p);
    setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-sm dark:bg-gray-900/85'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-x mx-auto flex h-16 items-center justify-between px-5 sm:h-20 sm:px-8">
        <Logo onClick={() => go('/')} onHero={path === '/' && !scrolled} />

        <div className="hidden items-center gap-0.5 xl:flex">
          {navLinks.map((link) => {
            const active = path === link.path;
            return (
              <button
                key={link.path}
                onClick={() => go(link.path)}
                className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? 'text-green-700 dark:text-green-400'
                    : 'nav-link-hover text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => go('/programs')}
            className="hidden btn-primary !px-5 !py-2.5 text-sm sm:inline-flex"
          >
            Start Training
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white sm:inline-flex">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl={window.location.pathname}>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Profile"
                  labelIcon={<CircleUser className="h-4 w-4" />}
                  onClick={() => navigate('/profile')}
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 xl:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`xl:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mx-4 mb-4 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          {navLinks.map((link) => {
            const active = path === link.path;
            return (
              <button
                key={link.path}
                onClick={() => go(link.path)}
                className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <button onClick={() => go('/programs')} className="btn-primary mt-3 w-full">
            Start Training
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-center text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
