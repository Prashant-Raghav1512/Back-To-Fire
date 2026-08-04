import { useEffect, useMemo, useState } from 'react';
import { Search, X, ArrowRight, Dumbbell, Target } from 'lucide-react';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { fetchExercises } from '@/lib/api';
import type { Difficulty, Exercise } from '@/data/types';
import { useReveal } from '@/lib/useReveal';

type DiffFilter = 'All' | Difficulty;

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [diff, setDiff] = useState<DiffFilter>('All');
  const [muscle, setMuscle] = useState('All');
  const ref = useReveal<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;
    fetchExercises().then((data) => {
      if (!cancelled) {
        setExercises(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const muscleGroups = useMemo(
    () => ['All', ...Array.from(new Set(exercises.map((e) => e.muscleGroup)))],
    [exercises]
  );

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesQuery =
        !query ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase());
      const matchesDiff = diff === 'All' || e.difficulty === diff;
      const matchesMuscle = muscle === 'All' || e.muscleGroup === muscle;
      return matchesQuery && matchesDiff && matchesMuscle;
    });
  }, [exercises, query, diff, muscle]);

  const diffFilters: DiffFilter[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/4803694/pexels-photo-4803694.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
            alt="Man doing pull-ups on blue bars"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Exercise Library
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Master every fundamental movement
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Browse our library of bodyweight exercises. Filter by difficulty or muscle group to
            find exactly what you need.
          </p>
        </div>
      </section>

      {/* Library */}
      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={ref} className="reveal container-x mx-auto">
          {/* Filters */}
          <div className="card p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full rounded-full border-0 bg-gray-100 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Difficulty filter */}
              <div className="flex flex-wrap gap-2">
                {diffFilters.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      diff === d
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle group filter */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Muscle group:
              </span>
              {muscleGroups.map((m) => (
                <button
                  key={m}
                  onClick={() => setMuscle(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    muscle === m
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading exercises...' : `Showing ${filtered.length} of ${exercises.length} exercises`}
          </p>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => (
              <div key={ex.id} className="card card-hover group overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={ex.image}
                    alt={ex.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <DifficultyBadge level={ex.difficulty} />
                  </div>
                  <h3 className="absolute bottom-4 left-4 font-display text-2xl font-bold text-white">
                    {ex.name}
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Target className="h-4 w-4 text-orange-500" />
                    {ex.muscleGroup}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {ex.description}
                  </p>
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <Dumbbell className="h-3.5 w-3.5" /> How to perform
                    </p>
                    <ol className="mt-2 space-y-1.5">
                      {ex.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-green-500">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No exercises match your filters. Try resetting them.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setDiff('All');
                  setMuscle('All');
                }}
                className="btn-outline mt-4"
              >
                Reset filters <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
