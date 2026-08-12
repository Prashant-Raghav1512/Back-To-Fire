// Compresses/downscales an image file entirely in the browser and returns
// it as a base64 data URI, small enough to store as a plain Postgres text
// value. There's no backend here to sign an upload to real object storage
// (S3, Cloudinary, etc.) with, and no third-party image-host credentials
// exist in this environment either — so, like every other Neon-touching
// feature in this app, the image ships straight from the browser instead
// (see CLAUDE.md, "No backend, by design"). Downscaling to a max dimension
// and re-encoding as JPEG at a shrinking quality is what keeps that data
// URI small enough to be a reasonable row rather than a real limitation
// worked around — see db/schema.sql's community_posts comment.
const MAX_DIMENSION = 1280;
const MAX_OUTPUT_CHARS = 900_000; // ~900KB of base64 text
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // reject absurdly large source files before even trying
const QUALITY_STEPS = [0.8, 0.65, 0.5, 0.35];

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('That image is too large - please choose one under 10MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process that image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_OUTPUT_CHARS) return dataUrl;
  }
  throw new Error('Could not compress that image small enough - please try a simpler photo.');
}
