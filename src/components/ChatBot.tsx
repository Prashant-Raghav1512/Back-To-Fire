import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { searchKnowledgeBase } from '@/lib/search';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sourceTitle?: string;
}

const SUGGESTIONS = [
  'Do I need any equipment?',
  'How often should I train?',
  'Tell me about pull-ups',
  'Is this safe for seniors?',
];

const FALLBACK_MESSAGE =
  "I couldn't find a confident answer to that in what I know. Try rephrasing, or use the contact form above and we'll get back to you personally.";

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      role: 'bot',
      text: 'Hi! Ask me anything about Born to Fire — programs, exercises, or general questions.',
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const [result] = searchKnowledgeBase(trimmed, 1);
    const botMessage: ChatMessage = result
      ? {
          id: crypto.randomUUID(),
          role: 'bot',
          text: result.chunk.text,
          sourceTitle: result.chunk.title,
        }
      : { id: crypto.randomUUID(), role: 'bot', text: FALLBACK_MESSAGE };

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: trimmed },
      botMessage,
    ]);
    setInput('');
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    ask(input);
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">
            Ask Born to Fire
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Instant answers from our knowledge base
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
              }`}
            >
              {m.role === 'bot' && m.sourceTitle && (
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                  <Sparkles className="h-3 w-3" /> {m.sourceTitle}
                </p>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {messages.length === 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
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

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-green-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-all duration-300 hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
