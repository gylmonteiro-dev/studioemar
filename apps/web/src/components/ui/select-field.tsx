import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function SelectField({
  id,
  label,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={selectId}
        className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={cn(
          'w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          error ? 'border-danger' : null,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
