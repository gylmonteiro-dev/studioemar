'use client';

import { CalendarDays, CirclePlus, Home, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export const studentNav = [
  { href: '/aluno', label: 'Home', icon: Home },
  { href: '/aluno/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/aluno/horarios', label: 'Reposição', icon: CirclePlus },
  { href: '/aluno/creditos', label: 'Créditos', icon: Star },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/aluno') {
    return pathname === '/aluno';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-border bg-surface px-4 py-2 lg:hidden">
      {studentNav.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-[64px] flex-col items-center rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-wider',
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

export function DesktopSidebar({ studentName }: { studentName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-border bg-surface p-6 lg:flex lg:flex-col">
      <div className="mb-8">
        <p className="font-semibold text-foreground">{studentName}</p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Aluno
        </p>
      </div>
      <nav className="flex flex-col gap-2">
        {studentNav.map((item) => {
          const active = isActive(pathname, item.href);
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
