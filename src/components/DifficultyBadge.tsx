import type { Difficulty } from '@/data/content';

const styles: Record<Difficulty, string> = {
  Beginner: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Intermediate: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  Advanced: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return <span className={`badge ${styles[level]}`}>{level}</span>;
}
