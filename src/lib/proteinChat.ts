// Client-side Groq call powering the Tools page's food-to-protein chatbot —
// same "no backend, ship the key to the browser" tradeoff as groqChat.ts,
// but deliberately its own API key (VITE_GROQ_PROTEIN_API_KEY) rather than
// reusing VITE_GROQ_API_KEY, so either can be rotated independently if
// abused. See groqChat.ts's SECURITY NOTE for the full reasoning — it
// applies unchanged here.
const API_KEY = import.meta.env.VITE_GROQ_PROTEIN_API_KEY;
// See groqChat.ts's comment on MODEL — same retirement, same replacement,
// same reasoning-effort tradeoff.
const MODEL = 'openai/gpt-oss-120b';
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
  if (!API_KEY) {
    throw new Error('This tool is not configured (VITE_GROQ_PROTEIN_API_KEY is unset).');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
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
      temperature: 0.2,
      max_tokens: 400,
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
