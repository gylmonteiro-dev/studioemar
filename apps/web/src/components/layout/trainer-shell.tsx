'use client';

import { Header } from '@/components/layout/header';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  TrainerDesktopSidebar,
  TrainerMobileNavigation,
} from '@/components/layout/trainer-nav';
import { Button } from '@/components/ui/button';
import { clearSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type TrainerShellProps = {
  trainerName: string;
  children: ReactNode;
};

export function TrainerShell({ trainerName, children }: TrainerShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <Header
        homeHref="/treinador"
        trailing={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="px-3 py-2 text-sm"
              onClick={() => {
                clearSession();
                router.replace('/login');
              }}
            >
              Sair
            </Button>
          </div>
        }
      />
      <TrainerDesktopSidebar trainerName={trainerName} />
      <div className="pt-16 lg:ml-64">{children}</div>
      <TrainerMobileNavigation />
    </div>
  );
}
