import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';
import { BmiCalculator } from '@/components/BmiCalculator';
import { ProteinCalculator } from '@/components/ProteinCalculator';
import { ProteinChatBot } from '@/components/ProteinChatBot';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';

export function ToolsPage() {
  const ref = useReveal<HTMLDivElement>();
  const heroImgRef = useParallax<HTMLImageElement>();

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cyan-950 py-20 dark:bg-gray-900 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-tools.jpg`}
            alt="Person tracking fitness progress"
            className="h-full w-full object-cover opacity-25"
          />
          {/* Cyan in light mode, unchanged (green-tinted near-black) in dark mode. */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/95 via-cyan-900/85 to-cyan-700/50 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Free tools
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Tools to train smarter
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Quick calculators and an AI-powered protein estimator - no sign-up needed, no
            guesswork.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-amber-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', right: '-6rem' },
              x: [0, -55, 0],
              y: [0, 35, 0],
              scale: [1, 1.15, 1],
              duration: 25,
            },
            {
              color: 'bg-yellow-200',
              size: 'h-64 w-64',
              position: { bottom: '10%', left: '-4rem' },
              x: [0, 40, 0],
              y: [0, -30, 0],
              duration: 21,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto space-y-8">
          <BmiCalculator />
          <ProteinCalculator />
          <ProteinChatBot />
        </div>
      </section>
    </div>
  );
}
