import { neon } from '@neondatabase/serverless';

// SECURITY NOTE: reuses the same browser-exposed Neon connection as every
// other Community/contact feature (src/lib/community.ts, contact.ts) — see
// those files' own SECURITY NOTE comments for why a separate role wouldn't
// add real access restriction on this project. This table is just a
// shared translation cache, not user data.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Translation is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export interface TranslatableArticle {
  title: string;
  content: string[];
}

export interface TranslatedArticle {
  title: string;
  content: string[];
}

interface TranslationRow {
  title: string;
  content: string[];
}

async function getCachedTranslation(articleId: string, languageCode: string): Promise<TranslatedArticle | null> {
  const sql = client();
  const rows = (await sql`
    SELECT title, content FROM article_translations
    WHERE article_id = ${articleId} AND language_code = ${languageCode}
  `) as TranslationRow[];
  const row = rows[0];
  return row ? { title: row.title, content: row.content } : null;
}

async function saveCachedTranslation(articleId: string, languageCode: string, translated: TranslatedArticle): Promise<void> {
  const sql = client();
  await sql`
    INSERT INTO article_translations (article_id, language_code, title, content)
    VALUES (${articleId}, ${languageCode}, ${translated.title}, ${translated.content})
    ON CONFLICT (article_id, language_code) DO UPDATE SET
      title = ${translated.title},
      content = ${translated.content},
      created_at = now()
  `;
}

// --- Machine translation --------------------------------------------
//
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

// Checks Neon's cache first - the common case after the very first reader
// of a given (article, language) pair, which never touches the network
// translation endpoint at all. Only a cache miss actually calls Google and
// then persists the result for every future reader.
export async function translateArticle(
  articleId: string,
  article: TranslatableArticle,
  languageCode: string
): Promise<TranslatedArticle> {
  const cached = await getCachedTranslation(articleId, languageCode);
  if (cached) return cached;

  const tasks = [article.title, ...article.content].map((text) => () => translateText(text, languageCode));
  const [title, ...content] = await runLimited(tasks, REQUEST_CONCURRENCY);

  const translated: TranslatedArticle = { title, content };
  await saveCachedTranslation(articleId, languageCode, translated);
  return translated;
}
