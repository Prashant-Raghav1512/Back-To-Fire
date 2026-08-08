import { useEffect, useRef, useState } from 'react';
import { createFrameScrubber, type FrameScrubHandle } from '@/lib/frameScrub';

const TOTAL_FRAMES = 140;
const FRAME_URLS = Array.from(
  { length: TOTAL_FRAMES },
  (_, i) => `${import.meta.env.BASE_URL}frames/flex-transition/frame_${String(i + 1).padStart(3, '0')}.jpg`
);
const REDUCED_MOTION_PROGRESS = 1; // last frame - fully flexed, a representative static shot

export function FrameScrubSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FrameScrubHandle | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let rafId = 0;
    let cleanupScroll: (() => void) | null = null;

    const { clientWidth, clientHeight } = canvas.parentElement ?? canvas;
    const handle = createFrameScrubber(canvas, FRAME_URLS, clientWidth || 1280, clientHeight || 720);
    handleRef.current = handle;

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      handle.resize(entry.contentRect.width, entry.contentRect.height);
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    handle.ready.then(() => {
      if (cancelled) return;

      const updateProgress = () => {
        rafId = 0;
        if (reducedMotion) return;
        const rect = section.getBoundingClientRect();
        const scrollableHeight = rect.height - window.innerHeight;
        const progress = scrollableHeight > 0 ? -rect.top / scrollableHeight : 0;
        handle.setProgress(Math.min(Math.max(progress, 0), 1));
      };
      const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(updateProgress);
      };

      if (reducedMotion) {
        handle.setProgress(REDUCED_MOTION_PROGRESS);
      } else {
        updateProgress();
        window.addEventListener('scroll', onScroll, { passive: true });
      }
      cleanupScroll = () => window.removeEventListener('scroll', onScroll);
    });

    return () => {
      cancelled = true;
      cleanupScroll?.();
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className={`relative bg-gray-900 ${reducedMotion ? '' : 'h-[300vh]'}`}>
      <div
        className={`sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden ${reducedMotion ? 'h-[80vh]' : ''}`}
      >
        <div className="absolute inset-0">
          <canvas ref={canvasRef} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 to-gray-900/40" />
          <div className="hero-glow absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-green-300 ring-1 ring-white/15 backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-green-400" />
            {reducedMotion ? 'Every muscle, engaged' : 'Scroll to flex'}
          </span>
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Built one rep at a time.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-300">
            No machines carved this - just bodyweight, consistency, and time.
          </p>
        </div>
      </div>
    </section>
  );
}
