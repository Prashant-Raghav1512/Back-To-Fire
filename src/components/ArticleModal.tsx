import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Sunrise, Flame, Sparkles, Zap, Dumbbell, Apple, Salad, Utensils } from 'lucide-react';
import type { Article } from '@/data/types';

const iconMap = { Sunrise, Flame, Sparkles, Zap, Dumbbell, Apple, Salad, Utensils } as const;

const categoryStyles: Record<Article['category'], string> = {
  Motivation: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  Training: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Nutrition: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

interface ArticleModalProps {
  article: Article;
  onClose: () => void;
}

// Mirrors EventModal.tsx: portal straight to <body> so this modal's
// `position: fixed` isn't hijacked by a `transform` on an ancestor (e.g. the
// scroll-reveal animation on the grid it was opened from).
export function ArticleModal({ article, onClose }: ArticleModalProps) {
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

  const Icon = iconMap[article.icon as keyof typeof iconMap];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-64">
          <img
            src={`${import.meta.env.BASE_URL}${article.image}`}
            alt={article.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/10" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
              <Icon className="h-5 w-5" />
            </span>
            <span className={`badge ${categoryStyles[article.category]}`}>{article.category}</span>
          </div>

          <h2 className="mt-4 pr-10 font-display text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl">
            {article.title}
          </h2>
          <span className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>

          <div className="mt-6 space-y-4">
            {article.content.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
