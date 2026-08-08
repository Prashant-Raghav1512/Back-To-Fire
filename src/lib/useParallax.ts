import { useEffect, useRef } from 'react';

// Scroll-linked depth for hero background images — the image drifts slower
// than the page scrolls, so it reads as sitting behind the content rather
// than pinned to it. The element needs a `scale(1.15)`-ish baseline (baked
// into the transform here) so the translate never reveals its edges; the
// parent section must keep `overflow-hidden` for the same reason.
export function useParallax<T extends HTMLElement>(speed = 0.2) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const offset = rect.top * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.15)`;
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
  }, [speed]);

  return ref;
}
