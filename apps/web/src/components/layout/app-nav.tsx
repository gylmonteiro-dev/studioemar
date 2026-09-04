'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function isNavActive(pathname: string, href: string, rootHref: string): boolean {
  if (href === rootHref) {
    return pathname === rootHref;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation({
  items,
  rootHref,
}: {
  items: readonly AppNavItem[];
  rootHref: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-border bg-surface px-2 py-2 lg:hidden">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href, rootHref);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-[56px] flex-col items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
              active ? 'bg-accent/10 text-accent' : 'text-muted-foreground',
            )}
          >
            <Icon
              className="h-5 w-5"
              strokeWidth={active ? 2.4 : 1.8}
              aria-hidden
            />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar({
  name,
  roleLabel,
  items,
  rootHref,
}: {
  name: string;
  roleLabel: string;
  items: readonly AppNavItem[];
  rootHref: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-border bg-surface p-6 lg:flex lg:flex-col">
      <div className="mb-8">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {roleLabel}
        </p>
      </div>
      <nav className="flex flex-col gap-2 overflow-y-auto">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href, rootHref);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 font-semibold',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
