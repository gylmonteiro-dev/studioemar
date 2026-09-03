import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  default: 'bg-muted text-foreground',
  accent: 'bg-accent text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-danger text-danger-foreground',
} as const;

type BadgeVariant = keyof typeof variants;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
