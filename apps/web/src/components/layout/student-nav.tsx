'use client';

import { CalendarDays, CirclePlus, Home, Star } from 'lucide-react';
import {
  DesktopSidebar as AppDesktopSidebar,
  MobileNavigation as AppMobileNavigation,
  type AppNavItem,
} from '@/components/layout/app-nav';

export const studentNav: readonly AppNavItem[] = [
  { href: '/aluno', label: 'Home', icon: Home },
  { href: '/aluno/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/aluno/horarios', label: 'Reposição', icon: CirclePlus },
  { href: '/aluno/creditos', label: 'Créditos', icon: Star },
];

export function MobileNavigation() {
  return <AppMobileNavigation items={studentNav} rootHref="/aluno" />;
}

export function DesktopSidebar({ studentName }: { studentName: string }) {
  return (
    <AppDesktopSidebar
      name={studentName}
      roleLabel="Aluno"
      items={studentNav}
      rootHref="/aluno"
    />
  );
}
