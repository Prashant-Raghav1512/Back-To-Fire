import { useEffect, useState } from 'react';
import { Check, Loader2, Pencil } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useCommunityProfile } from '@/lib/community';
import { indianStates } from '@/data/indianStates';
import type { Gender } from '@/data/types';

const GENDERS: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Name and profile photo are deliberately NOT editable here — Clerk already
// owns both (with its own upload/crop UI for the photo), so this links out
// to Clerk's account modal instead of duplicating that. Everything below
// (state/age/height/weight/gender) is genuinely new data this app owns,
// backed by community_profiles (see src/lib/community.ts) — the same row
// the Community tab's state picker reads/writes, so editing it here also
// updates what state you post to there.
export function ProfileDetailsForm() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { profile, loading, saveDetails } = useCommunityProfile();

  const [state, setState] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setState(profile.state);
    setAge(profile.age?.toString() ?? '');
    setHeightCm(profile.heightCm?.toString() ?? '');
    setWeightKg(profile.weightKg?.toString() ?? '');
    setGender(profile.gender ?? '');
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) {
      setError('Pick a state so people know where you train from.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveDetails({
        state,
        age: age ? Number(age) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        gender: gender || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save, please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <img
          src={user?.imageUrl}
          alt={user?.fullName ?? 'Profile photo'}
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-gray-900 dark:text-white">
            {user?.fullName ?? 'Your name'}
          </p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <button
          onClick={() => openUserProfile()}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <Pencil className="h-3.5 w-3.5" /> Name &amp; photo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 border-t border-gray-100 pt-6 dark:border-gray-700 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">State</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={loading}
            className="mt-1.5 w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
          >
            <option value="" disabled>
              Select your state
            </option>
            {indianStates.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Gender</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            disabled={loading}
            className="mt-1.5 w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Age</span>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={loading}
            placeholder="e.g. 24"
            className="mt-1.5 w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Height (cm)
            </span>
            <input
              type="number"
              min={1}
              max={280}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              disabled={loading}
              placeholder="170"
              className="mt-1.5 w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Weight (kg)
            </span>
            <input
              type="number"
              min={1}
              max={300}
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={loading}
              placeholder="65"
              className="mt-1.5 w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            />
          </label>
        </div>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-primary !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <>
                Saving... <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : saved ? (
              <>
                Saved <Check className="h-4 w-4" />
              </>
            ) : (
              'Save details'
            )}
          </button>
          {error && <p className="ml-4 self-center text-xs text-red-500">{error}</p>}
        </div>
      </form>
    </div>
  );
}
