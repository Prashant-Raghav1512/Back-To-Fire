import { searchKnowledgeBase } from '@/lib/search';

// The Groq API key itself lives server-side now, as a Cloudflare Worker
// secret (see cloudflare-worker/) — this only needs the Worker's own URL,
// which isn't a secret (it's just an endpoint address). See
// cloudflare-worker/README.md for how the Worker is deployed/configured.
// Model choice and reasoning_effort tuning live in the Worker now too (see
// worker.ts) — the client no longer picks the model.
const PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL;
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
  if (!PROXY_URL) {
    throw new Error('Chat is not configured (VITE_GROQ_PROXY_URL is unset).');
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

  const res = await fetch(`${PROXY_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature: 0.3, max_tokens: 300 }),
  });

  if (!res.ok) {
    const body: { error?: { message?: string } } = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Chat service request failed with status ${res.status}`);
  }

  const data: { choices: { message: { content: string } }[] } = await res.json();
  const reply = data.choices[0]?.message.content?.trim();
  if (!reply) throw new Error('Chat service returned an empty response.');
  return reply;
}
