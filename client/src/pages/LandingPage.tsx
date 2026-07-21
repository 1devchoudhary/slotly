import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  CircleCheck,
  Clock,
  Globe,
  MessageSquare,
  Quote,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Zap,
} from 'lucide-react';
import { Button } from '../components/UI/Button';
import { PortalCard } from '../components/UI/PortalCard';
import { Reveal } from '../components/UI/Reveal';
import { CountUp } from '../components/UI/CountUp';
import { Aurora } from '../components/UI/Aurora';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HeroChat } from '../components/HeroChat';

const STATS = [
  { value: 12400, suffix: '+', label: 'Appointments booked' },
  { value: 38, suffix: '%', label: 'Fewer no-shows' },
  { value: 4.9, decimals: 1, suffix: '/5', label: 'Patient rating' },
  { value: 24, suffix: '/7', label: 'Always answering' },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Understands real requests',
    body: 'The assistant reads "sometime after work on Thursday" and turns it into an actual slot on an actual calendar.',
    span: 'md:col-span-2',
    accent: 'from-brand-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Conflict-proof',
    body: 'Every slot is re-validated server-side before it is written. Double-bookings are structurally impossible.',
    span: '',
    accent: 'from-status-success/20',
  },
  {
    icon: Clock,
    title: 'Buffers & lead times',
    body: 'Per-staff buffers, time-off, and lead-time rules are baked into the availability engine.',
    span: '',
    accent: 'from-accent-500/20',
  },
  {
    icon: Globe,
    title: 'Timezone-safe by design',
    body: 'Availability is computed in the business timezone, then rendered in the visitor’s. No 3 AM surprises.',
    span: 'md:col-span-2',
    accent: 'from-plum-500/20',
  },
];

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Ask in plain English',
    body: 'A visitor opens the assistant and describes what they need — no forms, no dropdowns.',
  },
  {
    icon: Zap,
    title: 'The engine finds real slots',
    body: 'Working hours, buffers, existing bookings and time-off resolve into genuinely open times.',
  },
  {
    icon: CalendarCheck,
    title: 'Booked and confirmed',
    body: 'The slot is locked, a manage link is issued, and the calendar updates on the spot.',
  },
];

const SERVICES = [
  {
    icon: Smile,
    name: 'Checkups & Cleaning',
    price: 'from $89',
    duration: '45 min',
    body: 'Comprehensive exam, polish, and a plan you can actually follow.',
  },
  {
    icon: Sparkles,
    name: 'Laser Whitening',
    price: 'from $249',
    duration: '60 min',
    body: 'Eight shades brighter in a single visit, with zero sensitivity gel.',
  },
  {
    icon: Stethoscope,
    name: 'Restorative Care',
    price: 'from $180',
    duration: '90 min',
    body: 'Fillings, crowns, and root canals handled with same-day ceramics.',
  },
  {
    icon: Syringe,
    name: 'Emergency Visits',
    price: 'from $120',
    duration: '30 min',
    body: 'Same-day relief slots held open every single weekday morning.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I asked for "something before work next week" at 11pm and had a confirmed 7:30am slot thirty seconds later. I have never rebooked so painlessly.',
    name: 'Amara Ellis',
    role: 'Patient since 2021',
  },
  {
    quote:
      'Front desk call volume dropped by about a third in the first month. The assistant handles the reschedules that used to eat our mornings.',
    name: 'Daniel Okafor',
    role: 'Practice Manager',
  },
  {
    quote:
      'It never offers a time I cannot actually work. Whatever is checking the calendar behind the scenes is doing it properly.',
    name: 'Dr. Sofia Reyes',
    role: 'Lead Dentist',
  },
];

const MARQUEE = [
  'Northside Dental',
  'Lumen Aesthetics',
  'Copper & Co Barbers',
  'Vantage Physio',
  'Harbor Vet Clinic',
  'Studio Nine Salon',
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Aurora />
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="relative px-6 pt-32 pb-20 sm:pt-40 lg:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="animate-fade-up glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping-ring absolute inset-0 rounded-full bg-brand-400" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-brand-400" />
              </span>
              Powered by Google Gemini
              <span className="text-text-faint">·</span>
              <span className="text-brand-text">Live demo</span>
            </div>

            <h1
              className="animate-fade-up font-display mt-7 text-[2.75rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-[4.1rem]"
              style={{ animationDelay: '90ms' }}
            >
              <span className="text-gradient">Booking that</span>
              <br />
              <span className="text-gradient-brand">answers back.</span>
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-text-muted"
              style={{ animationDelay: '180ms' }}
            >
              Slotly replaces the booking form with a conversation. Patients ask for a time the
              way they'd ask a person — and walk away with a real, conflict-checked appointment.
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '270ms' }}
            >
              <Link to="/book">
                <Button size="lg">
                  Book an appointment
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="secondary" size="lg">
                  View the dashboard
                </Button>
              </Link>
            </div>

            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-muted"
              style={{ animationDelay: '360ms' }}
            >
              {['No account needed', 'Instant confirmation', 'Free to cancel'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CircleCheck size={15} className="text-status-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-scale-in" style={{ animationDelay: '260ms' }}>
            <HeroChat />
          </div>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <section className="relative py-10">
        <p className="mb-7 text-center text-xs font-medium tracking-[0.22em] text-text-faint uppercase">
          Trusted by independent practices
        </p>
        <div className="mask-fade-x pause-on-hover flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-16 pr-16">
            {[...MARQUEE, ...MARQUEE].map((name, i) => (
              <span
                key={i}
                className="font-display text-xl font-semibold whitespace-nowrap text-text-faint/70 transition-colors duration-300 hover:text-text-main"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <PortalCard className="grid grid-cols-2 divide-hairline p-2 sm:divide-x lg:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="px-6 py-8 text-center">
                  <p className="font-display text-4xl font-bold text-text-main sm:text-5xl">
                    <CountUp
                      to={stat.value}
                      decimals={stat.decimals ?? 0}
                      suffix={stat.suffix}
                      duration={1500 + i * 180}
                    />
                  </p>
                  <p className="mt-2 text-sm text-text-muted">{stat.label}</p>
                </div>
              ))}
            </PortalCard>
          </Reveal>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="relative scroll-mt-28 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>Why it works</SectionLabel>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              An assistant that <span className="text-gradient-brand">knows the calendar</span>
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              The conversation is the easy part. The hard part is being right about availability —
              which is where most booking bots quietly fail.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 90} className={feature.span}>
                <PortalCard hover className="group h-full overflow-hidden p-7">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-overlay-3 ring-1 ring-hairline transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-500/20 group-hover:ring-brand-400/40">
                      <feature.icon size={21} className="text-brand-text" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text-main">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{feature.body}</p>
                  </div>
                </PortalCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="relative scroll-mt-28 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Three steps, <span className="text-gradient-brand">sixty seconds</span>
            </h2>
          </Reveal>

          <div className="relative mt-16">
            {/* Connecting rail */}
            <div
              aria-hidden="true"
              className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent md:block"
            />

            <div className="grid gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 140} className="relative text-center">
                  <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-plum-500 shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)]">
                    <step.icon size={22} className="text-white" />
                    <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-surface-raised text-[11px] font-bold text-brand-text ring-1 ring-brand-400/40">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display mt-6 text-lg font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-text-muted">
                    {step.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="relative scroll-mt-28 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <SectionLabel>Services</SectionLabel>
              <h2 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Care worth <span className="text-gradient-brand">booking</span>
              </h2>
              <p className="mt-4 text-lg text-text-muted">
                Every service below is bookable through the assistant right now.
              </p>
            </div>
            <Link to="/book">
              <Button variant="outline">
                See live availability
                <ArrowRight size={16} />
              </Button>
            </Link>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, i) => (
              <Reveal key={service.name} delay={i * 80}>
                <Link to="/book" className="block h-full">
                  <PortalCard hover className="sheen group h-full p-6">
                    <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 ring-1 ring-brand-400/25 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <service.icon size={19} className="text-brand-text" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-text-main">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{service.body}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                      <span className="text-sm font-semibold text-brand-text">{service.price}</span>
                      <span className="flex items-center gap-1.5 text-xs text-text-faint">
                        <Clock size={13} />
                        {service.duration}
                      </span>
                    </div>
                  </PortalCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="reviews" className="relative scroll-mt-28 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>Reviews</SectionLabel>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              What people <span className="text-gradient-brand">actually say</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((item, i) => (
              <Reveal key={item.name} delay={i * 110}>
                <PortalCard hover className="group flex h-full flex-col p-7">
                  <Quote
                    size={26}
                    className="text-brand-500/40 transition-colors duration-500 group-hover:text-brand-500/80"
                  />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-text-main/90">
                    "{item.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-plum-500 text-sm font-semibold text-white">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-main">{item.name}</p>
                      <p className="text-xs text-text-muted">{item.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={13}
                        className="fill-status-warning text-status-warning"
                      />
                    ))}
                  </div>
                </PortalCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <PortalCard
              gradientBorder
              className="relative overflow-hidden px-8 py-16 text-center sm:px-16"
            >
              <div
                aria-hidden="true"
                className="animate-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.28),transparent_65%)]"
              />
              <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />

              <div className="relative">
                <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-text-muted">
                  <Sparkles size={13} className="text-brand-text" />
                  The chat widget is live in the corner — try it
                </div>
                <h2 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
                  Ready when you are.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-lg text-text-muted">
                  Pick a time in under a minute, or ask the assistant to find one for you.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link to="/book">
                    <Button size="xl">
                      Start booking
                      <ArrowRight
                        size={19}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="xl">
                      Staff login
                    </Button>
                  </Link>
                </div>
              </div>
            </PortalCard>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-brand-text uppercase ring-1 ring-brand-400/20">
      {children}
    </span>
  );
}
