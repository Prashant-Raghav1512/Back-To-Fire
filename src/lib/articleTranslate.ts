import { translateBatch } from '@/lib/googleTranslate';
import { apiFetch } from '@/lib/dataApi';

export interface TranslatableArticle {
  title: string;
  content: string[];
}

export interface TranslatedArticle {
  title: string;
  content: string[];
}

async function getCachedTranslation(articleId: string, languageCode: string): Promise<TranslatedArticle | null> {
  return apiFetch<TranslatedArticle | null>(
    `/translations/article?articleId=${encodeURIComponent(articleId)}&lang=${encodeURIComponent(languageCode)}`
  );
}

async function saveCachedTranslation(articleId: string, languageCode: string, translated: TranslatedArticle): Promise<void> {
  await apiFetch('/translations/article', {
    method: 'POST',
    body: JSON.stringify({ articleId, languageCode, title: translated.title, content: translated.content }),
  });
}

// Checks the cache first - the common case after the very first reader
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
