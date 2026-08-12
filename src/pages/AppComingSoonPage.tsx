import { ArrowLeft, Smartphone } from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { NewsletterForm } from '@/components/NewsletterForm';
import { useRouter } from '@/lib/router';

// Reached from the Footer's QR code (scan) or the "Get the App" link (click)
// — not in navLinks, since it's not a marketing destination so much as a
// landing spot for that one specific action, same reasoning as ProfilePage.
// There's no real app yet, so this deliberately doesn't promise a store
// listing or download link - just a coming-soon notice plus the same
// newsletter signup used in the Footer, so interested visitors have
// somewhere to leave their email.
export function AppComingSoonPage() {
  const { navigate } = useRouter();

  return (
    <div className="pt-16 sm:pt-20">
      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-sky-300',
              size: 'h-80 w-80',
              position: { top: '-5rem', right: '-6rem' },
              x: [0, -50, 0],
              y: [0, 35, 0],
              scale: [1, 1.15, 1],
              duration: 24,
            },
            {
              color: 'bg-cyan-200',
              size: 'h-64 w-64',
              position: { bottom: '-3rem', left: '5%' },
              x: [0, 40, 0],
              y: [0, -25, 0],
              duration: 28,
            },
          ]}
        />
        <div className="relative z-10 container-x mx-auto max-w-xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
            <Smartphone className="h-8 w-8" />
          </span>
          <SectionHeading
            eyebrow="Mobile app"
            title="App Coming Soon"
            subtitle="We're building the Born to Fire app - workouts, progress tracking, and community, right from your phone. Leave your email and we'll let you know the moment it's live on the Play Store."
          />

          <div className="mt-8 flex justify-center">
            <NewsletterForm variant="light" className="w-full max-w-sm" />
          </div>

          <button onClick={() => navigate('/')} className="btn-outline mt-8">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
        </div>
      </section>
    </div>
  );
}
