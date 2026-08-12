import { useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Youtube, Facebook, Twitter, Check, AlertCircle, Lock } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useParallax } from '@/lib/useParallax';
import { submitContact } from '@/lib/contact';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface ContactInfoCardProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  href: string;
}

function ContactInfoCard({ Icon, label, value, href }: ContactInfoCardProps) {
  const tiltRef = useTilt<HTMLAnchorElement>();
  return (
    <a ref={tiltRef} href={href} className="card card-hover tilt-glow flex items-start gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-1 font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </a>
  );
}

export function ContactPage() {
  const ref = useReveal<HTMLDivElement>();
  const heroImgRef = useParallax<HTMLImageElement>();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!form.email.trim()) e.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.message.trim()) e.message = 'Please enter a message';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (!validate()) return;

    setSending(true);
    setSubmitError(null);
    try {
      await submitContact(form);
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-contact-events.jpg`}
            alt="Two men exercising on outdoor bars"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Get in touch
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            We would love to hear from you
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Questions about a program, partnership ideas, or just want to say hello? Reach out - 
            we usually reply within a day.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-rose-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', left: '-6rem' },
              x: [0, 55, 0],
              y: [0, 35, 0],
              scale: [1, 1.15, 1],
              duration: 23,
            },
            {
              color: 'bg-pink-200',
              size: 'h-64 w-64',
              position: { bottom: '-3rem', right: '10%' },
              x: [0, -35, 0],
              y: [0, -25, 0],
              duration: 27,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact info */}
            <div className="space-y-4">
              {[
                { Icon: Mail, label: 'Email', value: 'hello@borntofire.in', href: 'mailto:hello@borntofire.in' },
                { Icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
                { Icon: MapPin, label: 'Address', value: 'Indiranagar, Bengaluru, Karnataka 560038', href: '#' },
              ].map((c) => (
                <ContactInfoCard key={c.label} Icon={c.Icon} label={c.label} value={c.value} href={c.href} />
              ))}

              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Follow us
                </p>
                <div className="mt-3 flex gap-3">
                  {[Instagram, Youtube, Facebook, Twitter].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-green-500 hover:text-white dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card p-6 sm:p-8">
                <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                  Send us a message
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Fill in the form and we will get back to you shortly.
                </p>

                {sent && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-700 dark:bg-green-500/10 dark:text-green-300">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                      <Check className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium">
                      Thanks! Your message has been recorded - we will be in touch soon.
                    </p>
                  </div>
                )}

                {!isSignedIn && !sent && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-100 p-4 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                      <Lock className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-medium">
                      Sign in to send a message - it only takes a moment.
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium">
                      {submitError} You can also email us directly at{' '}
                      <a href="mailto:hello@borntofire.in" className="underline">
                        hello@borntofire.in
                      </a>
                      .
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className={`mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 transition focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                        errors.name ? 'ring-red-400' : 'ring-transparent'
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className={`mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 transition focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                        errors.email ? 'ring-red-400' : 'ring-transparent'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help?"
                      className={`mt-1.5 w-full resize-none rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 transition focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                        errors.message ? 'ring-red-400' : 'ring-transparent'
                      }`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                    {!isSignedIn ? (
                      <>Sign in to send <Lock className="h-4 w-4" /></>
                    ) : sending ? (
                      'Sending...'
                    ) : (
                      <>Send message <Send className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
