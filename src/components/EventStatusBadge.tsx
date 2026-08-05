import type { EventStatus } from '@/data/types';

const styles: Record<EventStatus, string> = {
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  ended: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const labels: Record<EventStatus, string> = {
  ongoing: 'Happening now',
  upcoming: 'Upcoming',
  ended: 'Ended',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      {status === 'ongoing' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />}
      {labels[status]}
    </span>
  );
}
