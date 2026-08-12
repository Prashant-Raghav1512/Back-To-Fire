import { useState } from 'react';
import { ArrowRight, Dumbbell, Activity, Calendar, Move, Check, Star, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { TiltCard } from '@/components/TiltCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { HomeFrameBackground } from '@/components/HomeFrameBackground';
import { benefits, programs } from '@/data/content';
import { groupEventsByStatus, formatEventDateRange, getEventStatus } from '@/lib/events';
import { useMyEnrollments } from '@/lib/enrollments';
import { useRouter } from '@/lib/router';
import { useReveal } from '@/lib/useReveal';
import { useMagnetic } from '@/lib/useMagnetic';
import { DIFFICULTY_CARD_STYLES, EVENT_TYPE_STYLES } from '@/lib/categoryStyles';
import type { FitnessEvent } from '@/data/types';

const iconMap = { Dumbbell, Activity, Calendar, Move } as const;

export function HomePage() {
  const { navigate } = useRouter();
  const heroRef = useReveal<HTMLDivElement>();
  const introRef = useReveal<HTMLDivElement>();
  const benefitsRef = useReveal<HTMLDivElement>();
  const programsRef = useReveal<HTMLDivElement>();
  const eventsRef = useReveal<HTMLDivElement>();
  const testimonialsRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();
  const { isEnrolledIn, refresh } = useMyEnrollments();

  const { ongoing, upcoming } = groupEventsByStatus();
  const spotlightEvents = [...ongoing, ...upcoming].slice(0, 3);
  const [selectedEvent, setSelectedEvent] = useState<FitnessEvent | null>(null);
  const heroCtaRef = useMagnetic<HTMLSpanElement>();
  const closingCtaRef = useMagnetic<HTMLSpanElement>();
  const videoRef = useReveal<HTMLDivElement>();
  const [videoMuted, setVideoMuted] = useState(true);

  return (
    // Forces this page's existing dark: styling on unconditionally, since
    // the frame-scrub sequence is now the page's background throughout —
    // Tailwind's class-strategy dark mode matches any ancestor with this
    // class, not just <html>, so it's scoped to just the Home page and
    // doesn't touch the site-wide light/dark toggle used on every other
    // page.
    <div className="dark relative">
      <HomeFrameBackground />

      {/* HERO */}
      <section className="relative pt-24 sm:pt-28">
        <div ref={heroRef} className="reveal relative z-10 container-x mx-auto px-5 pb-20 sm:px-8 sm:pb-28 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
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
                <span ref={heroCtaRef} className="inline-block">
                  <button onClick={() => navigate('/programs')} className="btn-primary text-base">
                    Explore Programs <ArrowRight className="h-5 w-5" />
                  </button>
                </span>
                <button
                  onClick={() => navigate('/exercises')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/25 px-6 py-3 font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/60 hover:bg-white/10 active:scale-95"
                >
                  Browse Exercises
                </button>
              </div>

              <div className="mt-12 flex flex-wrap gap-8 text-white">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-5 w-5 text-green-400" />
                  <AnimatedCounter end={25} suffix="+" /> Gyms Across India
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Activity className="h-5 w-5 text-green-400" />
                  <AnimatedCounter end={50} suffix="+" /> exercises
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-5 w-5 text-green-400" />
                  20-60 min sessions
                </div>
              </div>
            </div>

            <div className="relative mx-auto hidden aspect-square w-full max-w-sm lg:block">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-green-400/30 to-orange-400/20 blur-xl" />
              <div className="group relative h-full w-full overflow-hidden rounded-full shadow-2xl ring-4 ring-white/15">
                <img
                  src={`${import.meta.env.BASE_URL}hero-event.jpg`}
                  alt="Born to Fire calisthenics event with a competitor performing a handstand on a rig, cheered on by a crowd"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE */}
      <section className="section-pad relative z-10">
        <div ref={videoRef} className="reveal container-x mx-auto">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <SectionHeading
                eyebrow="See it in action"
                title="This is what training at Born to Fire actually looks like"
                subtitle="Real reps, real gyms, real people across India - no stock footage, no filters. Hit play and see the energy for yourself."
                center={false}
              />
              <span className="mt-8 inline-block">
                <button onClick={() => navigate('/programs')} className="btn-primary text-base">
                  Start training <ArrowRight className="h-5 w-5" />
                </button>
              </span>
            </div>
            <div className="relative order-1 mx-auto w-full max-w-xs lg:order-2">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-green-400/30 to-orange-400/20 blur-xl" />
              <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-[2rem] shadow-2xl ring-4 ring-white/10">
                <video
                  src={`${import.meta.env.BASE_URL}videos/btf-showcase.mp4`}
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setVideoMuted((m) => !m)}
                  aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
                  className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors duration-300 hover:bg-black/70"
                >
                  {videoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="section-pad relative z-10">
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
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-green-400/30 to-orange-400/20 blur-xl" />
              <div className="group relative h-full w-full overflow-hidden rounded-full shadow-2xl ring-4 ring-white dark:ring-gray-800">
                <img
                  src={`${import.meta.env.BASE_URL}pushup-home.jpg`}
                  alt="Person doing push-ups at home"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="section-pad relative z-10">
        <div ref={benefitsRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Why Calisthenics"
            title="Benefits of training with your bodyweight"
            subtitle="Calisthenics builds functional strength, mobility, and control - all without expensive equipment or gym memberships."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
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
      <section className="section-pad relative z-10">
        <div ref={programsRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Featured Programs"
            title="Find the program that fits your level"
            subtitle="Structured, progressive training plans designed to take you from day one to mastery."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3 stagger-children">
            {programs.map((p) => (
              <TiltCard
                key={p.id}
                className={`card card-hover flex flex-col p-6 !ring-2 ${DIFFICULTY_CARD_STYLES[p.difficulty].ring}`}
              >
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
        <section className="section-pad relative z-10">
          <div ref={eventsRef} className="reveal container-x mx-auto">
            <SectionHeading
              eyebrow="Community"
              title="Train with others, not just alone"
              subtitle="Live challenges, workshops, and in-person meetups happening now and coming up."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3 stagger-children">
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
                  className={`card card-hover flex cursor-pointer flex-col p-6 text-left !ring-2 ${EVENT_TYPE_STYLES[e.type].ring}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`badge ${EVENT_TYPE_STYLES[e.type].badge}`}>{e.type}</span>
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
              <button onClick={() => navigate('/programs')} className="btn-outline">
                View all events <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section-pad relative z-10">
        <div ref={testimonialsRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Stories"
            title="Loved by beginners across India"
            subtitle="Real people, real progress - no matter where they started."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3 stagger-children">
            {[
              {
                name: 'Aarav, Student - Delhi',
                text: 'I started with wall push-ups and could barely do 5. In 8 weeks I am doing clean pull-ups. The progressions just make sense.',
                photo: 'testimonial-aarav.jpg',
              },
              {
                name: 'Priya, Professional - Bengaluru',
                text: 'Working from home left me stiff and weak. The 20-minute sessions fit perfectly between meetings. I feel stronger every week.',
                photo: 'testimonial-priya.jpg',
              },
              {
                name: 'Mr. Rao, Retired - Hyderabad',
                text: 'At 62 I wanted gentle movement. The beginner mobility work improved my balance and my knees feel better than they have in years.',
                photo: 'testimonial-rao.jpg',
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
                <div className="mt-4 flex items-center gap-3">
                  <div className="group h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-700">
                    <img
                      src={`${import.meta.env.BASE_URL}${t.photo}`}
                      alt={t.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="relative z-10 py-20 sm:py-24">
        <div ref={ctaRef} className="reveal relative container-x mx-auto px-5 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Your fitness journey starts with one rep.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-300">
            Join thousands of Indians building strength at home. Pick a program, start today, and
            feel the difference in four weeks.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <span ref={closingCtaRef} className="inline-block">
              <button onClick={() => navigate('/programs')} className="btn-primary text-base">
                Start your journey <ArrowRight className="h-5 w-5" />
              </button>
            </span>
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
