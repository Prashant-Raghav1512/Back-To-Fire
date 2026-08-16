import { useEffect, useState } from 'react';
import { Dumbbell, Target } from 'lucide-react';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { LanguageSelector, ENGLISH } from '@/components/LanguageSelector';
import { translateExercise, type TranslatedExercise } from '@/lib/exerciseTranslate';
import { exercises } from '@/data/content';

// Replaced the earlier interactive 3D visualizer (rigged glTF character +
// two-bone IK, see git history) with a plain instructional guide: a pill
// selector over the same 18 exercises, then that exercise's photo alongside
// its numbered steps — the same "image + numbered `steps` list" pattern
// ExerciseModal.tsx already used for the "View full guide" popup, just
// inline on the page instead of in a modal.
export function ExerciseGuide() {
  const [selectedId, setSelectedId] = useState(exercises[0].id);
  const exercise = exercises.find((ex) => ex.id === selectedId) ?? exercises[0];

  const [languageCode, setLanguageCode] = useState(ENGLISH);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  // Keyed by "exerciseId:languageCode", not just languageCode - unlike
  // ExerciseModal.tsx (a fresh instance per exercise), this component stays
  // mounted while the visitor flips between pills, so a language stays
  // "sticky" across exercise switches and a previously-viewed
  // exercise+language pair doesn't need to hit Neon's cache again.
  const [cache, setCache] = useState<Record<string, TranslatedExercise>>({});
  const cacheKey = `${exercise.id}:${languageCode}`;

  useEffect(() => {
    if (languageCode === ENGLISH || cache[cacheKey]) return;
    let cancelled = false;
    setTranslating(true);
    setTranslationError(null);
    translateExercise(exercise.id, { name: exercise.name, description: exercise.description, steps: exercise.steps }, languageCode)
      .then((translated) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [cacheKey]: translated }));
      })
      .catch((err) => {
        if (!cancelled) setTranslationError(err instanceof Error ? err.message : 'Could not translate, please try again.');
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const displayed: TranslatedExercise =
    languageCode !== ENGLISH && cache[cacheKey]
      ? cache[cacheKey]
      : { name: exercise.name, description: exercise.description, steps: exercise.steps };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-gray-100 p-5 dark:border-gray-700">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedId(ex.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              ex.id === selectedId
                ? 'bg-green-500 text-gray-900 shadow-md shadow-green-500/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="group relative h-64 overflow-hidden lg:h-auto">
          <img
            src={exercise.image}
            alt={displayed.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute left-5 top-5">
            <DifficultyBadge level={exercise.difficulty} />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{displayed.name}</h3>
            <LanguageSelector
              value={languageCode}
              onChange={setLanguageCode}
              translating={translating}
              label="Translate these instructions"
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Target className="h-4 w-4 text-orange-500" />
            {exercise.muscleGroup}
          </div>
          {translationError && <p className="mt-2 text-xs text-red-500">{translationError}</p>}
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{displayed.description}</p>
          <div className="mt-5 rounded-2xl bg-gray-50 p-5 dark:bg-gray-700/50">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Dumbbell className="h-3.5 w-3.5" /> How to perform
            </p>
            <ol className="mt-3 space-y-3">
              {displayed.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
