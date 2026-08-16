// Calls Google Translate's free, keyless "translate_a/single" endpoint
// directly from the browser (the same one Google's own web UI uses
// internally) rather than a paid/keyed API — this app has no backend to
// hide a real Cloud Translation API key behind, and this endpoint needs
// none. It's unofficial and undocumented, so it could change or go away,
// but it's been stable in practice for years and (unlike an LLM-based
// translator) has no per-token quota to run out of mid-day. An earlier
// Groq-based translator was replaced with this after testing showed both
// Groq's free-tier daily token budget and a free crowd-sourced-memory
// alternative (MyMemory) were too unreliable for production use — see
// db/schema.sql's article_translations comment.
//
// Shared by src/lib/articleTranslate.ts and src/lib/exerciseTranslate.ts —
// each owns its own Neon cache table (translating the same text twice is
// wasted network calls against an unofficial endpoint), but the actual
// "call Google, retry, run several in parallel" logic is identical between
// them, so it lives here once rather than being copy-pasted per feature.
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const REQUEST_CONCURRENCY = 5;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateTextOnce(text: string, languageCode: string): Promise<string> {
  const url = new URL(TRANSLATE_ENDPOINT);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', languageCode);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Translation request failed with status ${res.status}`);
  }

  // Response shape: [[[translatedSegment, originalSegment, ...], ...], ...]
  // — Google splits long text into sentence-level segments; joining them
  // back with spaces reconstructs the full paragraph.
  const data: [[string, string, ...unknown[]][], ...unknown[]] = await res.json();
  const segments = data[0];
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('Translation returned an unexpected response.');
  }
  return segments.map((seg) => seg[0]).join(' ');
}

async function translateText(text: string, languageCode: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await translateTextOnce(text, languageCode);
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
}

// Runs `tasks` with at most `limit` in flight at once, preserving result
// order - a plain worker-pool over indices rather than pulling in a
// dependency for something this small.
async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// Translates every string in `texts` into `languageCode`, preserving order,
// at most REQUEST_CONCURRENCY requests in flight at once.
export async function translateBatch(texts: string[], languageCode: string): Promise<string[]> {
  const tasks = texts.map((text) => () => translateText(text, languageCode));
  return runLimited(tasks, REQUEST_CONCURRENCY);
}
