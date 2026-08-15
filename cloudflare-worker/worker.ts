// Groq API proxy for Born to Fire's two chatbots (the main site assistant
// and the Tools page's protein estimator). Both previously called Groq
// directly from the browser with an API key shipped in the bundle (see
// src/lib/groqChat.ts / proteinChat.ts's old SECURITY NOTE) — this Worker
// moves the actual Groq call server-side so the keys never reach the
// client. It's a thin, mostly-transparent proxy on purpose: the browser
// still does all the RAG/prompt-assembly work (BM25 search, system prompt,
// history slicing) exactly as before and sends the finished `messages`
// array here; this Worker only adds the API key and forwards the request.
//
// Two routes, two separate Groq keys (GROQ_CHAT_KEY / GROQ_PROTEIN_KEY) —
// kept separate rather than merged into one, preserving the original
// "either key can be rotated independently if abused" property from when
// they were two separate client-side env vars.

export interface Env {
  GROQ_CHAT_KEY: string;
  GROQ_PROTEIN_KEY: string;
  /** Comma-separated list of allowed browser origins. */
  ALLOWED_ORIGIN: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProxyRequestBody {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

const MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Generous but bounded — real conversations here are a handful of short
// turns, not hundreds; this just guards against a deliberately huge payload.
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

function corsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function isValidBody(body: unknown): body is ProxyRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as ProxyRequestBody;
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX_MESSAGES) return false;
  return b.messages.every(
    (m) =>
      m &&
      typeof m.content === 'string' &&
      m.content.length > 0 &&
      m.content.length <= MAX_MESSAGE_LENGTH &&
      (m.role === 'system' || m.role === 'user' || m.role === 'assistant')
  );
}

async function proxyToGroq(
  request: Request,
  apiKey: string,
  allowedOrigins: string[],
  defaults: { temperature: number; maxTokens: number }
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const headers = corsHeaders(origin, allowedOrigins);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'This endpoint is not configured.' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  if (!isValidBody(body)) {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // model and the max_tokens ceiling are enforced here, not trusted from
  // the client — a request can ask for fewer tokens than the default, never
  // more.
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages,
      temperature: body.temperature ?? defaults.temperature,
      max_tokens: Math.min(body.max_tokens ?? defaults.maxTokens, defaults.maxTokens),
    }),
  });

  const text = await groqRes.text();
  return new Response(text, {
    status: groqRes.status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
    const url = new URL(request.url);

    if (url.pathname === '/chat') {
      return proxyToGroq(request, env.GROQ_CHAT_KEY, allowedOrigins, { temperature: 0.3, maxTokens: 300 });
    }
    if (url.pathname === '/protein') {
      return proxyToGroq(request, env.GROQ_PROTEIN_KEY, allowedOrigins, { temperature: 0.2, maxTokens: 400 });
    }
    return new Response('Not found', { status: 404 });
  },
};
