import { useState } from 'react';
import { Calculator } from 'lucide-react';

function bmiCategory(v: number) {
  if (v < 18.5) return { label: 'Underweight', color: 'text-orange-500' };
  if (v < 25) return { label: 'Healthy', color: 'text-green-500' };
  if (v < 30) return { label: 'Overweight', color: 'text-orange-500' };
  return { label: 'Obese', color: 'text-red-500' };
}

export function BmiCalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calcBmi = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(Math.round((w / (h * h)) * 10) / 10);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="bg-gray-900 p-8 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
            <Calculator className="h-3.5 w-3.5" /> Free tool
          </span>
          <h3 className="mt-4 font-display text-2xl font-bold">BMI Calculator</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Your Body Mass Index is a quick way to check if your weight is in a healthy range for
            your height. It is a starting point - not the whole picture. Pair it with calisthenics
            and you will build a body that performs, not just one that scores well on a chart.
          </p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <button onClick={calcBmi} className="btn-primary mt-4 w-full">
            Calculate BMI
          </button>
          {bmi !== null && (
            <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-center dark:bg-gray-700/50">
              <p className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">{bmi}</p>
              <p className={`mt-1 text-sm font-semibold ${bmiCategory(bmi).color}`}>
                {bmiCategory(bmi).label}
              </p>
              <div className="mt-3 flex justify-between text-[10px] font-medium text-gray-400">
                <span>Underweight &lt;18.5</span>
                <span>Healthy 18.5-24.9</span>
                <span>Overweight 25-29.9</span>
                <span>Obese 30+</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
