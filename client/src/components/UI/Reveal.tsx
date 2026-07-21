import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger in milliseconds — pass an index * 80 for lists. */
  delay?: number;
  className?: string;
  /** Fire once (default) or re-animate every time it re-enters the viewport. */
  once?: boolean;
}

/**
 * Fades + lifts its children into view on scroll.
 * IntersectionObserver only — no animation library, no layout thrash.
 */
export function Reveal({ children, delay = 0, className, once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
