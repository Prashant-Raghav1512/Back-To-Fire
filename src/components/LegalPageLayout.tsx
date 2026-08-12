import type { ReactNode } from 'react';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

// Shared by TermsPage.tsx and PrivacyPolicyPage.tsx — both are plain
// prose content, so this is just the hero + tinted background shell each
// one drops its sections into, mirroring every other page's
// hero-then-section-pad structure without needing a photo (these are
// utility pages, not marketing ones). Neutral slate/gray tones on purpose
// - every other page's tint ties to that page's own topic/brand color,
// and legal content deliberately doesn't need one.
export function LegalPageLayout({ eyebrow, title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="pt-16 sm:pt-20">
      <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-slate-800/60" />
        <div className="relative container-x mx-auto px-5 sm:px-8">
          <span className="inline-block rounded-full bg-slate-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 ring-1 ring-slate-500/20">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-gray-400">Last updated {lastUpdated}</p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-slate-300',
              size: 'h-80 w-80',
              position: { top: '-5rem', right: '-6rem' },
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
              duration: 26,
            },
            {
              color: 'bg-gray-200',
              size: 'h-64 w-64',
              position: { bottom: '-3rem', left: '-4rem' },
              x: [0, 35, 0],
              y: [0, -25, 0],
              duration: 30,
            },
          ]}
        />
        <div className="relative z-10 container-x mx-auto max-w-3xl">{children}</div>
      </section>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
