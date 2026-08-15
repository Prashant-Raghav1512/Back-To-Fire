import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { generateChatResponse, type ChatTurn } from '@/lib/groqChat';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'Do I need any equipment?',
  'How often should I train?',
  'Tell me about pull-ups',
  'Is this safe for seniors?',
  'What events are coming up?',
];

const ERROR_PREFIX = "Sorry, I couldn't reach the chat service just now.";

const GREETING =
  'RAM RAM BHAI SAREYANE! 🙏 Main Uncle Baiyanpuria, tera calisthenics wala saathi. Ask me anything about Born to Fire - programs, exercises, events, or general questions.';

// Body only — no card chrome or header of its own. Mounted inside the
// floating window frame in src/components/ChatWidget.tsx, which owns the
// bot's name/avatar/close button; this just fills whatever height it's
// given (h-full flex flex-col).
export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
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

    const history: ChatTurn[] = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const reply = await generateChatResponse(trimmed, history);
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
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-green-500 text-gray-900'
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
          placeholder="Ask a question..."
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
