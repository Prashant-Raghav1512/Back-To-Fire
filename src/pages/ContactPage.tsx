import { useState } from 'react';
import type { ComponentType, SVGProps, MouseEvent } from 'react';
import { Mail, Phone, MapPin, Headset, Send, Instagram, Youtube, Facebook, Twitter, Check, AlertCircle, Lock } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useParallax } from '@/lib/useParallax';
import { useRouter } from '@/lib/router';
import { submitContact } from '@/lib/contact';
import type { ContactPurpose } from '@/lib/contact';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { gymBranches } from '@/data/gymBranches';

const CONTACT_PURPOSES: ContactPurpose[] = ['Membership', 'Program', 'Event', 'Others'];

interface FormState {
  name: string;
  email: string;
  phone: string;
  purpose: ContactPurpose | '';
  purposeDetail: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  purpose?: string;
  purposeDetail?: string;
  message?: string;
}

interface ContactInfoCardProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  href: string;
  onClick?: (ev: MouseEvent<HTMLAnchorElement>) => void;
}

function ContactInfoCard({ Icon, label, value, href, onClick }: ContactInfoCardProps) {
  const tiltRef = useTilt<HTMLAnchorElement>();
  return (
    <a ref={tiltRef} href={href} onClick={onClick} className="card card-hover tilt-glow flex items-start gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </a>
  );
}

const branchLocalities = gymBranches.map((b) => b.locality).join(' · ');

export function ContactPage() {
  const ref = useReveal<HTMLDivElement>();
  const heroImgRef = useParallax<HTMLImageElement>();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { navigate } = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    purpose: '',
    purposeDetail: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!form.email.trim()) e.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.purpose) e.purpose = 'Please choose what this is about';
    else if (form.purpose === 'Others' && !form.purposeDetail.trim())
      e.purposeDetail = 'Please tell us what this is about';
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
      await submitContact({ ...form, purpose: form.purpose as ContactPurpose });
      setSent(true);
      setForm({ name: '', email: '', phone: '', purpose: '', purposeDetail: '', message: '' });
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
      <section className="relative overflow-hidden bg-cyan-950 py-20 dark:bg-gray-900 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-contact-events.jpg`}
            alt="Two men exercising on outdoor bars"
            className="h-full w-full object-cover opacity-25"
          />
          {/* Cyan in light mode, unchanged (green-tinted near-black) in dark mode. */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/95 via-cyan-900/85 to-cyan-700/50 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-green-900/60" />
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
                {
                  Icon: Headset,
                  label: '24x7 Support',
                  value: '24x7 support available',
                  href: '#',
                  onClick: (ev: MouseEvent<HTMLAnchorElement>) => ev.preventDefault(),
                },
                {
                  Icon: MapPin,
                  label: 'Our Branches',
                  value: branchLocalities,
                  href: '#',
                  onClick: (ev: MouseEvent<HTMLAnchorElement>) => {
                    ev.preventDefault();
                    navigate('/programs');
                  },
                },
              ].map((c) => (
                <ContactInfoCard key={c.label} Icon={c.Icon} label={c.label} value={c.value} href={c.href} onClick={c.onClick} />
              ))}

              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Follow us
                </p>
                <div className="mt-3 flex gap-3">
                  {[
                    { Icon: Instagram, label: 'Instagram', bg: 'bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600' },
                    { Icon: Youtube, label: 'YouTube', bg: 'bg-red-600' },
                    { Icon: Facebook, label: 'Facebook', bg: 'bg-blue-600' },
                    { Icon: Twitter, label: 'Twitter', bg: 'bg-sky-500' },
                  ].map(({ Icon, label, bg }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 hover:scale-110 hover:shadow-md ${bg}`}
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
                      Phone <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      What is this about?
                    </label>
                    <select
                      value={form.purpose}
                      onChange={(e) =>
                        setForm({ ...form, purpose: e.target.value as ContactPurpose, purposeDetail: '' })
                      }
                      className={`mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 transition focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                        errors.purpose ? 'ring-red-400' : 'ring-transparent'
                      }`}
                    >
                      <option value="" disabled>
                        Select a purpose
                      </option>
                      {CONTACT_PURPOSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>}
                  </div>
                  {form.purpose === 'Others' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tell us what it's about
                      </label>
                      <input
                        type="text"
                        value={form.purposeDetail}
                        onChange={(e) => setForm({ ...form, purposeDetail: e.target.value })}
                        placeholder="e.g. partnership inquiry, feedback, press"
                        className={`mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 transition focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
                          errors.purposeDetail ? 'ring-red-400' : 'ring-transparent'
                        }`}
                      />
                      {errors.purposeDetail && (
                        <p className="mt-1 text-xs text-red-500">{errors.purposeDetail}</p>
                      )}
                    </div>
                  )}
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
