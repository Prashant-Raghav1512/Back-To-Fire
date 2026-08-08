import { useEffect, useRef, useState } from 'react';
import { Send, Utensils } from 'lucide-react';
import { estimateProteinFromFood, type ProteinChatTurn } from '@/lib/proteinChat';

interface ProteinMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  '2 eggs, a bowl of dal, and a glass of milk',
  '200g grilled chicken breast with rice',
  '1 scoop whey protein and a banana',
  'Paneer tikka, 150g',
];

const ERROR_PREFIX = "Sorry, I couldn't reach the chat service just now.";

const GREETING =
  "Tell me what you ate today (or a single meal) and I'll estimate the total protein - e.g. \"2 eggs, a bowl of dal, and a glass of milk\".";

// Card-chrome-included, unlike ChatBot.tsx (which is body-only and gets its
// header from ChatWidget.tsx) — this one is embedded directly on the Tools
// page, not inside a floating widget, so it owns its own header here.
export function ProteinChatBot() {
  const [messages, setMessages] = useState<ProteinMessage[]>([
    { id: 'greeting', role: 'bot', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const history: ProteinChatTurn[] = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const reply = await estimateProteinFromFood(trimmed, history);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'bot', text: reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Please try again in a moment.';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'bot', text: `${ERROR_PREFIX} ${detail}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    ask(input);
  };

  return (
    <div className="card flex h-[560px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-900 px-5 py-4 text-white dark:border-gray-700">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <Utensils className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display font-bold">Protein Chat Estimator</p>
          <p className="text-xs text-gray-400">Describe what you ate - get an instant estimate</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700/50">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-400"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-green-100 hover:text-green-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-500/15 dark:hover:text-green-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What did you eat?"
          disabled={sending}
          className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300 hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
