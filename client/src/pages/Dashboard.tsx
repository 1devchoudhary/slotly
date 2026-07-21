import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartColumn,
  Clock,
  Inbox,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { PortalCard } from '../components/UI/PortalCard';
import { StatusPill } from '../components/UI/StatusPill';
import { CountUp } from '../components/UI/CountUp';
import { Reveal } from '../components/UI/Reveal';
import { Aurora } from '../components/UI/Aurora';
import { LoadingSkeleton } from '../components/UI/LoadingSkeleton';
import { Logo } from '../components/Navbar';
import { ThemeToggle } from '../components/UI/ThemeToggle';
import { api, type AdminBooking, type DashboardStats } from '../lib/api';
import { useAuth } from '../lib/auth';
import { cn, formatPrice, gradientFor, initials } from '../lib/utils';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: Users, label: 'Team' },
  { icon: ChartColumn, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

const STATUS_TONE = {
  confirmed: 'success',
  completed: 'info',
  cancelled: 'danger',
} as const;

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Flip after mount so bars and meters grow from zero.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api<DashboardStats>('/admin/stats'),
  });

  const today = statsQuery.data?.today.date;
  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings', today],
    queryFn: () => api<{ bookings: AdminBooking[] }>(`/admin/bookings?from=${today}&to=${today}`),
    enabled: !!today,
  });

  const stats = statsQuery.data;
  const bookings = bookingsQuery.data?.bookings ?? [];

  const kpis = stats
    ? [
        {
          label: "Today's bookings",
          value: stats.today.bookings,
          delta: stats.deltas.bookingsPct,
          series: stats.week.map((d) => d.bookings),
          tone: 'text-brand-500',
        },
        {
          label: 'Utilisation today',
          value: stats.today.utilisationPct,
          suffix: '%',
          delta: stats.deltas.utilisationPct,
          series: stats.week.map((d) => d.utilisationPct),
          tone: 'text-accent-500',
        },
        {
          label: 'Revenue today',
          value: stats.today.revenueCents / 100,
          prefix: '$',
          delta: stats.deltas.revenuePct,
          series: stats.week.map((d) => d.revenueCents),
          tone: 'text-status-success',
        },
        {
          label: 'Booked by AI (7d)',
          value: stats.sources.assistant,
          delta: null,
          footnote: `${stats.sources.assistantSharePct}% of all bookings`,
          series: stats.week.map((d) => d.assistantBookings),
          tone: 'text-plum-500',
        },
      ]
    : [];

  return (
    <div className="relative min-h-screen">
      <Aurora variant="subtle" />

      <div className="mx-auto flex max-w-[1500px]">
        {/* ---------------- Sidebar ---------------- */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hairline px-5 py-6 lg:flex">
          <Link to="/" className="px-1">
            <Logo />
          </Link>

          <nav className="mt-9 space-y-1">
            {NAV.map((item, i) => (
              <button
                key={item.label}
                className={cn(
                  'animate-fade-up group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300',
                  item.active
                    ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-text-main ring-1 ring-brand-400/25'
                    : 'text-text-muted hover:bg-overlay-hover hover:text-text-main'
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <item.icon
                  size={17}
                  className={cn(
                    'transition-transform duration-300 group-hover:scale-110',
                    item.active ? 'text-brand-text' : ''
                  )}
                />
                {item.label}
                {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
              </button>
            ))}
          </nav>

          {/* Assistant share — a real figure, because the assistant tags its own bookings */}
          <PortalCard className="mt-8 overflow-hidden p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-plum-500">
                <Sparkles size={14} className="text-white" />
              </span>
              <div>
                <p className="text-xs font-semibold">Assistant</p>
                <p className="text-[11px] text-text-muted">Last 7 days</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-overlay-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-plum-500 transition-[width] duration-[1400ms] ease-out"
                style={{
                  width: mounted ? `${stats?.sources.assistantSharePct ?? 0}%` : '0%',
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-text-muted">
              {stats
                ? `${stats.sources.assistantSharePct}% of bookings started in chat`
                : 'Loading…'}
            </p>
          </PortalCard>

          <div className="mt-auto space-y-1 border-t border-hairline pt-4">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-plum-500 text-xs font-bold text-white">
                {initials(user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name ?? '—'}</p>
                <p className="truncate text-xs text-text-muted">{user?.email ?? ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-text-muted transition-colors hover:bg-overlay-hover hover:text-text-main"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ---------------- Main ---------------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-hairline bg-surface/70 px-6 py-4 backdrop-blur-xl">
            <div className="lg:hidden">
              <Link to="/">
                <Logo />
              </Link>
            </div>

            <div className="relative ml-auto hidden w-full max-w-xs sm:block lg:ml-0">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint"
              />
              <input
                placeholder="Search patients, services…"
                className="h-10 w-full rounded-xl border border-hairline bg-overlay-2 pr-4 pl-10 text-sm transition-all duration-300 outline-none focus:border-brand-400/50 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <StatusPill
                status={statsQuery.isError ? 'danger' : 'success'}
                pulse={!statsQuery.isError}
                className="hidden sm:inline-flex"
              >
                {statsQuery.isError ? 'Offline' : 'Live'}
              </StatusPill>
              <ThemeToggle />
              <button className="relative grid h-10 w-10 place-items-center rounded-xl text-text-muted transition-colors hover:bg-overlay-hover hover:text-text-main">
                <Bell size={17} />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-surface" />
              </button>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-plum-500 text-xs font-bold text-white lg:hidden">
                {initials(user?.name)}
              </span>
            </div>
          </header>

          <main className="space-y-6 px-6 py-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
                </h1>
                <p className="mt-1.5 text-sm text-text-muted">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {stats && (
                    <>
                      {' · '}
                      {stats.today.freeHours}h still bookable today
                      {' · '}
                      {stats.upcoming7d} upcoming this week
                    </>
                  )}
                </p>
              </div>
              <Link
                to="/book"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-plum-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_6px_24px_-8px_rgba(99,102,241,0.8)] transition-all duration-300 hover:brightness-110"
              >
                New booking
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>

            {statsQuery.isError && (
              <PortalCard className="flex items-start gap-3 p-5 ring-1 ring-status-danger/25">
                <TriangleAlert size={18} className="mt-0.5 shrink-0 text-status-danger" />
                <div>
                  <p className="text-sm font-medium">Couldn't load dashboard data</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {(statsQuery.error as Error)?.message ??
                      'The API server may not be running.'}
                  </p>
                  <button
                    onClick={() => statsQuery.refetch()}
                    className="mt-3 text-sm text-brand-text transition-colors hover:text-brand-text-strong"
                  >
                    Try again →
                  </button>
                </div>
              </PortalCard>
            )}

            {/* -------- KPI row -------- */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statsQuery.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <LoadingSkeleton key={i} className="h-44 w-full" delay={i * 120} />
                  ))
                : kpis.map((kpi, i) => (
                    <Reveal key={kpi.label} delay={i * 80}>
                      <PortalCard hover className="group h-full overflow-hidden p-5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs tracking-wide text-text-muted uppercase">
                            {kpi.label}
                          </p>
                          {kpi.delta != null && (
                            <span
                              className={cn(
                                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                kpi.delta >= 0
                                  ? 'bg-status-success/12 text-status-success'
                                  : 'bg-status-warning/12 text-status-warning'
                              )}
                            >
                              <TrendingUp
                                size={11}
                                className={kpi.delta >= 0 ? '' : 'rotate-180'}
                              />
                              {kpi.delta >= 0 ? '+' : ''}
                              {kpi.delta}%
                            </span>
                          )}
                        </div>

                        <p className="font-display mt-3 text-4xl font-bold tracking-tight">
                          <CountUp
                            to={kpi.value}
                            prefix={kpi.prefix}
                            suffix={kpi.suffix}
                            duration={1400 + i * 150}
                          />
                        </p>

                        <p className="mt-1 h-4 text-[11px] text-text-faint">
                          {kpi.footnote ?? ''}
                        </p>

                        <Sparkline points={kpi.series} className={kpi.tone} delay={i * 150} />
                      </PortalCard>
                    </Reveal>
                  ))}
            </div>

            {/* -------- Chart + utilisation -------- */}
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Reveal>
                <PortalCard className="h-full p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold">Capacity this week</h2>
                      <p className="mt-1 text-sm text-text-muted">
                        Booked minutes as a share of working minutes, per day
                      </p>
                    </div>
                    {stats && (
                      <StatusPill status="info">
                        {stats.today.utilisationPct}% today
                      </StatusPill>
                    )}
                  </div>

                  {statsQuery.isLoading ? (
                    <LoadingSkeleton className="mt-8 h-56 w-full" />
                  ) : (
                    <div className="mt-8 flex h-56 items-end gap-3">
                      {stats?.week.map((day, i) => (
                        <div
                          key={day.date}
                          className="group flex flex-1 flex-col items-center gap-3"
                        >
                          <div className="relative flex w-full flex-1 items-end">
                            <div
                              className="relative w-full overflow-hidden rounded-t-lg bg-gradient-to-t from-brand-600/70 to-plum-500/90 transition-all duration-[900ms] ease-out group-hover:from-brand-500 group-hover:to-plum-400"
                              style={{
                                height: mounted ? `${Math.max(day.utilisationPct, 2)}%` : '0%',
                                transitionDelay: `${i * 80}ms`,
                              }}
                            >
                              <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                            </div>
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border border-hairline bg-surface-raised px-2 py-1 text-[11px] font-semibold whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                              {day.utilisationPct}% · {day.bookings} appts
                            </span>
                          </div>
                          <span className="text-xs text-text-muted">
                            {format(parseISO(day.date), 'EEE')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PortalCard>
              </Reveal>

              <Reveal delay={120}>
                <PortalCard className="h-full p-6">
                  <h2 className="font-display text-lg font-semibold">Team utilisation</h2>
                  <p className="mt-1 text-sm text-text-muted">Booked vs available today</p>

                  <div className="mt-7 space-y-6">
                    {statsQuery.isLoading &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <LoadingSkeleton key={i} className="h-12 w-full" delay={i * 120} />
                      ))}

                    {stats?.staffUtilisation.length === 0 && (
                      <p className="text-sm text-text-muted">
                        Nobody is scheduled to work today.
                      </p>
                    )}

                    {stats?.staffUtilisation.map((person, i) => (
                      <div key={person.staffId}>
                        <div className="mb-2.5 flex items-center gap-3">
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white',
                              gradientFor(person.name)
                            )}
                          >
                            {initials(person.name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {person.name}
                          </span>
                          <span className="text-sm font-semibold text-text-muted">
                            {person.utilisationPct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-overlay-3">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-plum-500 transition-[width] duration-[1200ms] ease-out"
                            style={{
                              width: mounted ? `${person.utilisationPct}%` : '0%',
                              transitionDelay: `${300 + i * 140}ms`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {stats && stats.staffUtilisation[0]?.utilisationPct >= 80 && (
                    <div className="mt-8 flex items-start gap-3 rounded-xl bg-brand-500/[0.08] p-4 ring-1 ring-brand-400/20">
                      <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-text" />
                      <p className="text-xs leading-relaxed text-text-muted">
                        {stats.staffUtilisation[0].name} is at{' '}
                        {stats.staffUtilisation[0].utilisationPct}% capacity today — consider
                        steering new bookings elsewhere.
                      </p>
                    </div>
                  )}
                </PortalCard>
              </Reveal>
            </div>

            {/* -------- Today's schedule -------- */}
            <Reveal delay={80}>
              <PortalCard className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Today's schedule</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      {bookings.length} appointment{bookings.length === 1 ? '' : 's'} · every
                      slot re-validated before it was written
                    </p>
                  </div>
                </div>

                {bookingsQuery.isLoading ? (
                  <div className="space-y-3 p-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <LoadingSkeleton key={i} className="h-14 w-full" delay={i * 110} />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Inbox size={28} className="mx-auto text-text-faint" />
                    <p className="mx-auto mt-3 max-w-xs text-sm text-text-muted">
                      Nothing on the books for today. Bookings made through the assistant or
                      the booking page will appear here instantly.
                    </p>
                    <Link
                      to="/book"
                      className="mt-4 inline-block text-sm text-brand-text transition-colors hover:text-brand-text-strong"
                    >
                      Create one →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-hairline-soft">
                    {bookings.map((booking, i) => (
                      <div
                        key={booking._id}
                        className="animate-fade-up group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-overlay-1"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="hidden w-16 shrink-0 sm:block">
                          <p className="font-display text-sm font-semibold">
                            {format(parseISO(booking.startAt), 'h:mm')}
                          </p>
                          <p className="text-[11px] text-text-faint">
                            {format(parseISO(booking.startAt), 'a')}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white transition-transform duration-300 group-hover:scale-105',
                            gradientFor(booking.customer.name)
                          )}
                        >
                          {initials(booking.customer.name)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {booking.customer.name}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {booking.serviceId?.name ?? 'Service'}
                            {booking.staffId?.userId?.name
                              ? ` · ${booking.staffId.userId.name}`
                              : ''}
                          </p>
                        </div>

                        <span className="hidden text-xs font-medium text-text-muted md:block">
                          {formatPrice(booking.serviceId?.priceCents)}
                        </span>

                        <span className="hidden items-center gap-1.5 text-xs text-text-faint md:flex">
                          {booking.source === 'assistant' ? (
                            <>
                              <Sparkles size={12} className="text-brand-text" />
                              AI assistant
                            </>
                          ) : (
                            <>
                              <Clock size={12} />
                              {booking.source === 'phone' ? 'Phone' : 'Web'}
                            </>
                          )}
                        </span>

                        <StatusPill status={STATUS_TONE[booking.status]}>
                          {booking.status}
                        </StatusPill>
                      </div>
                    ))}
                  </div>
                )}
              </PortalCard>
            </Reveal>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Sparkline ------------------------------- */

function Sparkline({
  points,
  className,
  delay = 0,
}: {
  points: number[];
  className?: string;
  delay?: number;
}) {
  const width = 120;
  const height = 34;

  if (points.length < 2) return <div className="mt-4 h-9" />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('mt-3 h-9 w-full', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="300"
        strokeDashoffset="300"
        className="animate-tick"
        style={{ animationDuration: '1.6s', animationDelay: `${delay}ms` }}
      />
    </svg>
  );
}
