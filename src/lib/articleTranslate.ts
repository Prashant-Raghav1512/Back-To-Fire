import { neon } from '@neondatabase/serverless';
import { translateBatch } from '@/lib/googleTranslate';

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

// Checks Neon's cache first - the common case after the very first reader
// of a given (article, language) pair, which never touches the network
// translation endpoint at all (see src/lib/googleTranslate.ts). Only a
// cache miss actually calls Google and then persists the result for every
// future reader.
export async function translateArticle(
  articleId: string,
  article: TranslatableArticle,
  languageCode: string
): Promise<TranslatedArticle> {
  const cached = await getCachedTranslation(articleId, languageCode);
  if (cached) return cached;

  const [title, ...content] = await translateBatch([article.title, ...article.content], languageCode);
  const translated: TranslatedArticle = { title, content };
  await saveCachedTranslation(articleId, languageCode, translated);
  return translated;
}
