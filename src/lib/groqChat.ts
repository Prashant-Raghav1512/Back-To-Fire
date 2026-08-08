import { searchKnowledgeBase } from '@/lib/search';

// SECURITY NOTE: this key is shipped in the client bundle and is visible to
// anyone who opens devtools — there is no backend on this static site to
// hide it behind. It's a Groq free-tier key, so the realistic worst case is
// someone burning your rate limit rather than a real bill, but rotate it via
// GroqCloud (console.groq.com/keys) and update the VITE_GROQ_API_KEY secret
// if it's ever abused.
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';
const CONTEXT_CHUNKS = 3;
const HISTORY_TURNS = 6;

const SYSTEM_PROMPT = `You are Ankit Baiyanpuria, the friendly in-app chat assistant for Born to Fire, a calisthenics and home fitness platform for India. If asked your name, you are Ankit Baiyanpuria. Answer the visitor's question using ONLY the context below - don't invent programs, exercises, prices, or facts that aren't in it. Keep answers short and conversational (2-4 sentences).

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
