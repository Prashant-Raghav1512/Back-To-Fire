import { Flame, Instagram, Youtube, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { navLinks } from '@/data/content';
import { useRouter } from '@/lib/router';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-x mx-auto px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                <Flame className="h-6 w-6 text-white" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-extrabold text-white">
                born to <span className="text-green-500">fire</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              No weights. No limits. Master the machine you were born in. Calisthenics for every
              body, made for India.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Youtube, label: 'YouTube' },
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-all duration-300 hover:bg-green-500 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-gray-400 transition-colors hover:text-green-400"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Programs
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {['Foundation Starter', 'Strength Builder', 'Calisthenics Mastery'].map((p) => (
                <li key={p}>
                  <button
                    onClick={() => navigate('/programs')}
                    className="text-gray-400 transition-colors hover:text-green-400"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Get in Touch
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>hello@borntofire.in</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Indiranagar, Bengaluru, Karnataka 560038</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Born to Fire. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with <Flame className="h-4 w-4 text-orange-500" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
