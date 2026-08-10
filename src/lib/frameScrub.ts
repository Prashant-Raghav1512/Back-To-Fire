// Scroll-scrubbed image-sequence player, used by HomeFrameBackground.tsx as
// the Home page's full-page background in place of the earlier three.js
// flex character — this is a real captured video (extracted to
// public/frames/flex-transition/), not a rendered pose, so it plays back on
// a plain 2D canvas instead. Framework-agnostic on purpose, matching
// flexCharacter.ts/exerciseVisualizer.ts: createFrameScrubber() takes a
// <canvas> and returns an imperative handle driven entirely by
// setProgress(t) from the caller's scroll handler — same "renders exactly
// one frame per call, costs nothing while idle" contract as
// flexCharacter.ts's setProgress.

export interface FrameScrubHandle {
  /** t = 0..1, maps linearly onto the frame sequence. */
  setProgress: (t: number) => void;
  dispose: () => void;
  /** Resolves once every frame has attempted to load. */
  ready: Promise<void>;
}

// The canvas's drawing buffer is matched to the source frames' own native
// resolution (set once the first frame loads) rather than to the viewport —
// sizing the buffer off window.innerWidth/innerHeight and then hand-rolling
// letterbox math inside drawImage() was fragile and prone to reading as a
// stretched/distorted frame if that math or the buffer size ever drifted
// even slightly out of sync with the CSS-rendered box. Handing the actual
// fit to CSS `object-fit: contain` on the <canvas> element (a replaced
// element, so object-fit applies to it same as <img>/<video>) is what
// browsers are built to do correctly, so there's no scale math to get
// wrong: the buffer is always drawn 1:1, undistorted, and CSS letterboxes
// it into whatever box it sits in.
export function createFrameScrubber(canvas: HTMLCanvasElement, frameUrls: string[]): FrameScrubHandle {
  const ctx = canvas.getContext('2d')!;
  let disposed = false;
  let lastT = -1;
  const lastFramePos = frameUrls.length - 1;

  const images: HTMLImageElement[] = new Array(frameUrls.length);
  const ready = Promise.all(
    frameUrls.map(
      (url, i) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            images[i] = img;
            if (i === 0) {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
            }
            resolve();
          };
          // A single missing/corrupt frame shouldn't block the rest of the
          // sequence from loading and playing.
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  ).then(() => undefined);

  function drawFrame(img: HTMLImageElement) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  // Crossfades between the two frames straddling the current scroll
  // position instead of hard-cutting at each frame boundary — even with a
  // dense source sequence, a direct frame swap every scroll tick reads as a
  // stutter rather than motion. `alpha` is how far scroll has moved from
  // frame A toward frame B (0 = show A only, 1 = show B only).
  function drawBlended(indexA: number, indexB: number, alpha: number) {
    if (disposed) return;
    const imgA = images[indexA];
    if (!imgA) return;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFrame(imgA);
    const imgB = images[indexB];
    if (imgB && indexB !== indexA && alpha > 0.001) {
      ctx.globalAlpha = alpha;
      drawFrame(imgB);
      ctx.globalAlpha = 1;
    }
  }

  function render(t: number) {
    const framePos = t * lastFramePos;
    const indexA = Math.min(lastFramePos, Math.floor(framePos));
    const indexB = Math.min(lastFramePos, indexA + 1);
    drawBlended(indexA, indexB, framePos - indexA);
  }

  function setProgress(t: number) {
    const clamped = Math.min(Math.max(t, 0), 1);
    if (clamped === lastT) return;
    lastT = clamped;
    render(clamped);
  }

  function dispose() {
    disposed = true;
  }

  return { setProgress, dispose, ready };
}
