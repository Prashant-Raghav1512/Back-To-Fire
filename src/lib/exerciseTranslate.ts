import { neon } from '@neondatabase/serverless';
import { translateBatch } from '@/lib/googleTranslate';

// SECURITY NOTE: same browser-exposed Neon connection as every other
// Community/contact feature — see contact.ts's SECURITY NOTE for why a
// separate role wouldn't add real access restriction on this project. This
// table is just a shared translation cache, not user data.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Translation is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export interface TranslatableExercise {
  name: string;
  description: string;
  steps: string[];
}

export interface TranslatedExercise {
  name: string;
  description: string;
  steps: string[];
}

interface TranslationRow {
  name: string;
  description: string;
  steps: string[];
}

async function getCachedTranslation(exerciseId: string, languageCode: string): Promise<TranslatedExercise | null> {
  const sql = client();
  const rows = (await sql`
    SELECT name, description, steps FROM exercise_translations
    WHERE exercise_id = ${exerciseId} AND language_code = ${languageCode}
  `) as TranslationRow[];
  const row = rows[0];
  return row ? { name: row.name, description: row.description, steps: row.steps } : null;
}

async function saveCachedTranslation(
  exerciseId: string,
  languageCode: string,
  translated: TranslatedExercise
): Promise<void> {
  const sql = client();
  await sql`
    INSERT INTO exercise_translations (exercise_id, language_code, name, description, steps)
    VALUES (${exerciseId}, ${languageCode}, ${translated.name}, ${translated.description}, ${translated.steps})
    ON CONFLICT (exercise_id, language_code) DO UPDATE SET
      name = ${translated.name},
      description = ${translated.description},
      steps = ${translated.steps},
      created_at = now()
  `;
}

// Checks Neon's cache first - the common case after the very first reader
// of a given (exercise, language) pair, which never touches the network
// translation endpoint at all (see src/lib/googleTranslate.ts). Only a
// cache miss actually calls Google and then persists the result for every
// future reader. Muscle group and difficulty are deliberately never
// translated, same as ArticleModal.tsx leaving its category badge in
// English — those read as short fixed labels/tags, not prose.
export async function translateExercise(
  exerciseId: string,
  exercise: TranslatableExercise,
  languageCode: string
): Promise<TranslatedExercise> {
  const cached = await getCachedTranslation(exerciseId, languageCode);
  if (cached) return cached;

  const [name, description, ...steps] = await translateBatch(
    [exercise.name, exercise.description, ...exercise.steps],
    languageCode
  );
  const translated: TranslatedExercise = { name, description, steps };
  await saveCachedTranslation(exerciseId, languageCode, translated);
  return translated;
}
