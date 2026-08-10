import { Sprout, Flame, Zap, Check, ArrowRight, Clock, BarChart3 } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { EnrollButton } from '@/components/EnrollButton';
import { TiltCard } from '@/components/TiltCard';
import { MembershipPlans } from '@/components/MembershipPlans';
import { GymBranchLocator } from '@/components/GymBranchLocator';
import { programs } from '@/data/content';
import { useMyEnrollments } from '@/lib/enrollments';
import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';

const iconMap = { Sprout, Flame, Zap } as const;

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
            src="https://images.pexels.com/photos/8519690/pexels-photo-8519690.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
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
      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={ref} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Choose your tier"
            title="Three paths. One goal - mastery."
            subtitle="Each program is a complete journey with clear weekly progressions, rest days, and milestones."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3 stagger-children">
            {programs.map((p) => {
              const Icon = iconMap[p.icon as keyof typeof iconMap];
              const featured = p.difficulty === 'Intermediate';
              return (
                <TiltCard
                  key={p.id}
                  className={`card card-hover relative flex flex-col p-7 ${
                    featured ? 'ring-2 ring-green-500 lg:scale-[1.03]' : ''
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                      Most popular
                    </span>
                  )}
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
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
