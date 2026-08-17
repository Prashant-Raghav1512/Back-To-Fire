import { useEffect, useRef, useState } from 'react';

// Replaces the earlier frame-sequence scrubber (HomeFrameBackground.tsx,
// canvas + 240 JPEGs stepped by scroll position) with a real looping video —
// same `position: fixed` full-viewport layer sitting behind the whole Home
// page, same dark gradient overlay to keep it "faded" behind foreground
// content. Unlike the frames, playback is NOT tied to scroll position:
// scrubbing a <video>'s currentTime on every scroll event is a known source
// of stutter (browsers aren't built for frame-precise seeking the way a
// canvas swapping still images is), so this just autoplays on a loop
// instead - smooth and simple, at the cost of the old "scroll to reveal"
// interaction. `object-contain` (not `cover`) keeps the whole video visible
// within the fixed viewport box, "windowed" rather than cropped edge to
// edge — the same fit the old canvas frames used.
//
// The `?v=` query string is manual cache-busting: this file lives in
// public/ and is referenced by a plain literal path, not a JS import, so
// Vite never fingerprints it with a content hash the way it does src/
// assets/JS/CSS bundles — a browser (or GitHub Pages' CDN) that already
// cached this exact URL has no signal that the file changed underneath it
// and can keep serving the old, larger video indefinitely. Bump this
// number whenever home-background.mp4 is re-exported/re-encoded.
const VIDEO_SRC = `${import.meta.env.BASE_URL}videos/home-background.mp4?v=2`;

export function HomeVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    // Autoplay can still be blocked by the browser in edge cases even when
    // muted - failing silently just leaves the first frame showing, same as
    // the reduced-motion case.
    video.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gray-900" aria-hidden="true">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className="h-full w-full object-contain"
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/85 via-gray-900/70 to-gray-900/90" />
      <div className="hero-glow absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
      <div className="hero-glow absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
    </div>
  );
}
