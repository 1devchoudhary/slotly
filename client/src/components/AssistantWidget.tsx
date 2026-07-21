import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { API_URL } from '../lib/api';
import { cn } from '../lib/utils';

const SUGGESTIONS = [
  'What services do you offer?',
  'Any openings tomorrow?',
  'Book me a cleaning this week',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nudge, setNudge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // A single, polite attention pulse a few seconds after landing.
  useEffect(() => {
    const timer = setTimeout(() => setNudge(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (res.ok) {
        const reply = Array.isArray(data.reply)
          ? data.reply.map((block: any) => block.text).filter(Boolean).join('\n')
          : data.reply || 'No response';
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "Sorry — I'm having trouble connecting right now." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Is the API server running?' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ---------------- Launcher ---------------- */}
      <button
        onClick={() => {
          setIsOpen((v) => !v);
          setNudge(false);
        }}
        aria-label={isOpen ? 'Close assistant' : 'Open booking assistant'}
        aria-expanded={isOpen}
        className={cn(
          'group fixed right-6 bottom-6 z-50 grid h-14 w-14 place-items-center rounded-2xl',
          'bg-gradient-to-br from-brand-500 to-plum-500 text-white',
          'shadow-[0_12px_40px_-10px_rgba(99,102,241,0.9)]',
          'transition-all duration-400 ease-out hover:scale-110 hover:shadow-[0_16px_50px_-10px_rgba(168,85,247,1)] active:scale-95'
        )}
      >
        {/* Idle halo */}
        {!isOpen && nudge && (
          <span
            aria-hidden="true"
            className="animate-ping-ring absolute inset-0 rounded-2xl bg-brand-500"
          />
        )}
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />

        <span
          className={cn(
            'relative transition-all duration-400',
            isOpen ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          )}
        >
          <MessageSquare size={22} />
        </span>
        <span
          className={cn(
            'absolute transition-all duration-400',
            isOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          )}
        >
          <X size={22} />
        </span>
      </button>

      {/* Tooltip nudge */}
      {!isOpen && nudge && (
        <div className="animate-fade-up glass-strong fixed right-24 bottom-8 z-50 hidden rounded-2xl rounded-br-md px-4 py-3 shadow-xl sm:block">
          <p className="text-sm font-medium text-text-main">Need a time that works?</p>
          <p className="mt-0.5 text-xs text-text-muted">Ask me — I'll check the calendar.</p>
        </div>
      )}

      {/* ---------------- Panel ---------------- */}
      <div
        className={cn(
          'fixed right-4 bottom-24 z-50 w-[min(24rem,calc(100vw-2rem))] origin-bottom-right transition-all duration-400 ease-out sm:right-6',
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        )}
      >
        <div className="glass-strong border-gradient flex h-[min(32rem,calc(100vh-9rem))] flex-col overflow-hidden rounded-3xl border-transparent shadow-panel">
          {/* Header */}
          <div className="relative flex items-center gap-3 border-b border-hairline px-5 py-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15 to-transparent"
            />
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 shadow-[0_6px_20px_-6px_rgba(99,102,241,0.9)]">
              <Sparkles size={17} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="relative flex-1">
              <h3 className="font-display text-sm font-semibold">Booking Assistant</h3>
              <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping-ring absolute inset-0 rounded-full bg-status-success" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-status-success" />
                </span>
                Online · powered by Gemini
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="relative grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-overlay-hover hover:text-text-main"
            >
              <X size={16} />
            </button>
          </div>

          {/* Transcript */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="animate-fade-up">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-plum-500/20 ring-1 ring-brand-400/25">
                  <Sparkles size={20} className="text-brand-text" />
                </div>
                <p className="mt-4 text-center text-sm leading-relaxed text-text-muted">
                  Hi! I can check live availability and book appointments for you. Try one of
                  these:
                </p>
                <div className="mt-5 space-y-2">
                  {SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={suggestion}
                      onClick={() => send(suggestion)}
                      className="animate-fade-up sheen w-full rounded-xl border border-hairline bg-overlay-2 px-4 py-2.5 text-left text-sm text-text-main transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/45 hover:bg-brand-500/10"
                      style={{ animationDelay: `${120 + i * 90}ms` }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  'animate-slide-up flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg'
                      : 'rounded-bl-md bg-overlay-3 text-text-main ring-1 ring-hairline'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="animate-slide-up flex justify-start">
                <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-overlay-3 px-4 py-3.5 ring-1 ring-hairline">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="animate-dot h-1.5 w-1.5 rounded-full bg-text-muted"
                      style={{ animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-hairline p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about availability…"
              className="h-11 flex-1 rounded-xl border border-hairline bg-overlay-2 px-4 text-sm transition-all duration-300 outline-none focus:border-brand-400/60 focus:bg-brand-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 text-white shadow-[0_6px_20px_-8px_rgba(99,102,241,0.9)] transition-all duration-300 hover:scale-105 hover:brightness-110 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:brightness-100"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
