import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { Button } from '../components/UI/Button';
import { Aurora } from '../components/UI/Aurora';
import { Logo } from '../components/Navbar';
import { ThemeToggle } from '../components/UI/ThemeToggle';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@slotly.demo', password: 'demo1234' },
  { role: 'Staff', email: 'staff@slotly.demo', password: 'demo1234' },
];

const HIGHLIGHTS = [
  { icon: Zap, text: 'Live availability across every professional' },
  { icon: ShieldCheck, text: 'Conflict checks run before anything is written' },
  { icon: BadgeCheck, text: 'Assistant transcripts attached to each booking' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@slotly.demo');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // Already signed in? Skip the form.
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [user, navigate, destination]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not sign in. Is the API server running?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <Aurora variant="subtle" />

      {/* ---------- Brand panel ---------- */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-brand-600/25 via-plum-600/12 to-transparent"
        />
        <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40" />
        <div
          aria-hidden="true"
          className="animate-drift absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full opacity-40 blur-[110px]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />

        <Link to="/" className="relative">
          <Logo />
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight">
            <span className="text-gradient">The desk that</span>
            <br />
            <span className="text-gradient-brand">never sleeps.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-text-muted">
            Sign in to see every appointment the assistant booked overnight — already validated
            against working hours, buffers, and time-off.
          </p>

          <ul className="mt-9 space-y-4">
            {HIGHLIGHTS.map((item, i) => (
              <li
                key={item.text}
                className="animate-fade-up flex items-center gap-3 text-sm text-text-muted"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-overlay-3 ring-1 ring-hairline">
                  <item.icon size={16} className="text-brand-text" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-text-faint">
          © {new Date().getFullYear()} Slotly · Portfolio demo
        </p>
      </aside>

      {/* ---------- Form ---------- */}
      <main className="relative flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-main"
            >
              <ArrowLeft size={15} />
              Back to site
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="font-display animate-fade-up text-3xl font-bold tracking-tight">
            Staff sign in
          </h1>
          <p
            className="animate-fade-up mt-2.5 text-sm text-text-muted"
            style={{ animationDelay: '80ms' }}
          >
            Use a demo account below — no setup required.
          </p>

          <form
            onSubmit={handleLogin}
            className="animate-fade-up mt-9 space-y-5"
            style={{ animationDelay: '160ms' }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <span className="group relative block">
                <Mail
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-faint transition-colors group-focus-within:text-brand-text"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-hairline bg-overlay-2 pr-4 pl-11 text-sm transition-all duration-300 outline-none focus:border-brand-400/60 focus:bg-brand-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-medium">
                Password
                <a href="#" className="text-xs text-brand-text hover:text-brand-text-strong">
                  Forgot?
                </a>
              </span>
              <span className="group relative block">
                <KeyRound
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-faint transition-colors group-focus-within:text-brand-text"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-hairline bg-overlay-2 pr-12 pl-11 text-sm transition-all duration-300 outline-none focus:border-brand-400/60 focus:bg-brand-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-text-faint transition-colors hover:bg-overlay-hover hover:text-text-main"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="animate-slide-up flex items-start gap-2.5 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger ring-1 ring-status-danger/25"
              >
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              )}
            </Button>
          </form>

          <div
            className="animate-fade-up mt-9"
            style={{ animationDelay: '240ms' }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-overlay-3" />
              <span className="text-xs tracking-wider text-text-faint uppercase">
                Demo accounts
              </span>
              <span className="h-px flex-1 bg-overlay-3" />
            </div>

            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const active = email === account.email;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-300',
                      active
                        ? 'border-brand-400/50 bg-brand-500/10'
                        : 'border-hairline bg-overlay-1 hover:-translate-y-0.5 hover:border-brand-400/35'
                    )}
                  >
                    <span>
                      <span className="block text-sm font-medium text-text-main">
                        {account.role}
                      </span>
                      <span className="block text-xs text-text-muted">{account.email}</span>
                    </span>
                    <span
                      className={cn(
                        'rounded-lg px-2 py-1 font-mono text-[11px] transition-colors',
                        active
                          ? 'bg-brand-500/20 text-brand-text-strong'
                          : 'bg-overlay-2 text-text-faint'
                      )}
                    >
                      {account.password}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
