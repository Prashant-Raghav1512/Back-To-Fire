import { useEffect, useRef, useState } from 'react';
import { createFrameScrubber, type FrameScrubHandle } from '@/lib/frameScrub';

const TOTAL_FRAMES = 240;
const FRAME_URLS = Array.from(
  { length: TOTAL_FRAMES },
  (_, i) => `${import.meta.env.BASE_URL}frames/flex-transition/frame_${String(i + 1).padStart(3, '0')}.jpg`
);
const REDUCED_MOTION_PROGRESS = 1; // last frame - fully flexed, a representative static shot

// Replaces the earlier FrameScrubSection (a single 500vh mid-page section)
// with a `position: fixed` full-viewport layer that sits behind the entire
// Home page — every section scrolls over it as a normal-flow overlay while
// the canvas itself never moves. The canvas renders at the source frames'
// own 16:9 resolution and is fit into the fixed viewport box via CSS
// `object-fit: contain` (see frameScrub.ts), so it always reads as a
// correctly-proportioned "window" letterboxed against the background's own
// dark color, never stretched or aggressively cropped. Progress is driven
// by how far down the WHOLE page the visitor has scrolled (0 at the top, 1
// at the bottom) instead of a single bounded section's scroll range, since
// this is meant to read as "the page's background," not one scrollytelling
// moment.
export function HomeFrameBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FrameScrubHandle | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let rafId = 0;
    let cleanupScroll: (() => void) | null = null;

    const handle = createFrameScrubber(canvas, FRAME_URLS);
    handleRef.current = handle;

    handle.ready.then(() => {
      if (cancelled) return;

      if (reducedMotion) {
        handle.setProgress(REDUCED_MOTION_PROGRESS);
        return;
      }

      // Same eased catch-up as before: spreads a fast scroll jump across a
      // few animation frames instead of snapping straight to it, so it
      // reads as fast-but-fluid motion rather than a stutter.
      let current = 0;
      let target = 0;

      const readTarget = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        target = scrollable > 0 ? Math.min(Math.max(doc.scrollTop / scrollable, 0), 1) : 0;
      };

      const step = () => {
        const diff = target - current;
        if (Math.abs(diff) < 0.0008) {
          current = target;
          handle.setProgress(current);
          rafId = 0;
          return;
        }
        current += diff * 0.12;
        handle.setProgress(current);
        rafId = requestAnimationFrame(step);
      };

      const onScroll = () => {
        readTarget();
        if (!rafId) rafId = requestAnimationFrame(step);
      };

      readTarget();
      current = target;
      handle.setProgress(current);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      cleanupScroll = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    });

    return () => {
      cancelled = true;
      cleanupScroll?.();
      if (rafId) cancelAnimationFrame(rafId);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gray-900" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full object-contain" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/85 via-gray-900/70 to-gray-900/90" />
      <div className="hero-glow absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
      <div className="hero-glow absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
    </div>
  );
}
