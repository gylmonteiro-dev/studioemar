'use client';

import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Repeat,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import {
  DesktopSidebar as AppDesktopSidebar,
  MobileNavigation as AppMobileNavigation,
  type AppNavItem,
} from '@/components/layout/app-nav';

export const trainerNav: readonly AppNavItem[] = [
  { href: '/treinador', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinador/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/treinador/alunos', label: 'Alunos', icon: Users },
  { href: '/treinador/agenda-recorrente', label: 'Recorrente', icon: Repeat },
  { href: '/treinador/ocupacao', label: 'Ocupação', icon: CalendarRange },
  { href: '/treinador/creditos', label: 'Créditos', icon: Star },
  { href: '/treinador/configuracoes', label: 'Ajustes', icon: Settings },
];

export const trainerMobileNav: readonly AppNavItem[] = [
  { href: '/treinador', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinador/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/treinador/alunos', label: 'Alunos', icon: Users },
  { href: '/treinador/creditos', label: 'Créditos', icon: Star },
  { href: '/treinador/configuracoes', label: 'Ajustes', icon: Settings },
];

export function TrainerMobileNavigation() {
  return <AppMobileNavigation items={trainerMobileNav} rootHref="/treinador" />;
}

export function TrainerDesktopSidebar({ trainerName }: { trainerName: string }) {
  return (
    <AppDesktopSidebar
      name={trainerName}
      roleLabel="Treinador"
      items={trainerNav}
      rootHref="/treinador"
    />
  );
}
