// Thin, mostly-transparent proxy in front of Groq's chat completions API.
// The browser still does all the real work (BM25 retrieval, system prompt
// assembly, history slicing - see src/lib/groqChat.ts / proteinChat.ts) and
// sends the finished `messages` array here; this Worker's only job is
// injecting the API key server-side (so it never reaches the browser) and
// forwarding to Groq. Two separate secrets back the two routes so either
// can be rotated independently if abused, same reasoning as when these
// were two separate client-side env vars.
export interface Env {
  GROQ_CHAT_KEY: string;
  GROQ_PROTEIN_KEY: string;
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

// llama-3.3-70b-versatile was retired from Groq's catalog (confirmed via
// GET /v1/models — it no longer appears at all; every request against it
// started failing with a 404 model_not_found). openai/gpt-oss-120b is a
// reasoning model — unlike llama-3.3, it spends part of its token budget
// "thinking" before answering, silently returning empty content if
// max_tokens is too tight for that (confirmed by testing) — REASONING_EFFORT
// 'low' keeps that overhead small enough to reliably leave room for a real
// answer within MAX_TOKENS_CEILING.
const MODEL = 'openai/gpt-oss-120b';
const REASONING_EFFORT = 'low';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOKENS_CEILING = 500;

function corsHeaders(origin: string | null, allowedOrigins: string[]): HeadersInit {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function badRequest(message: string, headers: HeadersInit): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status: 400,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function validateBody(body: unknown): body is ProxyRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX_MESSAGES) {
    return false;
  }
  return b.messages.every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const msg = m as Record<string, unknown>;
    return (
      (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') &&
      typeof msg.content === 'string' &&
      msg.content.length > 0 &&
      msg.content.length <= MAX_MESSAGE_LENGTH
    );
  });
}

async function proxyToGroq(request: Request, apiKey: string, headers: HeadersInit): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON body.', headers);
  }

  if (!validateBody(body)) {
    return badRequest('Invalid request shape.', headers);
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
      max_tokens: Math.min(body.max_tokens ?? MAX_TOKENS_CEILING, MAX_TOKENS_CEILING),
      reasoning_effort: REASONING_EFFORT,
    }),
  });

  const responseBody = await groqRes.text();
  return new Response(responseBody, {
    status: groqRes.status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    const url = new URL(request.url);
    if (url.pathname === '/chat') {
      return proxyToGroq(request, env.GROQ_CHAT_KEY, headers);
    }
    if (url.pathname === '/protein') {
      return proxyToGroq(request, env.GROQ_PROTEIN_KEY, headers);
    }

    return new Response('Not found', { status: 404, headers });
  },
};
