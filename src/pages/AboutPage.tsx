import { Target, Eye, Heart, Dumbbell, Wallet, Home, Clock, TrendingUp } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { TiltCard } from '@/components/TiltCard';
import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';
import { useRouter } from '@/lib/router';

const advantages = [
  { icon: Wallet, title: 'Zero cost, zero barriers', text: 'No gym fees, no equipment, no commute. Just you, gravity, and a bit of floor space.' },
  { icon: Home, title: 'Train anywhere', text: 'Your living room, a park, a hostel balcony - calisthenics goes wherever you go.' },
  { icon: Clock, title: 'Time-efficient', text: 'Short, focused sessions that respect your schedule and still deliver results.' },
  { icon: TrendingUp, title: 'Progressive & measurable', text: 'Clear progressions mean you always know what to do next and how far you have come.' },
];

export function AboutPage() {
  const introRef = useReveal<HTMLDivElement>();
  const whyRef = useReveal<HTMLDivElement>();
  const mvRef = useReveal<HTMLDivElement>();
  const { navigate } = useRouter();
  const heroImgRef = useParallax<HTMLImageElement>();

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src="https://images.pexels.com/photos/8520080/pexels-photo-8520080.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
            alt="Athlete exercising on outdoor bars"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            About Born to Fire
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Strength is built, not bought.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            We believe fitness should be accessible to every Indian - no expensive memberships, no
            intimidating gyms. Just the most powerful machine you will ever own: your body.
          </p>
        </div>
      </section>

      {/* What is Calisthenics */}
      <section className="section-pad bg-white dark:bg-gray-900">
        <div ref={introRef} className="reveal container-x mx-auto">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-orange-400/30 to-green-400/20 blur-xl" />
              <img
                src={`${import.meta.env.BASE_URL}about-calisthenics.jpg`}
                alt="Athlete performing a bodyweight bar move outdoors"
                className="relative w-full rounded-[2rem] object-cover shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeading
                eyebrow="The basics"
                title="What is calisthenics?"
                subtitle="Calisthenics is a form of strength training that uses your own bodyweight as resistance. Instead of lifting external weights, you move your body through space using movements like push-ups, pull-ups, squats, and planks."
                center={false}
              />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                The word comes from the Greek words <em>kalos</em> (beauty) and <em>sthenos</em>
                (strength). It is one of the oldest forms of exercise in the world - and it builds
                not just muscle, but coordination, balance, mobility, and body control that
                translates to real life.
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Because every movement is scalable, calisthenics meets you exactly where you are.
                A complete beginner and a seasoned athlete can train the same fundamental
                movement - just at different progressions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose calisthenics */}
      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={whyRef} className="reveal container-x mx-auto">
          <SectionHeading
            eyebrow="Why choose it"
            title="Why calisthenics beats the gym"
            subtitle="Traditional gyms build isolated muscle. Calisthenics builds a body that moves well, stays healthy, and stays strong for life."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <TiltCard key={a.title} className="card card-hover group p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white dark:bg-orange-500/15 dark:text-orange-400">
                  <a.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-gray-900 dark:text-white">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {a.text}
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-pad bg-white dark:bg-gray-900">
        <div ref={mvRef} className="reveal container-x mx-auto">
          <div className="grid gap-6 md:grid-cols-2">
            <TiltCard className="card card-hover relative overflow-hidden p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                <Target className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-gray-900 dark:text-white">
                Our Mission
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
                To make strength training accessible, affordable, and approachable for every
                Indian - regardless of age, income, or experience. We break down intimidating
                skills into simple, progressive steps anyone can follow.
              </p>
            </TiltCard>
            <TiltCard className="card card-hover relative overflow-hidden p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                <Eye className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-gray-900 dark:text-white">
                Our Vision
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
                A fitter India where movement is a daily habit, not a luxury. We envision parks,
                homes, and rooftops turned into training grounds - and a generation that grows up
                strong, mobile, and confident in their own bodies.
              </p>
            </TiltCard>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl bg-green-50 p-6 text-center dark:bg-green-500/10">
            <Heart className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Every program on Born to Fire is free to follow - because health should never be
              paywalled.
            </p>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => navigate('/programs')} className="btn-primary">
              See the programs <Dumbbell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
