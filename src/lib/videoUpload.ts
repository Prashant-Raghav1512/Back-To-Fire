// Reads a video file as a base64 data URI, small enough (with the cap
// below) to store as a plain Postgres text value — same "no backend to sign
// a real object-storage upload with" reasoning as imageUpload.ts. Unlike
// images, there's no client-side re-encoding step here: no compression/
// transcoding library exists in this stack (no ffmpeg.wasm etc.), so a
// video ships exactly as the visitor's device produced it. The only lever
// available is a hard size cap, enforced before ever reading the file.
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // ~8MB, roughly a 15-20s phone-camera clip

export async function videoFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Please choose a video file.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('That video is too large - please choose one under 8MB (about 15-20 seconds of phone footage).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that video file.'));
    reader.readAsDataURL(file);
  });
}
