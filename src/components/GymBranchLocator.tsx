import { MapPin, Navigation, Phone, Clock, Loader2 } from 'lucide-react';
import { useNearestBranches } from '@/lib/gymBranches';

export function GymBranchLocator() {
  const { branches, status, error, locate } = useNearestBranches();

  return (
    <div>
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Find your nearest branch
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Every paid plan includes access to whichever branch is closest to you.
          </p>
        </div>
        <button
          onClick={locate}
          disabled={status === 'locating'}
          className="btn-outline shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'locating' ? (
            <>
              Locating... <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              Use my location <Navigation className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {status === 'unsupported' && (
        <p className="mt-3 text-sm text-orange-500">
          Your browser doesn't support location — browse the list below instead.
        </p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-sm text-orange-500">{error} You can still browse the list below.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b, i) => (
          <div key={b.id} className={`card p-5 ${status === 'done' && i === 0 ? 'ring-2 ring-green-500' : ''}`}>
            {status === 'done' && i === 0 && (
              <span className="badge mb-2 bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                Nearest to you
              </span>
            )}
            <p className="font-display text-lg font-bold text-gray-900 dark:text-white">{b.name}</p>
            <div className="mt-2 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {b.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {b.hours}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {b.phone}
              </span>
            </div>
            {b.distanceKm !== null && (
              <p className="mt-3 text-xs font-semibold text-green-600 dark:text-green-400">
                {b.distanceKm.toFixed(1)} km away
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
