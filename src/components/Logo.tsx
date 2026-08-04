import { Flame } from 'lucide-react';

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 outline-none"
      aria-label="Born to Fire — home"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30 transition-transform duration-300 group-hover:scale-105">
        <Flame className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl ring-2 ring-orange-400/0 transition-all duration-300 group-hover:ring-orange-400/60" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
          born to <span className="text-green-500">fire</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          calisthenics
        </span>
      </span>
    </button>
  );
}
