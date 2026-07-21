import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from './UI/Button';
import { ThemeToggle } from './UI/ThemeToggle';
import { cn } from '../lib/utils';

const LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how' },
  { label: 'Services', href: '/#services' },
  { label: 'Reviews', href: '/#reviews' },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 shadow-[0_6px_20px_-6px_rgba(99,102,241,0.9)]">
        <Sparkles size={17} className="text-white" strokeWidth={2.4} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-text-main">
        Slotly
      </span>
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'py-2.5' : 'py-4'
      )}
    >
      <nav
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-5',
          scrolled
            ? 'glass-strong h-14 w-[calc(100%-1.5rem)] shadow-panel'
            : 'h-16 w-[calc(100%-2rem)] border border-transparent bg-transparent'
        )}
      >
        <Link to="/" aria-label="Slotly home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-main"
            >
              {link.label}
              <span className="absolute inset-x-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-brand-400 to-plum-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Staff login
            </Button>
          </Link>
          <Link to="/book">
            <Button size="sm">Book now</Button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl text-text-main transition-colors hover:bg-overlay-hover"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        className={cn(
          'mx-auto grid overflow-hidden px-4 transition-all duration-400 ease-out md:hidden',
          open ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0">
          <div className="glass-strong space-y-1 rounded-2xl p-3">
            {LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-overlay-hover hover:text-text-main"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                {link.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/login">
                <Button variant="secondary" size="sm" className="w-full">
                  Staff login
                </Button>
              </Link>
              <Link to="/book">
                <Button size="sm" className="w-full">
                  Book now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
