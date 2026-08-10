import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Floating button that appears once the visitor has scrolled roughly one
// viewport down, and smooth-scrolls back to top on click. Sits at
// bottom-24 (vs. ChatWidget's bottom-5/6) so the two floating buttons never
// overlap.
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:bg-gray-800 active:scale-90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
