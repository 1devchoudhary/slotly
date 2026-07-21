import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Navbar';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how' },
      { label: 'Services', href: '/#services' },
      { label: 'Reviews', href: '/#reviews' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/#' },
      { label: 'Careers', href: '/#' },
      { label: 'Press kit', href: '/#' },
      { label: 'Contact', href: '/#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/#' },
      { label: 'Terms', href: '/#' },
      { label: 'HIPAA', href: '/#' },
      { label: 'Security', href: '/#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-hairline">
      {/* Horizon glow along the top edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-brand-400/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.14),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-muted">
              The AI booking assistant that turns a conversation into a confirmed appointment —
              day or night, without a double-booking.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-text-muted">
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="text-brand-text" />
                412 Northside Ave, Suite 20
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-brand-text" />
                (555) 019-4820
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-brand-text" />
                hello@slotly.demo
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold tracking-wide text-text-main">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center text-sm text-text-muted transition-colors hover:text-brand-text"
                    >
                      <span className="mr-0 h-px w-0 bg-brand-400 transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 sm:flex-row">
          <p className="text-xs text-text-faint">
            © {new Date().getFullYear()} Slotly. Built as a portfolio demo.
          </p>
          <div className="flex items-center gap-2 text-xs text-text-faint">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-ring absolute inset-0 rounded-full bg-status-success" />
              <span className="relative h-2 w-2 rounded-full bg-status-success" />
            </span>
            All systems operational
          </div>
          <Link
            to="/login"
            className="text-xs text-text-faint transition-colors hover:text-text-main"
          >
            Staff portal →
          </Link>
        </div>
      </div>
    </footer>
  );
}
