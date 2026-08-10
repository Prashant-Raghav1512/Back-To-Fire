import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { CommunityBoard } from '@/components/CommunityBoard';

// Mirrors ChatWidget.tsx's structure exactly (floating bubble + panel
// frame owning header/chrome, body-only board mounted inside) — but on the
// opposite corner (bottom-left) with an orange accent, so the two floating
// widgets read as related but distinct rather than competing in the same
// spot. Mounted once in App.tsx outside the route switch so open/closed
// state survives client-side navigation.
export function CommunityWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {open && (
        <div className="flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="flex items-center gap-3 bg-gray-900 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
              <Users className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Community</p>
              <p className="truncate text-xs text-gray-300">Connect state to state, or across India</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close community"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <CommunityBoard />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close community' : 'Open community'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition-all duration-300 hover:bg-orange-600 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Users className="h-6 w-6" />}
      </button>
    </div>
  );
}
