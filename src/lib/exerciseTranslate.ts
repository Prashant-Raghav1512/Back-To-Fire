import { translateBatch } from '@/lib/googleTranslate';
import { apiFetch } from '@/lib/dataApi';

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

async function getCachedTranslation(exerciseId: string, languageCode: string): Promise<TranslatedExercise | null> {
  return apiFetch<TranslatedExercise | null>(
    `/translations/exercise?exerciseId=${encodeURIComponent(exerciseId)}&lang=${encodeURIComponent(languageCode)}`
  );
}

async function saveCachedTranslation(
  exerciseId: string,
  languageCode: string,
  translated: TranslatedExercise
): Promise<void> {
  await apiFetch('/translations/exercise', {
    method: 'POST',
    body: JSON.stringify({
      exerciseId,
      languageCode,
      name: translated.name,
      description: translated.description,
      steps: translated.steps,
    }),
  });
}

// Checks the cache first - the common case after the very first reader
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
