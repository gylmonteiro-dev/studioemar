'use client';

import { Header } from '@/components/layout/header';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  DesktopSidebar,
  MobileNavigation,
} from '@/components/layout/student-nav';
import { Button } from '@/components/ui/button';
import { clearSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type StudentShellProps = {
  studentName: string;
  children: ReactNode;
};

export function StudentShell({ studentName, children }: StudentShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <Header
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
      <DesktopSidebar studentName={studentName} />
      <div className="pt-16 lg:ml-64">{children}</div>
      <MobileNavigation />
    </div>
  );
}
