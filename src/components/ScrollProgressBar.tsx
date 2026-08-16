import { useEffect, useRef } from 'react';

// Thin fixed bar at the very top edge of the viewport (above the navbar's
// own z-50) that fills left-to-right with how far down the page the visitor
// has scrolled. Width is driven imperatively via a ref so it updates every
// scroll frame without a React re-render — same "costs nothing while idle"
// contract as useParallax.
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const progress = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${progress}%`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[3px] w-full" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full w-0 bg-gradient-to-r from-green-400 to-orange-400 transition-[width] duration-150 ease-out"
      />
    </div>
  );
}
