import { knowledgeBase, type KnowledgeChunk } from '@/data/knowledgeBase';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'me', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'to', 'of', 'in', 'on', 'at', 'for',
  'with', 'about', 'as', 'by', 'and', 'or', 'but', 'if', 'so', 'than',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might',
  'what', 'when', 'where', 'which', 'who', 'how', 'why', 'not', 'no',
]);

// Deliberately conservative — only strips suffixes long enough that a false
// merge is unlikely, so unrelated short words don't collide.
function stem(token: string): string {
  if (token.length > 6 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 5 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 2 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

interface IndexedChunk extends KnowledgeChunk {
  termFreq: Map<string, number>;
  length: number;
}

interface SearchIndex {
  chunks: IndexedChunk[];
  df: Map<string, number>;
  avgLength: number;
}

// Title terms count several times over — a title match (i.e. the question
// itself) is a much stronger relevance signal than a term buried in the body.
const TITLE_WEIGHT = 5;

function buildIndex(chunks: KnowledgeChunk[]): SearchIndex {
  const indexed: IndexedChunk[] = chunks.map((chunk) => {
    const titleTokens = tokenize(chunk.title);
    const bodyTokens = tokenize(chunk.text);
    const tokens = [...Array(TITLE_WEIGHT).fill(titleTokens).flat(), ...bodyTokens];
    const termFreq = new Map<string, number>();
    for (const token of tokens) termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    return { ...chunk, termFreq, length: tokens.length };
  });

  const df = new Map<string, number>();
  for (const chunk of indexed) {
    for (const term of chunk.termFreq.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const avgLength = indexed.reduce((sum, c) => sum + c.length, 0) / indexed.length;

  return { chunks: indexed, df, avgLength };
}

const index = buildIndex(knowledgeBase);

const K1 = 1.5;
const B = 0.75;

function bm25Score(queryTokens: string[], chunk: IndexedChunk): number {
  const n = index.chunks.length;
  let score = 0;
  for (const term of queryTokens) {
    const freq = chunk.termFreq.get(term);
    if (!freq) continue;
    const docsWithTerm = index.df.get(term) ?? 0;
    const idf = Math.log(1 + (n - docsWithTerm + 0.5) / (docsWithTerm + 0.5));
    const denom = freq + K1 * (1 - B + (B * chunk.length) / index.avgLength);
    score += idf * ((freq * (K1 + 1)) / denom);
  }
  return score;
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

const MIN_SCORE = 0.35;
// A chunk matching only a small minority of the query's distinct terms is
// usually an accidental single-word collision, not a real answer — require
// at least half of them to actually appear in the chunk.
const MIN_MATCH_RATIO = 0.5;

export function searchKnowledgeBase(query: string, topN = 1): SearchResult[] {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) return [];

  return index.chunks
    .map((chunk) => {
      const matched = queryTokens.filter((t) => chunk.termFreq.has(t)).length;
      return { chunk, score: bm25Score(queryTokens, chunk), matchRatio: matched / queryTokens.length };
    })
    .filter((r) => r.score >= MIN_SCORE && r.matchRatio >= MIN_MATCH_RATIO)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
