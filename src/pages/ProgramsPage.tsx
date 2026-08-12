import { Sprout, Flame, Zap, Check, ArrowRight, Clock, BarChart3 } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { EnrollButton } from '@/components/EnrollButton';
import { TiltCard } from '@/components/TiltCard';
import { MembershipPlans } from '@/components/MembershipPlans';
import { GymBranchLocator } from '@/components/GymBranchLocator';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { programs } from '@/data/content';
import { useMyEnrollments } from '@/lib/enrollments';
import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';
import type { Difficulty } from '@/data/types';

const iconMap = { Sprout, Flame, Zap } as const;

// Same color mapping as DifficultyBadge, extended to the card's icon badge
// and ring so a Beginner/Intermediate/Advanced grid reads as three visually
// distinct tiers rather than one uniform list of cards with a small badge
// as the only difference.
const DIFFICULTY_CARD_STYLES: Record<Difficulty, { icon: string; ring: string }> = {
  Beginner: {
    icon: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    ring: 'ring-green-100 dark:ring-green-500/20',
  },
  Intermediate: {
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    ring: 'ring-orange-500',
  },
  Advanced: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-500/20',
  },
};

export function ProgramsPage() {
  const ref = useReveal<HTMLDivElement>();
  const { isEnrolledIn, refresh } = useMyEnrollments();
  const heroImgRef = useParallax<HTMLImageElement>();

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-programs.jpg`}
            alt="Man working out at outdoor gym"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Workout Programs
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Programs built for every level
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Three structured tiers - from your very first push-up to the planche. Pick the one that
            matches where you are today and start where you stand.
          </p>
        </div>
      </section>

      {/* Program cards */}
      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-green-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', left: '-8rem' },
              x: [0, 60, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
              duration: 22,
            },
            {
              color: 'bg-lime-300',
              size: 'h-72 w-72',
              position: { bottom: '-4rem', right: '-4rem' },
              x: [0, -50, 0],
              y: [0, -30, 0],
              duration: 26,
            },
            {
              color: 'bg-emerald-200',
              size: 'h-64 w-64',
              position: { top: '30%', right: '15%' },
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
              duration: 30,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto">
          <SectionHeading
            eyebrow="Choose your tier"
            title="Three paths. One goal - mastery."
            subtitle="Each program is a complete journey with clear weekly progressions, rest days, and milestones."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3 stagger-children">
            {programs.map((p) => {
              const Icon = iconMap[p.icon as keyof typeof iconMap];
              const featured = p.difficulty === 'Intermediate';
              const style = DIFFICULTY_CARD_STYLES[p.difficulty];
              return (
                <TiltCard
                  key={p.id}
                  className={`card card-hover relative flex flex-col p-7 !ring-2 ${style.ring} ${
                    featured ? 'lg:scale-[1.03]' : ''
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                      Most popular
                    </span>
                  )}
                  <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${style.icon}`}>
                    <Icon className="h-8 w-8" />
                  </span>
                  <div className="mt-5 flex items-center gap-2">
                    <DifficultyBadge level={p.difficulty} />
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      <Clock className="h-3 w-3" /> {p.duration}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {p.description}
                  </p>
                  <ul className="mt-5 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <EnrollButton
                    itemType="program"
                    itemId={p.id}
                    itemTitle={p.title}
                    itemDetail={`${p.difficulty} · ${p.duration}`}
                    enrolled={isEnrolledIn('program', p.id)}
                    onEnrolled={refresh}
                    label={`Start ${p.title}`}
                    className={`mt-6 w-full ${featured ? 'btn-primary' : 'btn-outline'}`}
                  />
                </TiltCard>
              );
            })}
          </div>

          {/* Paid membership plans */}
          <div className="mt-20">
            <MembershipPlans />
          </div>

          {/* Gym branch locator */}
          <div className="mt-20">
            <GymBranchLocator />
          </div>

          {/* How it works */}
          <div className="mt-20">
            <SectionHeading
              eyebrow="How it works"
              title="Simple, structured, sustainable"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-3 stagger-children">
              {[
                { icon: BarChart3, step: '01', title: 'Assess your level', text: 'Take a quick self-test to find the right starting tier.' },
                { icon: Clock, step: '02', title: 'Follow the plan', text: 'Train 3-5 days a week with guided sessions and built-in rest.' },
                { icon: ArrowRight, step: '03', title: 'Progress & level up', text: 'Hit your milestones, then move to the next progression.' },
              ].map((s) => (
                <TiltCard key={s.step} className="card card-hover p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-gray-700">
                      <s.icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-3xl font-extrabold text-gray-200 dark:text-gray-700">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {s.text}
                  </p>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
