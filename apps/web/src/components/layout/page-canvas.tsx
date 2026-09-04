import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageCanvas({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10',
        className,
      )}
    >
      {children}
    </main>
  );
}
