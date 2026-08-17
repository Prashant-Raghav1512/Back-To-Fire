import { searchKnowledgeBase } from '@/lib/search';

// SECURITY NOTE: this key is shipped in the client bundle and is visible to
// anyone who opens devtools — there is no backend on this static site to
// hide it behind. It's a Groq free-tier key, so the realistic worst case is
// someone burning your rate limit rather than a real bill, but rotate it via
// GroqCloud (console.groq.com/keys) and update the VITE_GROQ_API_KEY secret
// if it's ever abused.
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
// llama-3.3-70b-versatile was retired from Groq's catalog (confirmed via
// GET /v1/models — it no longer appears at all) and started failing every
// request with a 404 model_not_found. gpt-oss-120b is a reasoning model —
// unlike llama-3.3, it spends some of its token budget "thinking" before
// answering, silently returning empty content if max_tokens is too tight
// for that (confirmed by testing) — reasoning_effort: 'low' keeps that
// overhead small enough to fit the budget below reliably.
const MODEL = 'openai/gpt-oss-120b';
const CONTEXT_CHUNKS = 3;
const HISTORY_TURNS = 6;

const SYSTEM_PROMPT = `You are Uncle Baiyanpuria, the friendly in-app chat assistant for Born to Fire, a calisthenics and home fitness platform for India. If asked your name, you are Uncle Baiyanpuria. Answer the visitor's question using ONLY the context below - don't invent programs, exercises, prices, or facts that aren't in it. Keep answers short and conversational (2-4 sentences).

If the context doesn't contain a real answer to the question, say you don't have that information and suggest using the contact form on this page or emailing hello@borntofire.in - don't guess.`;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateChatResponse(
  userMessage: string,
  history: ChatTurn[]
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Chat is not configured (VITE_GROQ_API_KEY is unset).');
  }

  const matches = searchKnowledgeBase(userMessage, CONTEXT_CHUNKS);
  const context = matches.length
    ? matches.map((m) => `### ${m.chunk.title}\n${m.chunk.text}`).join('\n\n')
    : '(No matching information found in the knowledge base for this question.)';

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nContext:\n${context}` },
    ...history.slice(-HISTORY_TURNS),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 300,
      reasoning_effort: 'low',
    }),
  });

  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Groq request failed with status ${res.status}`);
  }

  const data: { choices: { message: { content: string } }[] } = await res.json();
  const reply = data.choices[0]?.message.content?.trim();
  if (!reply) throw new Error('Groq returned an empty response.');
  return reply;
}
