import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

type Beat =
  | { kind: 'user'; text: string }
  | { kind: 'typing' }
  | { kind: 'assistant'; text: string }
  | { kind: 'slots'; options: string[]; picked: number }
  | { kind: 'confirmed' };

/** The scripted demo that plays on loop in the hero. */
const SCRIPT: Beat[] = [
  { kind: 'user', text: 'Any openings for a cleaning this week?' },
  { kind: 'typing' },
  { kind: 'assistant', text: 'Dr. Reyes has three slots open on Thursday. Want one?' },
  { kind: 'slots', options: ['9:30 AM', '1:15 PM', '4:00 PM'], picked: 1 },
  { kind: 'typing' },
  { kind: 'confirmed' },
];

const BEAT_MS = [1500, 900, 1900, 2100, 900, 3600];

export function HeroChat() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setStep((s) => (s + 1) % (SCRIPT.length + 1)),
      BEAT_MS[step] ?? 1400
    );
    return () => clearTimeout(timer);
  }, [step]);

  // step === SCRIPT.length is the blank beat that resets the loop.
  const visible = SCRIPT.slice(0, step);

  return (
    <div className="relative">
      {/* Bloom behind the card */}
      <div
        aria-hidden="true"
        className="animate-glow absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.35),transparent_70%)] blur-2xl"
      />

      <div className="animate-float-slow relative">
        <div className="glass-strong border-gradient overflow-hidden rounded-3xl border-transparent shadow-panel">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500">
              <Sparkles size={16} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-main">Slotly Assistant</p>
              <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping-ring absolute inset-0 rounded-full bg-status-success" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-status-success" />
                </span>
                Online · replies instantly
              </p>
            </div>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-overlay-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-overlay-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-overlay-3" />
            </div>
          </div>

          {/* Transcript */}
          <div className="flex h-[352px] flex-col justify-end gap-3 p-5">
            {visible.map((beat, i) => (
              <Bubble key={`${step}-${i}`} beat={beat} />
            ))}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-hairline px-4 py-3">
            <div className="flex h-10 flex-1 items-center rounded-xl bg-overlay-2 px-3.5 text-sm text-text-faint">
              Ask about availability…
              <span className="animate-caret ml-0.5 inline-block h-4 w-px bg-brand-400" />
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12l16-8-6 8 6 8-16-8z"
                  fill="white"
                  fillOpacity="0.95"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Floating stat chips */}
        <div className="animate-float glass-strong absolute -top-5 -left-8 hidden items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl sm:flex">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-status-success/15">
            <Check size={15} className="text-status-success" strokeWidth={3} />
          </div>
          <div>
            <p className="text-sm leading-none font-semibold text-text-main">1,284</p>
            <p className="mt-1 text-[11px] text-text-muted">booked this month</p>
          </div>
        </div>

        <div
          className="animate-float glass-strong absolute -right-6 -bottom-6 hidden items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl sm:flex"
          style={{ animationDelay: '-3.5s' }}
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/20">
            <span className="text-xs font-bold text-brand-text">0</span>
          </div>
          <div>
            <p className="text-sm leading-none font-semibold text-text-main">Double-bookings</p>
            <p className="mt-1 text-[11px] text-text-muted">conflict engine active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ beat }: { beat: Beat }) {
  if (beat.kind === 'user') {
    return (
      <div className="animate-slide-up flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-600 to-brand-500 px-4 py-2.5 text-sm text-white shadow-lg">
          {beat.text}
        </p>
      </div>
    );
  }

  if (beat.kind === 'assistant') {
    return (
      <div className="animate-slide-up flex justify-start">
        <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-overlay-3 px-4 py-2.5 text-sm text-text-main ring-1 ring-hairline">
          {beat.text}
        </p>
      </div>
    );
  }

  if (beat.kind === 'typing') {
    return (
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
    );
  }

  if (beat.kind === 'slots') {
    return (
      <div className="animate-slide-up flex flex-wrap gap-2">
        {beat.options.map((opt, i) => (
          <span
            key={opt}
            className={cn(
              'animate-pop rounded-xl px-3.5 py-2 text-xs font-medium ring-1 transition-all',
              i === beat.picked
                ? 'bg-brand-500/25 text-brand-text-strong ring-brand-400/60 shadow-[0_0_20px_-4px_rgba(99,102,241,0.8)]'
                : 'bg-overlay-2 text-text-muted ring-hairline'
            )}
            style={{ animationDelay: `${i * 110}ms` }}
          >
            {opt}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-scale-in rounded-2xl bg-gradient-to-br from-status-success/15 to-transparent p-4 ring-1 ring-status-success/25">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-status-success/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-status-success">
            <path
              d="M4.5 12.5l5 5 10-11"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="26"
              strokeDashoffset="26"
              className="animate-tick"
              style={{ animationDelay: '120ms' }}
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-text-main">Appointment confirmed</p>
          <p className="text-xs text-text-muted">Thu · 1:15 PM · Cleaning with Dr. Reyes</p>
        </div>
      </div>
    </div>
  );
}
