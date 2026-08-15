// Calls the Groq proxy (cloudflare-worker/, see its README) at a separate
// /protein route from the main chatbot's /chat — same Worker, but backed
// by its own GROQ_PROTEIN_KEY secret so either can be rotated
// independently if abused, same reasoning as when these were two separate
// client-side env vars (see groqChat.ts).
const PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL;
const HISTORY_TURNS = 6;

const SYSTEM_PROMPT = `You are a nutrition assistant on Born to Fire, a calisthenics and home fitness platform. The visitor will describe what they ate (a meal, a whole day, or just one food item, in any amount of detail). Your job:

1. Identify each distinct food/drink item and its quantity. If no quantity is given, assume a typical single serving and say so.
2. Estimate the grams of protein each item contributes, using general nutritional knowledge (e.g. a large egg is ~6g protein, 100g cooked chicken breast is ~31g, a glass of milk is ~8g).
3. List each item with its estimated protein in grams, then give a clear TOTAL at the end.
4. Keep it short and scannable — a line per item, then the total. No long paragraphs.
5. These are estimates, not lab measurements — say so briefly if it's the first message, don't repeat it every turn.
6. If the message doesn't describe any food, ask what they ate instead of guessing.`;

export interface ProteinChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function estimateProteinFromFood(
  userMessage: string,
  history: ProteinChatTurn[]
): Promise<string> {
  if (!PROXY_URL) {
    throw new Error('This tool is not configured (VITE_GROQ_PROXY_URL is unset).');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-HISTORY_TURNS),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(`${PROXY_URL}/protein`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      temperature: 0.2,
      max_tokens: 400,
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
