import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost:
    'border border-foreground bg-transparent text-foreground hover:bg-muted',
  cta: 'bg-cta text-primary-foreground hover:opacity-90',
  danger: 'border border-danger bg-transparent text-danger hover:bg-danger/10',
} as const;

type ButtonVariant = keyof typeof variants;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = 'primary',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
