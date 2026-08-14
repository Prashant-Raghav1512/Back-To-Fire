interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }: SectionHeadingProps) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {/* text-green-800, not -700: measured contrast on this bold, small
          (12px) badge text came in at 4.33:1, just under WCAG AA's 4.5:1 —
          green-800 clears it with margin (~6.5:1). */}
      {eyebrow && (
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-500/15 dark:text-green-400">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
