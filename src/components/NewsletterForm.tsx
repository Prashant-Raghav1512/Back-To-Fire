import { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '@/lib/newsletter';

interface NewsletterFormProps {
  className?: string;
  /** 'dark' for the Footer's dark background, 'light' for the App Coming Soon page's card. */
  variant?: 'dark' | 'light';
}

// Shared by the Footer's "Stay Updated" band and the App Coming Soon page,
// so both write to the same newsletter_subscribers table via one code path.
export function NewsletterForm({ className = '', variant = 'dark' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isDark = variant === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      await subscribeToNewsletter(email);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not subscribe, please try again.');
    }
  };

  if (status === 'success') {
    return (
      <p className={`flex items-center gap-2 text-sm font-semibold text-green-500 dark:text-green-400 ${className}`}>
        <Check className="h-4 w-4" /> Thanks for subscribing!
      </p>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail
            className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            disabled={status === 'loading'}
            className={`w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none ring-1 transition disabled:opacity-60 ${
              isDark
                ? 'bg-gray-800 text-white ring-gray-700 placeholder:text-gray-500 focus:ring-green-500'
                : 'bg-gray-100 text-gray-900 ring-transparent placeholder:text-gray-400 focus:ring-green-500 dark:bg-gray-700 dark:text-white'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary shrink-0 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
