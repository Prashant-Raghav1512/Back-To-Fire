import { Smartphone, CreditCard, Landmark, Wallet } from 'lucide-react';
import { paymentMethods } from '@/data/paymentMethods';

const METHOD_ICON: Record<string, typeof Smartphone> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
};

interface PaymentMethodSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pay with</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {paymentMethods.map((m) => {
          const Icon = METHOD_ICON[m.id];
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
