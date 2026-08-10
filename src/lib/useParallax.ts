import { useEffect, useRef } from 'react';

// Scroll-linked depth for hero background images — the image drifts slower
// than the page scrolls, so it reads as sitting behind the content rather
// than pinned to it. The element needs a `scale(1.15)`-ish baseline (baked
// into the transform here) so the translate never reveals its edges; the
// parent section must keep `overflow-hidden` for the same reason.
//
// Also adds a small extra zoom while hovered, so every hero image responds
// to the cursor the same way the site's card images already do — layered
// onto the same `transform`, not a separate element, since a wrapper-div
// wouldn't be usable here without touching every page's hero markup. A
// transient CSS transition drives the hover in/out smoothly, then clears
// itself shortly after so scroll-driven updates keep tracking the scroll
// position instantly instead of easing behind it.
export function useParallax<T extends HTMLElement>(speed = 0.2) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let hoverScale = 1;
    let transitionTimeout = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const offset = rect.top * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(${1.15 * hoverScale})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const setHover = (hovering: boolean) => {
      hoverScale = hovering ? 1.06 : 1;
      el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      update();
      window.clearTimeout(transitionTimeout);
      transitionTimeout = window.setTimeout(() => {
        el.style.transition = '';
      }, 650);
    };
    const onEnter = () => setHover(true);
    const onLeave = () => setHover(false);
    // Every hero image has a gradient-overlay sibling stacked on top of it
    // for readability, which would otherwise swallow pointer events aimed
    // at the image. mouseenter/mouseleave fire per-element based on cursor
    // containment regardless of what's stacked on top, so listening on the
    // shared parent (which fully wraps both the image and its overlay)
    // reaches the same events without needing pointer-events tweaks on
    // every overlay across every page.
    const hoverTarget = el.parentElement ?? el;

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (canHover) {
      hoverTarget.addEventListener('pointerenter', onEnter);
      hoverTarget.addEventListener('pointerleave', onLeave);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      hoverTarget.removeEventListener('pointerenter', onEnter);
      hoverTarget.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      window.clearTimeout(transitionTimeout);
    };
  }, [speed]);

  return ref;
}
