'use client';

import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Repeat,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import {
  DesktopSidebar as AppDesktopSidebar,
  MobileNavigation as AppMobileNavigation,
  type AppNavItem,
} from '@/components/layout/app-nav';
import { canManageAccess, roleLabel } from '@/lib/auth-routing';
import type { User } from '@studioemar/shared';

const trainerNav: readonly AppNavItem[] = [
  { href: '/treinador', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinador/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/treinador/alunos', label: 'Alunos', icon: Users },
  { href: '/treinador/agenda-recorrente', label: 'Recorrente', icon: Repeat },
  { href: '/treinador/ocupacao', label: 'Ocupação', icon: CalendarRange },
  { href: '/treinador/creditos', label: 'Créditos', icon: Star },
  { href: '/treinador/configuracoes', label: 'Ajustes', icon: Settings },
];

const trainerMobileNav: readonly AppNavItem[] = [
  { href: '/treinador', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinador/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/treinador/alunos', label: 'Alunos', icon: Users },
  { href: '/treinador/creditos', label: 'Créditos', icon: Star },
  { href: '/treinador/configuracoes', label: 'Ajustes', icon: Settings },
];

function itemsFor(user: User, mobile = false): readonly AppNavItem[] {
  const items = [...(mobile ? trainerMobileNav : trainerNav)].filter(
    (item) =>
      canManageAccess(user.role) ||
      (item.href !== '/treinador/agenda-recorrente' &&
        item.href !== '/treinador/configuracoes'),
  );
  if (canManageAccess(user.role)) {
    items.push({
      href: '/treinador/acessos',
      label: 'Acessos',
      icon: ShieldCheck,
    });
  }
  return items;
}

export function TrainerMobileNavigation({ user }: { user: User }) {
  return (
    <AppMobileNavigation
      items={itemsFor(user, true)}
      rootHref="/treinador"
    />
  );
}

export function TrainerDesktopSidebar({ user }: { user: User }) {
  return (
    <AppDesktopSidebar
      name={user.name}
      roleLabel={roleLabel(user.role)}
      items={itemsFor(user)}
      rootHref="/treinador"
    />
  );
}
