// Scroll-scrubbed image-sequence player, used by FrameScrubSection.tsx on the
// Home page in place of the earlier three.js flex character — this is a real
// captured video (extracted to public/frames/flex-transition/), not a
// rendered pose, so it plays back on a plain 2D canvas instead. Framework-
// agnostic on purpose, matching flexCharacter.ts/exerciseVisualizer.ts:
// createFrameScrubber() takes a <canvas> and returns an imperative handle
// driven entirely by setProgress(t) from the caller's scroll handler — same
// "renders exactly one frame per call, costs nothing while idle" contract as
// flexCharacter.ts's setProgress.

export interface FrameScrubHandle {
  /** t = 0..1, maps linearly onto the frame sequence. */
  setProgress: (t: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  /** Resolves once every frame has attempted to load. */
  ready: Promise<void>;
}

export function createFrameScrubber(
  canvas: HTMLCanvasElement,
  frameUrls: string[],
  width: number,
  height: number
): FrameScrubHandle {
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let disposed = false;
  let lastT = -1;
  const lastFramePos = frameUrls.length - 1;

  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));

  const images: HTMLImageElement[] = new Array(frameUrls.length);
  const ready = Promise.all(
    frameUrls.map(
      (url, i) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            images[i] = img;
            resolve();
          };
          // A single missing/corrupt frame shouldn't block the rest of the
          // sequence from loading and playing.
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  ).then(() => undefined);

  // Cover-fit: scale so the frame fills the canvas, cropping overflow —
  // matches CSS object-fit: cover, since these frames are a fixed 16:9
  // source that needs to fill whatever aspect ratio the section has.
  function drawCover(img: HTMLImageElement) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
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
    drawCover(imgA);
    const imgB = images[indexB];
    if (imgB && indexB !== indexA && alpha > 0.001) {
      ctx.globalAlpha = alpha;
      drawCover(imgB);
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

  function resize(w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (lastT >= 0) render(lastT);
  }

  function dispose() {
    disposed = true;
  }

  return { setProgress, resize, dispose, ready };
}
