import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  tone?: 'light' | 'dark';
};

export function Input({
  id,
  label,
  error,
  className,
  tone = 'light',
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const dark = tone === 'dark';

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={inputId}
        className={cn(
          'font-mono text-xs font-semibold uppercase tracking-widest',
          dark ? 'text-white/60' : 'text-muted-foreground',
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'w-full rounded-lg border px-4 py-3',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          dark
            ? 'border-white/10 bg-white/5 text-surface-dark-foreground placeholder:text-white/40'
            : 'border-border bg-muted text-foreground placeholder:text-faint',
          error ? 'border-danger' : null,
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
