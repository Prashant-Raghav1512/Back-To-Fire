import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CalisthenicsCharacter } from '@/components/CalisthenicsCharacter';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { exercises } from '@/data/content';

export function ExerciseDemo() {
  const [selectedId, setSelectedId] = useState(exercises[0].id);
  const selected = exercises.find((e) => e.id === selectedId) ?? exercises[0];

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-5">
        <div className="relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-green-950 p-8 sm:p-10 lg:col-span-2">
          <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-white/15">
            <Sparkles className="h-3 w-3" /> Interactive demo
          </span>
          <div className="h-56 w-56 sm:h-64 sm:w-64">
            <CalisthenicsCharacter key={selected.id} exerciseId={selected.id} />
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:col-span-3">
          <div className="flex items-center gap-2">
            <DifficultyBadge level={selected.difficulty} />
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold text-gray-900 dark:text-white">
            {selected.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {selected.description}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Choose an exercise
          </p>
          <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedId(ex.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  ex.id === selectedId
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
