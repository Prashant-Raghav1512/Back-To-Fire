import { useEffect, useRef } from 'react';

interface TiltOptions {
  /** Max rotation in degrees at the card's edge. */
  max?: number;
  /** Scale applied while hovering. */
  scale?: number;
  perspective?: number;
}

// Cursor-follows-card 3D tilt, applied imperatively via a ref (not React
// state) so it can update every pointermove without a re-render. Skipped
// entirely for touch input (no hover to tilt toward) and when the visitor
// has requested reduced motion.
export function useTilt<T extends HTMLElement>({ max = 8, scale = 1.02, perspective = 900 }: TiltOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = 0;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * max * 2;
      const rotateX = -(py - 0.5) * max * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = 'none';
        el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
        el.style.setProperty('--tilt-px', `${px * 100}%`);
        el.style.setProperty('--tilt-py', `${py * 100}%`);
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = '';
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [max, scale, perspective]);

  return ref;
}
