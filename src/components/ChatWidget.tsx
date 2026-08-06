import { useState } from 'react';
import { MessageCircle, X, Flame } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';

// Mounted once in App.tsx (outside the route switch) so it persists across
// client-side navigation — the same open/closed state and message history
// survive a route change instead of resetting per page.
export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="flex items-center gap-3 bg-gray-900 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <Flame className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Ankit Baiyanpuria</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online now
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <ChatBot />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Ankit Baiyanpuria'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40 transition-all duration-300 hover:bg-green-600 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
