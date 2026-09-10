'use client';

import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

type AccordionSectionProps = {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        id={`${id}-header`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
      >
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
            open ? 'rotate-180' : null,
          )}
        />
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-header`}
          className="flex flex-col gap-4 border-t border-border px-5 py-5"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
