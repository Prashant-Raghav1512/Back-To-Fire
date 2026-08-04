import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Dumbbell } from 'lucide-react';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import type { Exercise } from '@/data/types';

interface ExerciseModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseModal({ exercise, onClose }: ExerciseModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Rendered via a portal straight to <body> — this page nests it inside an
  // ancestor with a scroll-reveal animation, and a CSS `transform` on any
  // ancestor (even one left behind by animation-fill-mode: forwards) turns
  // that ancestor into the containing block for `position: fixed`,
  // silently breaking full-viewport centering.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 shrink-0">
          <img src={exercise.image} alt={exercise.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-5 top-5">
            <DifficultyBadge level={exercise.difficulty} />
          </div>
          <h2 className="absolute bottom-5 left-5 right-5 font-display text-3xl font-bold text-white">
            {exercise.name}
          </h2>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Target className="h-4 w-4 text-orange-500" />
            {exercise.muscleGroup}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {exercise.description}
          </p>
          <div className="mt-5 rounded-2xl bg-gray-50 p-5 dark:bg-gray-700/50">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Dumbbell className="h-3.5 w-3.5" /> How to perform
            </p>
            <ol className="mt-3 space-y-3">
              {exercise.steps.map((step, i) => (
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
    </div>,
    document.body
  );
}
