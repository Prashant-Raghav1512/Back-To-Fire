import { useEffect, useRef } from 'react';

interface MagneticOptions {
  /** How strongly the element is pulled toward the cursor (0-1). */
  strength?: number;
  /** Max pixel offset in any direction. */
  max?: number;
}

// Pulls an element a few pixels toward the cursor while hovered, snapping
// back with an overshoot on leave — a small "focal point" cue meant for a
// page's one or two most important CTAs, not every button (see GSAP
// guidance: magnetic effects get noisy past 1-2 focal elements per screen).
// Applied to a wrapping <span>, not the button itself, so it doesn't fight
// the button's own CSS-driven hover/press transform (see btn-primary in
// index.css) — the two transforms compose independently on parent vs child.
// Same guards as useTilt: skipped for touch input and reduced motion.
export function useMagnetic<T extends HTMLElement>({ strength = 0.3, max = 14 }: MagneticOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = clamp((e.clientX - (rect.left + rect.width / 2)) * strength, -max, max);
      const dy = clamp((e.clientY - (rect.top + rect.height / 2)) * strength, -max, max);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = 'transform 0.15s ease-out';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = '';
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength, max]);

  return ref;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
