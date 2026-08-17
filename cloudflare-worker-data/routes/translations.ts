import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString } from '../validate';

function isStringArray(v: unknown, maxItems: number, maxItemLength: number): v is string[] {
  return Array.isArray(v) && v.length <= maxItems && v.every((s) => typeof s === 'string' && s.length <= maxItemLength);
}

interface ArticleTranslationRow {
  title: string;
  content: string[];
}

export async function getArticleTranslation(
  env: Env,
  articleId: string,
  languageCode: string,
  headers: HeadersInit
): Promise<Response> {
  if (!articleId || !languageCode) return errorResponse('Missing articleId/lang.', headers);
  const sql = db(env);
  const rows = (await sql`
    SELECT title, content FROM article_translations WHERE article_id = ${articleId} AND language_code = ${languageCode}
  `) as ArticleTranslationRow[];
  const row = rows[0];
  return json(row ? { title: row.title, content: row.content } : null, headers);
}

interface SaveArticleBody {
  articleId: string;
  languageCode: string;
  title: string;
  content: string[];
}

function isSaveArticleBody(body: unknown): body is SaveArticleBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.articleId, 200) &&
    isNonEmptyString(b.languageCode, 10) &&
    isNonEmptyString(b.title, 500) &&
    isStringArray(b.content, 200, 10000)
  );
}

export async function saveArticleTranslation(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isSaveArticleBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO article_translations (article_id, language_code, title, content)
    VALUES (${body.articleId}, ${body.languageCode}, ${body.title}, ${body.content})
    ON CONFLICT (article_id, language_code) DO UPDATE SET title = ${body.title}, content = ${body.content}, created_at = now()
  `;
  return json({ ok: true }, headers);
}

interface ExerciseTranslationRow {
  name: string;
  description: string;
  steps: string[];
}

export async function getExerciseTranslation(
  env: Env,
  exerciseId: string,
  languageCode: string,
  headers: HeadersInit
): Promise<Response> {
  if (!exerciseId || !languageCode) return errorResponse('Missing exerciseId/lang.', headers);
  const sql = db(env);
  const rows = (await sql`
    SELECT name, description, steps FROM exercise_translations WHERE exercise_id = ${exerciseId} AND language_code = ${languageCode}
  `) as ExerciseTranslationRow[];
  const row = rows[0];
  return json(row ? { name: row.name, description: row.description, steps: row.steps } : null, headers);
}

interface SaveExerciseBody {
  exerciseId: string;
  languageCode: string;
  name: string;
  description: string;
  steps: string[];
}

function isSaveExerciseBody(body: unknown): body is SaveExerciseBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.exerciseId, 200) &&
    isNonEmptyString(b.languageCode, 10) &&
    isNonEmptyString(b.name, 500) &&
    isNonEmptyString(b.description, 5000) &&
    isStringArray(b.steps, 100, 2000)
  );
}

export async function saveExerciseTranslation(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isSaveExerciseBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO exercise_translations (exercise_id, language_code, name, description, steps)
    VALUES (${body.exerciseId}, ${body.languageCode}, ${body.name}, ${body.description}, ${body.steps})
    ON CONFLICT (exercise_id, language_code) DO UPDATE SET
      name = ${body.name}, description = ${body.description}, steps = ${body.steps}, created_at = now()
  `;
  return json({ ok: true }, headers);
}
