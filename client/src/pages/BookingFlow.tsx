import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Sun,
  Sunrise,
  User,
} from 'lucide-react';
import { Button } from '../components/UI/Button';
import { PortalCard } from '../components/UI/PortalCard';
import { LoadingSkeleton } from '../components/UI/LoadingSkeleton';
import { Aurora } from '../components/UI/Aurora';
import { Logo } from '../components/Navbar';
import { ThemeToggle } from '../components/UI/ThemeToggle';
import { API_URL } from '../lib/api';
import { cn, formatPrice, gradientFor, initials } from '../lib/utils';

const STEPS = ['Service', 'Professional', 'Time', 'Confirm'] as const;

interface Customer {
  name: string;
  email: string;
  phone: string;
}

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer>({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  const go = (next: number) => {
    setDirection(next > step ? 'fwd' : 'back');
    setStep(next);
  };

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch(`${API_URL}/services`).then((r) => r.json()),
  });

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff', selectedService?._id],
    queryFn: () =>
      fetch(`${API_URL}/staff?serviceId=${selectedService?._id}`).then((r) => r.json()),
    enabled: !!selectedService,
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['availability', selectedService?._id, selectedStaff?._id, selectedDate],
    queryFn: () =>
      fetch(
        `${API_URL}/availability?serviceId=${selectedService._id}&staffId=${selectedStaff._id}&date=${selectedDate}`
      ).then((r) => r.json()),
    enabled: !!selectedService && !!selectedStaff && !!selectedDate,
  });

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    []
  );

  /** Split the flat slot list into the buckets people actually think in. */
  const grouped = useMemo(() => {
    const buckets: Record<string, any[]> = { Morning: [], Afternoon: [], Evening: [] };
    if (!Array.isArray(slots)) return buckets;
    for (const slot of slots) {
      const hour = new Date(slot.startAt).getHours();
      if (hour < 12) buckets.Morning.push(slot);
      else if (hour < 17) buckets.Afternoon.push(slot);
      else buckets.Evening.push(slot);
    }
    return buckets;
  }, [slots]);

  const canSubmit =
    customer.name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(customer.email) &&
    customer.phone.trim().length >= 7;

  const confirmBooking = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService._id,
          staffId: selectedStaff._id,
          startAt: selectedSlot.startAt,
          customer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'That slot was just taken. Please pick another time.'
        );
        return;
      }
      setBooking(data);
    } catch {
      setError('Could not reach the server. Is the API running?');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------- Success ---------------------------------- */
  if (booking) {
    return (
      <div className="relative min-h-screen px-6 py-24">
        <Aurora variant="subtle" />
        <div className="mx-auto max-w-lg">
          <PortalCard gradientBorder className="animate-scale-in p-10 text-center">
            <div className="relative mx-auto grid h-20 w-20 place-items-center">
              <span className="animate-ping-ring absolute inset-0 rounded-full bg-status-success/30" />
              <span className="relative grid h-20 w-20 place-items-center rounded-full bg-status-success/15 ring-1 ring-status-success/40">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-status-success">
                  <path
                    d="M4.5 12.5l5 5 10-11"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="26"
                    strokeDashoffset="26"
                    className="animate-tick"
                    style={{ animationDelay: '200ms' }}
                  />
                </svg>
              </span>
            </div>

            <h1 className="font-display mt-7 text-3xl font-bold">You're booked</h1>
            <p className="mt-3 text-text-muted">
              A confirmation is on its way to{' '}
              <span className="text-text-main">{customer.email}</span>.
            </p>

            <div className="mt-8 space-y-3 rounded-2xl bg-overlay-2 p-5 text-left ring-1 ring-hairline">
              <SummaryRow label="Service" value={selectedService.name} />
              <SummaryRow label="With" value={selectedStaff.userId?.name} />
              <SummaryRow
                label="When"
                value={format(new Date(booking.startAt), "EEE, MMM d 'at' h:mm a")}
              />
              <SummaryRow label="Total" value={formatPrice(selectedService.priceCents)} />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Back home
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setBooking(null);
                  setSelectedService(null);
                  setSelectedStaff(null);
                  setSelectedSlot(null);
                  setCustomer({ name: '', email: '', phone: '' });
                  go(1);
                }}
              >
                Book another
              </Button>
            </div>
          </PortalCard>
        </div>
      </div>
    );
  }

  /* ----------------------------------- Flow ----------------------------------- */
  return (
    <div className="relative min-h-screen">
      <Aurora variant="subtle" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeft size={15} />
            Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-6 pb-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Book an appointment
          </h1>
          <p className="mt-3 text-text-muted">
            Four quick steps — or{' '}
            <span className="text-brand-text">just ask the assistant</span> in the corner.
          </p>
        </div>

        {/* -------- Stepper -------- */}
        <div className="relative mx-auto mt-12 max-w-2xl">
          <div className="absolute top-5 right-0 left-0 h-0.5 bg-overlay-3">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-plum-500 transition-all duration-700 ease-out"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          <ol className="relative flex justify-between">
            {STEPS.map((label, i) => {
              const index = i + 1;
              const done = step > index;
              const active = step === index;
              return (
                <li key={label} className="flex flex-col items-center gap-2.5">
                  <button
                    onClick={() => index < step && go(index)}
                    disabled={index >= step}
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition-all duration-500',
                      done &&
                        'bg-gradient-to-br from-brand-500 to-plum-500 text-white shadow-[0_6px_20px_-6px_rgba(99,102,241,0.9)] hover:scale-110',
                      active &&
                        'bg-surface-raised text-brand-text ring-2 ring-brand-400 shadow-[0_0_24px_-4px_rgba(99,102,241,0.8)]',
                      !done && !active && 'bg-surface-raised text-text-faint ring-1 ring-hairline'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : index}
                  </button>
                  <span
                    className={cn(
                      'hidden text-xs font-medium transition-colors sm:block',
                      active ? 'text-text-main' : 'text-text-faint'
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* -------- Step panel -------- */}
          <PortalCard className="p-6 sm:p-8">
            <div
              key={step}
              className={direction === 'fwd' ? 'animate-slide-left' : 'animate-slide-up'}
            >
              {/* ---- 1. Service ---- */}
              {step === 1 && (
                <section>
                  <StepHeading
                    eyebrow="Step 1"
                    title="What do you need?"
                    subtitle="Pick the service you'd like to book."
                  />

                  {servicesLoading ? (
                    <SkeletonList rows={3} height="h-24" />
                  ) : (
                    <div className="grid gap-3">
                      {services?.map((service: any, i: number) => (
                        <button
                          key={service._id}
                          onClick={() => {
                            setSelectedService(service);
                            setSelectedStaff(null);
                            setSelectedSlot(null);
                            go(2);
                          }}
                          className="group animate-fade-up sheen relative flex items-center gap-4 rounded-2xl border border-hairline bg-overlay-1 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/45 hover:bg-brand-500/[0.07]"
                          style={{ animationDelay: `${i * 70}ms` }}
                        >
                          <span
                            className="h-11 w-1.5 shrink-0 rounded-full transition-all duration-300 group-hover:h-14"
                            style={{ background: service.color || '#6366f1' }}
                          />
                          <span className="flex-1">
                            <span className="font-display block text-base font-semibold text-text-main">
                              {service.name}
                            </span>
                            <span className="mt-1 block text-sm text-text-muted">
                              {service.description}
                            </span>
                            <span className="mt-2.5 flex items-center gap-3 text-xs text-text-faint">
                              <span className="flex items-center gap-1.5">
                                <Clock size={12} />
                                {service.durationMin} min
                              </span>
                              <span className="font-semibold text-brand-text">
                                {formatPrice(service.priceCents)}
                              </span>
                            </span>
                          </span>
                          <ArrowRight
                            size={18}
                            className="shrink-0 text-text-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-text"
                          />
                        </button>
                      ))}
                      {services?.length === 0 && (
                        <EmptyState text="No services published yet. Run the seed script to populate the demo." />
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* ---- 2. Staff ---- */}
              {step === 2 && (
                <section>
                  <StepHeading
                    eyebrow="Step 2"
                    title="Who would you like to see?"
                    subtitle="These professionals all offer this service."
                    onBack={() => go(1)}
                  />

                  {staffLoading ? (
                    <SkeletonList rows={2} height="h-24" />
                  ) : (
                    <div className="grid gap-3">
                      {staff?.map((member: any, i: number) => (
                        <button
                          key={member._id}
                          onClick={() => {
                            setSelectedStaff(member);
                            setSelectedSlot(null);
                            go(3);
                          }}
                          className="group animate-fade-up sheen flex items-center gap-4 rounded-2xl border border-hairline bg-overlay-1 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/45 hover:bg-brand-500/[0.07]"
                          style={{ animationDelay: `${i * 70}ms` }}
                        >
                          <span
                            className={cn(
                              'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ring-2 ring-hairline transition-transform duration-300 group-hover:scale-105',
                              gradientFor(member.userId?.name)
                            )}
                          >
                            {initials(member.userId?.name)}
                          </span>
                          <span className="flex-1">
                            <span className="font-display block text-base font-semibold text-text-main">
                              {member.userId?.name ?? 'Team member'}
                            </span>
                            <span className="mt-1 block text-sm text-text-muted">
                              {member.bio || 'Available for this service'}
                            </span>
                          </span>
                          <ArrowRight
                            size={18}
                            className="shrink-0 text-text-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-text"
                          />
                        </button>
                      ))}
                      {staff?.length === 0 && (
                        <EmptyState text="Nobody is currently assigned to this service." />
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* ---- 3. Time ---- */}
              {step === 3 && (
                <section>
                  <StepHeading
                    eyebrow="Step 3"
                    title="Pick a time"
                    subtitle="Only genuinely open slots are shown."
                    onBack={() => go(2)}
                  />

                  {/* Day strip */}
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
                    {days.map((day, i) => {
                      const value = format(day, 'yyyy-MM-dd');
                      const active = value === selectedDate;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            setSelectedDate(value);
                            setSelectedSlot(null);
                          }}
                          className={cn(
                            'animate-fade-up flex h-[4.5rem] w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition-all duration-300',
                            active
                              ? 'border-transparent bg-gradient-to-br from-brand-500 to-plum-500 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.9)]'
                              : 'border-hairline bg-overlay-1 text-text-muted hover:-translate-y-0.5 hover:border-brand-400/40 hover:text-text-main'
                          )}
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <span className="text-[10px] font-medium tracking-wider uppercase opacity-80">
                            {isSameDay(day, new Date()) ? 'Today' : format(day, 'EEE')}
                          </span>
                          <span className="font-display mt-1 text-xl font-bold">
                            {format(day, 'd')}
                          </span>
                          <span className="text-[10px] opacity-70">{format(day, 'MMM')}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Slots */}
                  <div className="mt-6">
                    {slotsLoading ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <LoadingSkeleton key={i} className="h-11 w-full" delay={i * 90} />
                        ))}
                      </div>
                    ) : !Array.isArray(slots) || slots.length === 0 ? (
                      <EmptyState
                        text={`No openings on ${format(new Date(`${selectedDate}T12:00:00`), 'EEEE, MMM d')}. Try another day.`}
                      />
                    ) : (
                      <div className="space-y-6">
                        {(
                          [
                            ['Morning', Sunrise],
                            ['Afternoon', Sun],
                            ['Evening', Clock],
                          ] as const
                        ).map(([bucket, Icon]) =>
                          grouped[bucket].length === 0 ? null : (
                            <div key={bucket}>
                              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-text-faint uppercase">
                                <Icon size={13} />
                                {bucket}
                                <span className="text-text-faint/60">
                                  ({grouped[bucket].length})
                                </span>
                              </h3>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {grouped[bucket].map((slot: any, i: number) => {
                                  const active = selectedSlot?.startAt === slot.startAt;
                                  return (
                                    <button
                                      key={slot.startAt}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={cn(
                                        'animate-pop h-11 rounded-xl border text-sm font-medium transition-all duration-300',
                                        active
                                          ? 'scale-105 border-transparent bg-gradient-to-br from-brand-500 to-plum-500 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,1)]'
                                          : 'border-hairline bg-overlay-1 text-text-main hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-brand-500/10'
                                      )}
                                      style={{ animationDelay: `${i * 35}ms` }}
                                    >
                                      {format(new Date(slot.startAt), 'h:mm a')}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    disabled={!selectedSlot}
                    onClick={() => go(4)}
                  >
                    Continue
                    <ArrowRight size={17} />
                  </Button>
                </section>
              )}

              {/* ---- 4. Details ---- */}
              {step === 4 && (
                <section>
                  <StepHeading
                    eyebrow="Step 4"
                    title="Your details"
                    subtitle="We'll send the confirmation and manage link here."
                    onBack={() => go(3)}
                  />

                  <div className="space-y-4">
                    <Field
                      icon={User}
                      label="Full name"
                      placeholder="Jane Doe"
                      value={customer.name}
                      onChange={(v) => setCustomer((c) => ({ ...c, name: v }))}
                    />
                    <Field
                      icon={Mail}
                      label="Email"
                      type="email"
                      placeholder="jane@example.com"
                      value={customer.email}
                      onChange={(v) => setCustomer((c) => ({ ...c, email: v }))}
                    />
                    <Field
                      icon={Phone}
                      label="Phone"
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={customer.phone}
                      onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))}
                    />
                  </div>

                  {error && (
                    <div className="animate-slide-up mt-5 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger ring-1 ring-status-danger/25">
                      {error}
                    </div>
                  )}

                  <Button
                    className="mt-7 w-full"
                    size="lg"
                    disabled={!canSubmit}
                    isLoading={submitting}
                    onClick={confirmBooking}
                  >
                    {submitting ? 'Confirming…' : 'Confirm booking'}
                    {!submitting && <Sparkles size={17} />}
                  </Button>
                  <p className="mt-3 text-center text-xs text-text-faint">
                    Free to reschedule or cancel up to 24 hours before.
                  </p>
                </section>
              )}
            </div>
          </PortalCard>

          {/* -------- Live summary -------- */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <PortalCard className="overflow-hidden">
              <div className="border-b border-hairline bg-gradient-to-br from-brand-500/12 to-transparent px-6 py-5">
                <h2 className="font-display flex items-center gap-2 text-sm font-semibold tracking-wide">
                  <CalendarDays size={15} className="text-brand-text" />
                  Your appointment
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <SummarySlot
                  label="Service"
                  value={selectedService?.name}
                  hint={
                    selectedService
                      ? `${selectedService.durationMin} min · ${formatPrice(selectedService.priceCents)}`
                      : undefined
                  }
                />
                <SummarySlot label="Professional" value={selectedStaff?.userId?.name} />
                <SummarySlot
                  label="Date & time"
                  value={
                    selectedSlot
                      ? format(new Date(selectedSlot.startAt), "EEE, MMM d 'at' h:mm a")
                      : undefined
                  }
                />

                <div className="flex items-center justify-between border-t border-hairline pt-5">
                  <span className="text-sm text-text-muted">Total</span>
                  <span className="font-display text-2xl font-bold text-text-main">
                    {selectedService ? formatPrice(selectedService.priceCents) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-hairline bg-overlay-1 px-6 py-4">
                <MessageSquare size={15} className="mt-0.5 shrink-0 text-brand-text" />
                <p className="text-xs leading-relaxed text-text-muted">
                  Prefer to ask? The assistant can book this in one message.
                </p>
              </div>
            </PortalCard>
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------- Sub-components ------------------------------- */

function StepHeading({
  eyebrow,
  title,
  subtitle,
  onBack,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <span className="text-xs font-semibold tracking-[0.18em] text-brand-text uppercase">
          {eyebrow}
        </span>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
      </div>
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft size={15} />
          Back
        </Button>
      )}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-main">{label}</span>
      <span className="group relative block">
        <Icon
          size={16}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-faint transition-colors group-focus-within:text-brand-text"
        />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-hairline bg-overlay-2 pr-4 pl-11 text-sm text-text-main transition-all duration-300 outline-none focus:border-brand-400/60 focus:bg-brand-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
        />
      </span>
    </label>
  );
}

function SummarySlot({
  label,
  value,
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs tracking-wide text-text-faint uppercase">{label}</p>
      {value ? (
        <div className="animate-slide-up mt-1.5">
          <p className="text-sm font-medium text-text-main">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
        </div>
      ) : (
        <div className="mt-2 h-4 w-2/3 rounded bg-overlay-2" />
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-medium text-text-main">{value ?? '—'}</span>
    </div>
  );
}

function SkeletonList({ rows, height }: { rows: number; height: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className={`w-full ${height}`} delay={i * 140} />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="animate-fade-in rounded-2xl border border-dashed border-hairline px-6 py-12 text-center">
      <CalendarDays size={26} className="mx-auto text-text-faint" />
      <p className="mx-auto mt-3 max-w-xs text-sm text-text-muted">{text}</p>
    </div>
  );
}
