import { useState } from 'react';
import { Beef } from 'lucide-react';

type ActivityLevel = 'sedentary' | 'light' | 'intense';

// Grams of protein per kg of bodyweight per day, by training load — the
// 0.8 g/kg baseline is the standard sedentary RDA; 1.2 and 1.8 sit inside
// the widely-cited 1.6-2.2 g/kg range for people doing regular resistance
// training, scaled down for "light" so the three options stay clearly
// ordered rather than clustering near the top of that range.
const PROTEIN_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 0.8,
  light: 1.2,
  intense: 1.8,
};

export function ProteinCalculator() {
  const [proteinWeight, setProteinWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [protein, setProtein] = useState<number | null>(null);

  const calcProtein = () => {
    const w = parseFloat(proteinWeight);
    if (w > 0) {
      setProtein(Math.round(w * PROTEIN_MULTIPLIER[activityLevel]));
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="bg-gray-900 p-8 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
            <Beef className="h-3.5 w-3.5" /> Free tool
          </span>
          <h3 className="mt-4 font-display text-2xl font-bold">Protein Intake Calculator</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Protein is what your muscles rebuild from after every training session. Your daily
            target scales with your bodyweight and how often you train - use this to get a
            whole-day starting point, then adjust from there.
          </p>
        </div>
        <div className="p-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Weight (kg)
            </label>
            <input
              type="number"
              value={proteinWeight}
              onChange={(e) => setProteinWeight(e.target.value)}
              placeholder="65"
              className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training level
            </label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="sedentary">Sedentary (little to no training)</option>
              <option value="light">Training 2-3x/week</option>
              <option value="intense">Intense calisthenics, 4+x/week</option>
            </select>
          </div>
          <button onClick={calcProtein} className="btn-primary mt-4 w-full">
            Calculate Protein Target
          </button>
          {protein !== null && (
            <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-center dark:bg-gray-700/50">
              <p className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">
                {protein}g
              </p>
              <p className="mt-1 text-sm font-semibold text-green-500">per day</p>
              <p className="mt-3 text-xs font-medium text-gray-400">
                About {Math.round(protein / 4)}g per meal across 4 meals
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
