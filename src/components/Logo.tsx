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
          Born to <span className="text-green-500">fire</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          calisthenics
        </span>
      </span>
    </button>
  );
}
