import { useMemo, useState } from 'react';
import { Clock, Sunrise, Flame, Sparkles, Zap, Dumbbell, Apple, Salad, Utensils, ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { ArticleModal } from '@/components/ArticleModal';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { articles } from '@/data/articles';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useParallax } from '@/lib/useParallax';
import type { Article, ArticleCategory } from '@/data/types';

const iconMap = { Sunrise, Flame, Sparkles, Zap, Dumbbell, Apple, Salad, Utensils } as const;

// Each category gets its own color carried across the badge, the icon
// badge, and the card's ring, so a mixed grid reads as three visually
// distinct groups rather than one uniform list of white cards.
const categoryStyles: Record<ArticleCategory, { badge: string; icon: string; ring: string }> = {
  Motivation: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    ring: 'ring-orange-100 dark:ring-orange-500/20',
  },
  Training: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    icon: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    ring: 'ring-green-100 dark:ring-green-500/20',
  },
  Nutrition: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-500/20',
  },
};

const filters: Array<ArticleCategory | 'All'> = ['All', 'Motivation', 'Training', 'Nutrition'];

function ArticleCard({ article, onSelect }: { article: Article; onSelect: (a: Article) => void }) {
  const Icon = iconMap[article.icon as keyof typeof iconMap];
  const tiltRef = useTilt<HTMLDivElement>();
  const style = categoryStyles[article.category];

  return (
    <div
      ref={tiltRef}
      onClick={() => onSelect(article)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(article);
        }
      }}
      role="button"
      tabIndex={0}
      className={`card card-hover tilt-glow group flex cursor-pointer flex-col overflow-hidden text-left !ring-2 ${style.ring}`}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}${article.image}`}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className={`badge absolute right-3 top-3 ${style.badge}`}>
          {article.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
          <Icon className="h-6 w-6" />
        </span>

        <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">{article.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{article.summary}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
            Read <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function ArticlesPage() {
  const ref = useReveal<HTMLDivElement>();
  const heroImgRef = useParallax<HTMLImageElement>();
  const [filter, setFilter] = useState<ArticleCategory | 'All'>('All');
  const [selected, setSelected] = useState<Article | null>(null);

  const filtered = useMemo(
    () => (filter === 'All' ? articles : articles.filter((a) => a.category === filter)),
    [filter]
  );

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cyan-950 py-20 dark:bg-gray-900 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-articles.jpg`}
            alt="Person reading and planning a fitness routine"
            className="h-full w-full object-cover opacity-25"
          />
          {/* Cyan in light mode, unchanged (green-tinted near-black) in dark mode. */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/95 via-cyan-900/85 to-cyan-700/50 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Articles
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Read something that gets you moving
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Motivation to keep showing up, training approaches worth trying, and diet guidance you can
            actually stick to - no fads, no hype.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-teal-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', left: '-6rem' },
              x: [0, 50, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
              duration: 24,
            },
            {
              color: 'bg-cyan-200',
              size: 'h-72 w-72',
              position: { bottom: '-4rem', right: '5%' },
              x: [0, -45, 0],
              y: [0, -25, 0],
              duration: 28,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto">
          <SectionHeading eyebrow="Browse" title="All articles" center={false} />

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  f === filter
                    ? 'bg-green-500 text-gray-900 shadow-md shadow-green-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </section>

      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
