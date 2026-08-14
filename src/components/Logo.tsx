interface LogoProps {
  onClick?: () => void;
  /**
   * True when the logo sits directly on the transparent navbar over a dark
   * hero (no solid navbar background behind it yet) — the theme-aware
   * text-gray-900/dark:text-white pairing goes nearly invisible against a
   * dark hero in light mode, since that pairing only accounts for the
   * site's light/dark theme, not what happens to be behind a transparent
   * header. Forces bright, always-legible text for that case instead.
   */
  onHero?: boolean;
}

export function Logo({ onClick, onHero }: LogoProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 outline-none"
      aria-label="Born to Fire - home"
    >
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Born to Fire"
        className="h-10 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-lg font-extrabold tracking-tight ${
            onHero ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}
        >
          Born to{' '}
          {/* onHero keeps the original vibrant green-500 — it's only ever
              rendered over Home's own dark hero image, where it already has
              excellent contrast. Every other case (every other page, or
              Home once scrolled) uses a darker green-700 in light mode:
              green-500/600 text on a white navbar bg fails WCAG AA
              (2.28/3.30:1 vs the 4.5:1 required). */}
          <span className={onHero ? 'text-green-500' : 'text-green-700 dark:text-green-500'}>
            fire
          </span>
        </span>
        {/* Same onHero guard as "fire" above — the un-guarded pairing here
            was gray-400/dark:gray-500, which happened to still read fine
            over Home's dark hero in light theme (lighter gray-400) even
            though it wasn't designed for that case on purpose. Swapping the
            pair to fix contrast elsewhere would have made it darker (worse)
            specifically in that one Home-hero scenario, so it's frozen to
            its original value there and only fixed for every other case. */}
        <span
          className={`text-[10px] font-medium uppercase tracking-[0.18em] ${
            onHero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          calisthenics
        </span>
      </span>
    </button>
  );
}
