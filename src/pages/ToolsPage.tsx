import { useReveal } from '@/lib/useReveal';
import { useParallax } from '@/lib/useParallax';
import { BmiCalculator } from '@/components/BmiCalculator';
import { ProteinCalculator } from '@/components/ProteinCalculator';
import { ProteinChatBot } from '@/components/ProteinChatBot';

export function ToolsPage() {
  const ref = useReveal<HTMLDivElement>();
  const heroImgRef = useParallax<HTMLImageElement>();

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-tools.jpg`}
            alt="Person tracking fitness progress"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
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

      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={ref} className="reveal container-x mx-auto space-y-8">
          <BmiCalculator />
          <ProteinCalculator />
          <ProteinChatBot />
        </div>
      </section>
    </div>
  );
}
