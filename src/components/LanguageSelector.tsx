import { Languages, Loader2 } from 'lucide-react';
import { indianLanguages } from '@/data/indianLanguages';

export const ENGLISH = 'en';

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  translating: boolean;
  /** aria-label — say what's being translated, e.g. "Translate this article". */
  label: string;
  className?: string;
}

// Shared dropdown for every on-demand translate feature (ArticleModal.tsx,
// ExerciseModal.tsx, ExerciseGuide.tsx) — just the picker; each caller owns
// its own translation-fetching/caching (translateArticle/translateExercise)
// since what's being translated differs, but the UI and the language list
// (src/data/indianLanguages.ts) don't.
export function LanguageSelector({ value, onChange, translating, label, className = '' }: LanguageSelectorProps) {
  return (
    <label className={`flex items-center gap-1.5 text-gray-400 dark:text-gray-500 ${className}`}>
      <Languages className="h-4 w-4 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={translating}
        aria-label={label}
        className="rounded-full border-0 bg-gray-100 py-1.5 pl-3 pr-7 text-xs font-semibold text-gray-700 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200"
      >
        <option value={ENGLISH}>English (Original)</option>
        {indianLanguages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name} ({l.nativeName})
          </option>
        ))}
      </select>
      {translating && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
    </label>
  );
}
