import { motion, useReducedMotion } from 'motion/react';

interface Blob {
  /** Tailwind background-color class, e.g. "bg-orange-300". */
  color: string;
  /** Tailwind size classes, e.g. "h-80 w-80". */
  size: string;
  /** Starting position — any combination of top/bottom/left/right as CSS values. */
  position: { top?: string; bottom?: string; left?: string; right?: string };
  /** Drift path in pixels, looped back and forth. */
  x: number[];
  y: number[];
  scale?: number[];
  duration: number;
}

interface AnimatedPageBackgroundProps {
  blobs: Blob[];
}

// A page-local (not fixed) animated backdrop: a faint dot-grid texture plus
// soft, blurred color blobs that slowly drift and pulse using the `motion`
// library, sitting behind a section's real content. Meant to be the first
// child of a `relative overflow-hidden` section, with the section's content
// wrapper given `relative z-10` so it paints on top. Distinct from
// HomeVideoBackground (the Home page's own full-page video background, left
// untouched) — this is the lighter-weight, per-section treatment used on
// every other page. Respects prefers-reduced-motion by freezing the blobs in
// their starting position instead of animating them.
export function AnimatedPageBackground({ blobs }: AnimatedPageBackgroundProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Dot-grid texture, faded toward the edges via a radial mask so it
          reads as depth rather than a hard-edged tile — the same "pro SaaS"
          background technique used underneath gradient blobs on sites like
          Linear/Vercel. Sits below the blobs, above the section's own bg
          color. */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 80% 65% at 50% 40%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 40%, black 40%, transparent 90%)',
        }}
      />
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-40 blur-3xl dark:opacity-20 ${b.color} ${b.size}`}
          style={b.position}
          animate={reduceMotion ? undefined : { x: b.x, y: b.y, scale: b.scale }}
          transition={{ duration: b.duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
