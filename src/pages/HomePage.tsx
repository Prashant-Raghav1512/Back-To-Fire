import { useState } from 'react';
import { ArrowRight, Dumbbell, Activity, Calendar, Move, Check, Star, Users, Clock, MapPin } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { TiltCard } from '@/components/TiltCard';
import { FrameScrubSection } from '@/components/FrameScrubSection';
import { benefits, programs } from '@/data/content';
import { groupEventsByStatus, formatEventDateRange, getEventStatus } from '@/lib/events';
import { useMyEnrollments } from '@/lib/enrollments';
import { useRouter } from '@/lib/router';
import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';
import type { FitnessEvent } from '@/data/types';

const iconMap = { Dumbbell, Activity, Calendar, Move } as const;

export function HomePage() {
  const { navigate } = useRouter();
  const heroRef = useReveal<HTMLDivElement>();
  const introRef = useReveal<HTMLDivElement>();
  const benefitsRef = useReveal<HTMLDivElement>();
  const programsRef = useReveal<HTMLDivElement>();
  const eventsRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();
  const { isEnrolledIn, refresh } = useMyEnrollments();

  const { ongoing, upcoming } = groupEventsByStatus();
  const spotlightEvents = [...ongoing, ...upcoming].slice(0, 3);
  const [selectedEvent, setSelectedEvent] = useState<FitnessEvent | null>(null);
  const heroImgRef = useParallax<HTMLImageElement>();
  const ctaImgRef = useParallax<HTMLImageElement>();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-900 pt-24 sm:pt-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src="https://images.pexels.com/photos/4048236/pexels-photo-4048236.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
            alt="Athlete performing a handstand outdoors"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/80 to-green-900/60" />
          <div className="hero-glow absolute -left-20 top-20 h-72 w-72 rounded-full bg-green-500/30 blur-3xl" />
          <div className="hero-glow absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        <div ref={heroRef} className="reveal relative container-x mx-auto px-5 pb-20 sm:px-8 sm:pb-28 lg:pb-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-green-300 ring-1 ring-white/15 backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-green-400" />
              Calisthenics for India - train anywhere
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              No weights.
              <br />
              No limits.
              <br />
              <span className="bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">
                Master the machine you were born in.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
              Born to Fire is your home for bodyweight training - beginner-friendly programs,
              guided exercises, and a community that helps you build real strength, no gym
              required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => navigate('/programs')} className="btn-primary text-base">
                Explore Programs <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/exercises')}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/25 px-6 py-3 font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/60 hover:bg-white/10 active:scale-95"
              >
                Browse Exercises
              </button>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 text-white">
              {[
                { Icon: Users, label: '10,000+ members' },
                { Icon: Activity, label: '50+ exercises' },
                { Icon: Clock, label: '20-60 min sessions' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-300">
                  <Icon className="h-5 w-5 text-green-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SCROLL-DRIVEN FLEX CHARACTER */}
      <FrameScrubSection />

      {/* INTRODUCTION */}
      <section className="section-pad bg-white dark:bg-gray-900">
        <div ref={introRef} className="reveal container-x mx-auto">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Welcome to Born to Fire"
                title="Your body is the only gym you'll ever need"
                subtitle="We make calisthenics simple, safe, and approachable for everyone - from students on a budget to busy professionals to seniors wanting to stay active. Learn to move with strength and control using structured, progressive programs you can follow at home."
                center={false}
              />
              <ul className="mt-8 space-y-4">
                {[
                  'Step-by-step progressions for every level',
                  'Clear video guidance and form cues',
                  'No equipment, no excuses - just you and gravity',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/about')} className="btn-outline mt-8">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-green-400/30 to-orange-400/20 blur-xl" />
              <img
                src="https://images.pexels.com/photos/6496124/pexels-photo-6496124.jpeg?auto=compress&cs=tinysrgb&h=700&w=900"
                alt="Person doing push-ups at home"
                className="relative w-full rounded-[2rem] object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={benefitsRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Why Calisthenics"
            title="Benefits of training with your bodyweight"
            subtitle="Calisthenics builds functional strength, mobility, and control - all without expensive equipment or gym memberships."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = iconMap[b.icon as keyof typeof iconMap];
              return (
                <TiltCard key={b.title} className="card card-hover group p-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 transition-colors duration-300 group-hover:bg-green-500 group-hover:text-white dark:bg-green-500/15 dark:text-green-400">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-gray-900 dark:text-white">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {b.text}
                  </p>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PROGRAMS */}
      <section className="section-pad bg-white dark:bg-gray-900">
        <div ref={programsRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Featured Programs"
            title="Find the program that fits your level"
            subtitle="Structured, progressive training plans designed to take you from day one to mastery."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {programs.map((p) => (
              <TiltCard key={p.id} className="card card-hover flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <DifficultyBadge level={p.difficulty} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {p.duration}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-gray-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {p.description}
                </p>
                <button
                  onClick={() => navigate('/programs')}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
                >
                  View program <ArrowRight className="h-4 w-4" />
                </button>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS SPOTLIGHT */}
      {spotlightEvents.length > 0 && (
        <section className="section-pad bg-white dark:bg-gray-900">
          <div ref={eventsRef} className="reveal container-x mx-auto">
            <SectionHeading
              eyebrow="Community"
              title="Train with others, not just alone"
              subtitle="Live challenges, workshops, and in-person meetups happening now and coming up."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {spotlightEvents.map((e) => (
                <TiltCard
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setSelectedEvent(e);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="card card-hover flex cursor-pointer flex-col p-6 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <EventStatusBadge status={getEventStatus(e)} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
                    {e.title}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatEventDateRange(e)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {e.location}
                    </span>
                  </div>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors dark:text-green-400">
                    View details <ArrowRight className="h-4 w-4" />
                  </p>
                </TiltCard>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => navigate('/events')} className="btn-outline">
                View all events <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div className="container-x mx-auto">
          <SectionHeading
            eyebrow="Stories"
            title="Loved by beginners across India"
            subtitle="Real people, real progress - no matter where they started."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Aarav, Student - Delhi',
                text: 'I started with wall push-ups and could barely do 5. In 8 weeks I am doing clean pull-ups. The progressions just make sense.',
              },
              {
                name: 'Priya, Professional - Bengaluru',
                text: 'Working from home left me stiff and weak. The 20-minute sessions fit perfectly between meetings. I feel stronger every week.',
              },
              {
                name: 'Mr. Rao, Retired - Hyderabad',
                text: 'At 62 I wanted gentle movement. The beginner mobility work improved my balance and my knees feel better than they have in years.',
              },
            ].map((t) => (
              <TiltCard key={t.name} className="card card-hover p-6">
                <div className="flex gap-1 text-orange-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  "{t.text}"
                </p>
                <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-24">
        <div className="absolute inset-0">
          <img
            ref={ctaImgRef}
            src="https://images.pexels.com/photos/10086629/pexels-photo-10086629.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
            alt="Athlete performing a human flag"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-green-900/70" />
        </div>
        <div ref={ctaRef} className="reveal relative container-x mx-auto px-5 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Your fitness journey starts with one rep.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-300">
            Join thousands of Indians building strength at home. Pick a program, start today, and
            feel the difference in four weeks.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate('/programs')} className="btn-primary text-base">
              Start your journey <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/25 px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10 active:scale-95"
            >
              Talk to us
            </button>
          </div>
        </div>
      </section>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          enrolled={isEnrolledIn('event', selectedEvent.id)}
          onEnrolled={refresh}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
