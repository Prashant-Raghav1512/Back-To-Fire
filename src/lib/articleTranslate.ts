// SECURITY NOTE: reuses the main site chatbot's Groq key
// (VITE_GROQ_API_KEY, see src/lib/groqChat.ts) rather than provisioning a
// third one — unlike the Tools page's protein chatbot, which deliberately
// gets its own key, this environment has no credentials for the Groq
// dashboard to create a new one. Same shipped-to-the-browser tradeoff and
// free-tier reasoning as every other Groq/Neon key in this app (see
// CLAUDE.md, "No backend, by design").
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

// Long articles (~28 paragraphs) are translated in chunks rather than one
// giant request - a single call risks the model truncating a
// multi-thousand-word JSON response mid-string, which breaks parsing
// entirely. A bigger chunk means fewer total requests per article, which
// matters a lot here since this key is shared with the main site chatbot's
// live traffic (see the SECURITY NOTE above) - every request this feature
// doesn't need to make is rate-limit budget left for real chatbot users.
const PARAGRAPHS_PER_CHUNK = 10;

// Firing every chunk request at once (a plain Promise.all burst) reliably
// tripped Groq's free-tier rate limit (HTTP 429) during testing. Running
// at most two in flight — plus exponential backoff on 429/5xx generous
// enough to ride out a shared free-tier key already under other load —
// fixed it.
const MAX_CONCURRENT_REQUESTS = 2;
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1500;

export interface TranslatableArticle {
  title: string;
  content: string[];
}

export interface TranslatedArticle {
  title: string;
  content: string[];
}

class RetryableGroqError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqJsonOnce<T>(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<T> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    const message = body.error?.message ?? `Groq request failed with status ${res.status}`;
    if (res.status === 429 || res.status >= 500) throw new RetryableGroqError(message);
    throw new Error(message);
  }

  const data: { choices: { message: { content: string } }[] } = await res.json();
  const raw = data.choices[0]?.message.content?.trim();
  if (!raw) throw new Error('Groq returned an empty response.');

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('Could not parse the translation - please try again.');
  }
}

async function callGroqJson<T>(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<T> {
  if (!API_KEY) {
    throw new Error('Translation is not configured (VITE_GROQ_API_KEY is unset).');
  }
  for (let attempt = 0; ; attempt++) {
    try {
      return await callGroqJsonOnce<T>(systemPrompt, userPrompt, maxTokens);
    } catch (err) {
      if (!(err instanceof RetryableGroqError)) throw err;
      if (attempt >= MAX_RETRIES) {
        throw new Error('Translation is busy right now - please try again in a minute.');
      }
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
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

export async function translateArticle(article: TranslatableArticle, languageName: string): Promise<TranslatedArticle> {
  const systemPrompt = `You are a professional translator. Translate the given English fitness-article text into ${languageName}, one of India's official languages. Translate naturally and fluently, the way a native speaker would write it - not a literal word-for-word translation. Keep the brand name "Born to Fire" unchanged wherever it appears. Respond with ONLY a single valid JSON object in the exact shape requested - no commentary, no markdown fences.`;

  const titleTask = () =>
    callGroqJson<{ title: string }>(
      systemPrompt,
      `Translate this article title into ${languageName}. Respond as JSON: {"title": "..."}\n\nTitle: ${article.title}`,
      300
    );

  const chunks = chunk(article.content, PARAGRAPHS_PER_CHUNK);
  const chunkTasks = chunks.map((group) => () =>
    callGroqJson<{ paragraphs: string[] }>(
      systemPrompt,
      `Translate each of the following ${group.length} paragraph(s) into ${languageName}. Keep them as separate paragraphs, in the same order. Respond as JSON: {"paragraphs": ["...", ...]} with exactly ${group.length} item(s).\n\n${group
        .map((p, i) => `Paragraph ${i + 1}: ${p}`)
        .join('\n\n')}`,
      4000
    )
  );

  // Title and content chunks share one concurrency-limited pool (rather
  // than two separate pools) so the request count that matters for
  // Groq's rate limit is "chunks + 1", not "chunks" twice over.
  type Result = { title: string } | { paragraphs: string[] };
  const [titleResult, ...chunkResults] = await runLimited<Result>([titleTask, ...chunkTasks], MAX_CONCURRENT_REQUESTS);

  const content = chunkResults.flatMap((r) => ('paragraphs' in r ? r.paragraphs : []));
  if (content.length === 0) {
    throw new Error('Translation came back empty - please try again.');
  }

  return { title: 'title' in titleResult ? titleResult.title : article.title, content };
}
