import { BrandLogo } from '@/components/brand/logo';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import type { ReactNode } from 'react';

type HeaderProps = {
  trailing?: ReactNode;
  className?: string;
};

export function Header({ trailing, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 md:px-8',
        className,
      )}
    >
      <Link href="/aluno" aria-label="Studio EMAR — início" className="flex items-center">
        <BrandLogo variant="wordmark" className="h-9" />
      </Link>
      {trailing}
    </header>
  );
}
