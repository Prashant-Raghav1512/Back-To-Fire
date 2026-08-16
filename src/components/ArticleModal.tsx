import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Sunrise, Flame, Sparkles, Zap, Dumbbell, Apple, Salad, Utensils } from 'lucide-react';
import { LanguageSelector, ENGLISH } from '@/components/LanguageSelector';
import { translateArticle, type TranslatedArticle } from '@/lib/articleTranslate';
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
  const [languageCode, setLanguageCode] = useState(ENGLISH);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, TranslatedArticle>>({});

  useEffect(() => {
    if (languageCode === ENGLISH || cache[languageCode]) return;
    let cancelled = false;
    setTranslating(true);
    setTranslationError(null);
    translateArticle(article.id, { title: article.title, content: article.content }, languageCode)
      .then((translated) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [languageCode]: translated }));
      })
      .catch((err) => {
        if (cancelled) return;
        setTranslationError(err instanceof Error ? err.message : 'Could not translate, please try again.');
        setLanguageCode(ENGLISH);
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode]);

  const displayed: TranslatedArticle =
    languageCode !== ENGLISH && cache[languageCode]
      ? cache[languageCode]
      : { title: article.title, content: article.content };

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
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      <div
        className="modal-panel-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                <Icon className="h-5 w-5" />
              </span>
              <span className={`badge ${categoryStyles[article.category]}`}>{article.category}</span>
            </div>

            <LanguageSelector
              value={languageCode}
              onChange={setLanguageCode}
              translating={translating}
              label="Translate this article"
            />
          </div>

          {translationError && <p className="mt-2 text-xs text-red-500">{translationError}</p>}

          <h2 className="mt-4 pr-10 font-display text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl">
            {displayed.title}
          </h2>
          <span className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>

          <div className="mt-6 space-y-4">
            {displayed.content.map((paragraph, i) => (
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
