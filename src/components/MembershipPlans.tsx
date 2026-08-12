import { useState } from 'react';
import { Check, Sprout, Flame, Crown } from 'lucide-react';
import { EnrollButton } from '@/components/EnrollButton';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { TiltCard } from '@/components/TiltCard';
import { SectionHeading } from '@/components/SectionHeading';
import { ageGroups, paidPlans } from '@/data/paidPlans';
import { paymentMethods } from '@/data/paymentMethods';
import { useMyEnrollments } from '@/lib/enrollments';
import type { AgeGroupId, PlanTier } from '@/data/types';

const TIER_ICON: Record<PlanTier, typeof Sprout> = { Basic: Sprout, Standard: Flame, Premium: Crown };

export function MembershipPlans() {
  const [activeGroup, setActiveGroup] = useState<AgeGroupId>('adults');
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({});
  // Tracks which plans have had "Choose <Tier>" clicked once already — the
  // payment method picker only appears after that first opt-in click,
  // instead of being shown upfront for every plan.
  const [optedIn, setOptedIn] = useState<Record<string, boolean>>({});
  const { isEnrolledIn, refresh } = useMyEnrollments();

  const group = ageGroups.find((g) => g.id === activeGroup)!;
  const plans = paidPlans.filter((p) => p.ageGroup === activeGroup);

  return (
    <div>
      <SectionHeading
        eyebrow="Paid coaching"
        title="Coaching programs for every age group"
        subtitle="Calisthenics lessons, access to your nearest gym branch, and a diet plan on every plan - 1-on-1 personal training on Premium."
      />

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {ageGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              g.id === activeGroup
                ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {g.label} <span className="opacity-75">({g.ageRange})</span>
          </button>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-gray-500 dark:text-gray-400">{group.description}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = TIER_ICON[plan.tier];
          const featured = plan.tier === 'Premium';
          const enrolled = isEnrolledIn('program', plan.id);
          const selectedMethodId = selectedMethods[plan.id] ?? null;
          const selectedMethodLabel = paymentMethods.find((m) => m.id === selectedMethodId)?.label;
          return (
            <TiltCard
              key={plan.id}
              className={`card card-hover relative flex flex-col p-7 ${
                featured ? 'ring-2 ring-green-500 lg:scale-[1.03]' : ''
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  Includes personal trainer
                </span>
              )}
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                <Icon className="h-8 w-8" />
              </span>
              <span className="badge mt-5 w-fit bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {plan.tier}
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">{plan.title}</h3>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-gray-900 dark:text-white">
                  &#8377;{plan.price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {!enrolled && !optedIn[plan.id] && (
                <button
                  onClick={() => setOptedIn((prev) => ({ ...prev, [plan.id]: true }))}
                  className={`mt-4 w-full ${featured ? 'btn-primary' : 'btn-outline'}`}
                >
                  Choose {plan.tier}
                </button>
              )}

              {!enrolled && optedIn[plan.id] && (
                <div className="mt-6">
                  <PaymentMethodSelector
                    selected={selectedMethodId}
                    onSelect={(id) => setSelectedMethods((prev) => ({ ...prev, [plan.id]: id }))}
                  />
                </div>
              )}

              {(enrolled || optedIn[plan.id]) && (
                <EnrollButton
                  itemType="program"
                  itemId={plan.id}
                  itemTitle={plan.title}
                  itemDetail={`₹${plan.price.toLocaleString('en-IN')}/mo · ${group.label} · ${plan.tier}${
                    selectedMethodLabel ? ` · Pay via ${selectedMethodLabel}` : ''
                  }`}
                  enrolled={enrolled}
                  disabled={!enrolled && !selectedMethodId}
                  onEnrolled={refresh}
                  label={`Confirm ${plan.tier}`}
                  className={`mt-4 w-full ${featured ? 'btn-primary' : 'btn-outline'}`}
                />
              )}
              {!enrolled && optedIn[plan.id] && !selectedMethodId && (
                <p className="mt-2 text-center text-xs text-gray-400">Select a payment method to continue</p>
              )}
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
}
