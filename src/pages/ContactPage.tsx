import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Youtube, Facebook, Twitter, Check, Calculator, AlertCircle, Lock, Beef } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useReveal } from '@/lib/useReveal';
import { submitContact } from '@/lib/contact';

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

export function ContactPage() {
  const ref = useReveal<HTMLDivElement>();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // BMI calculator state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  // Protein intake calculator state
  const [proteinWeight, setProteinWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'intense'>('light');
  const [protein, setProtein] = useState<number | null>(null);

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

  const calcBmi = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(Math.round((w / (h * h)) * 10) / 10);
    }
  };

  const bmiCategory = (v: number) => {
    if (v < 18.5) return { label: 'Underweight', color: 'text-orange-500' };
    if (v < 25) return { label: 'Healthy', color: 'text-green-500' };
    if (v < 30) return { label: 'Overweight', color: 'text-orange-500' };
    return { label: 'Obese', color: 'text-red-500' };
  };

  // Grams of protein per kg of bodyweight per day, by training load — the
  // 0.8 g/kg baseline is the standard sedentary RDA; 1.2 and 1.8 sit inside
  // the widely-cited 1.6-2.2 g/kg range for people doing regular resistance
  // training, scaled down for "light" so the three options stay clearly
  // ordered rather than clustering near the top of that range.
  const PROTEIN_MULTIPLIER: Record<typeof activityLevel, number> = {
    sedentary: 0.8,
    light: 1.2,
    intense: 1.8,
  };

  const calcProtein = () => {
    const w = parseFloat(proteinWeight);
    if (w > 0) {
      setProtein(Math.round(w * PROTEIN_MULTIPLIER[activityLevel]));
    }
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/10476460/pexels-photo-10476460.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
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
            Questions about a program, partnership ideas, or just want to say hello? Reach out —
            we usually reply within a day.
          </p>
        </div>
      </section>

      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={ref} className="reveal container-x mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact info */}
            <div className="space-y-4">
              {[
                { Icon: Mail, label: 'Email', value: 'hello@borntofire.in', href: 'mailto:hello@borntofire.in' },
                { Icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
                { Icon: MapPin, label: 'Address', value: 'Indiranagar, Bengaluru, Karnataka 560038', href: '#' },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="card card-hover flex items-start gap-4 p-5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                    <c.Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {c.label}
                    </p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{c.value}</p>
                  </div>
                </a>
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
                      Thanks! Your message has been recorded — we will be in touch soon.
                    </p>
                  </div>
                )}

                {!isSignedIn && !sent && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-100 p-4 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                      <Lock className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-medium">
                      Sign in to send a message — it only takes a moment.
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

          {/* BMI Calculator */}
          <div className="mt-12">
            <div className="card overflow-hidden">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="bg-gray-900 p-8 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
                    <Calculator className="h-3.5 w-3.5" /> Free tool
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold">BMI Calculator</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    Your Body Mass Index is a quick way to check if your weight is in a healthy
                    range for your height. It is a starting point — not the whole picture. Pair
                    it with calisthenics and you will build a body that performs, not just one that
                    scores well on a chart.
                  </p>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="170"
                        className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="65"
                        className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <button onClick={calcBmi} className="btn-primary mt-4 w-full">
                    Calculate BMI
                  </button>
                  {bmi !== null && (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-center dark:bg-gray-700/50">
                      <p className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">
                        {bmi}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${bmiCategory(bmi).color}`}>
                        {bmiCategory(bmi).label}
                      </p>
                      <div className="mt-3 flex justify-between text-[10px] font-medium text-gray-400">
                        <span>Underweight &lt;18.5</span>
                        <span>Healthy 18.5-24.9</span>
                        <span>Overweight 25-29.9</span>
                        <span>Obese 30+</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Protein Intake Calculator */}
          <div className="mt-12">
            <div className="card overflow-hidden">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="bg-gray-900 p-8 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300">
                    <Beef className="h-3.5 w-3.5" /> Free tool
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold">Protein Intake Calculator</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    Protein is what your muscles rebuild from after every training session.
                    Your daily target scales with your bodyweight and how often you train —
                    use this to get a whole-day starting point, then adjust from there.
                  </p>
                </div>
                <div className="p-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={proteinWeight}
                      onChange={(e) => setProteinWeight(e.target.value)}
                      placeholder="65"
                      className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Training level
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value as typeof activityLevel)}
                      className="mt-1.5 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="sedentary">Sedentary (little to no training)</option>
                      <option value="light">Training 2-3x/week</option>
                      <option value="intense">Intense calisthenics, 4+x/week</option>
                    </select>
                  </div>
                  <button onClick={calcProtein} className="btn-primary mt-4 w-full">
                    Calculate Protein Target
                  </button>
                  {protein !== null && (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-center dark:bg-gray-700/50">
                      <p className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">
                        {protein}g
                      </p>
                      <p className="mt-1 text-sm font-semibold text-green-500">per day</p>
                      <p className="mt-3 text-xs font-medium text-gray-400">
                        About {Math.round(protein / 4)}g per meal across 4 meals
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
