import { useCallback, useState } from 'react';
import { gymBranches } from '@/data/gymBranches';
import type { GymBranch } from '@/data/types';

// Straight-line distance — fine for "which branch is closest" ranking, not
// meant to be driving-distance accurate.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface BranchWithDistance extends GymBranch {
  distanceKm: number | null;
}

export type LocateStatus = 'idle' | 'locating' | 'done' | 'error' | 'unsupported';

// Entirely client-side, no backend — the browser's own Geolocation API
// against the static branch list above. Falls back to an unsorted list
// (distanceKm: null) until the visitor opts in via `locate()`.
export function useNearestBranches() {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('locating');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('done');
      },
      (err) => {
        setError(err.message || 'Could not get your location.');
        setStatus('error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 }
    );
  }, []);

  const branches: BranchWithDistance[] = userCoords
    ? [...gymBranches]
        .map((b) => ({ ...b, distanceKm: haversineKm(userCoords.lat, userCoords.lng, b.lat, b.lng) }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    : gymBranches.map((b) => ({ ...b, distanceKm: null }));

  return { branches, status, error, locate };
}
