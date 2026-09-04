'use client';

import { TrainerShell } from '@/components/layout/trainer-shell';
import { homePathForUser, isTrainerRole } from '@/lib/auth-routing';
import { useStudioMock } from '@/lib/mock-api';
import { getSession } from '@/lib/session';
import { TrainerProvider } from '@/lib/trainer-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export default function TreinadorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { users } = useStudioMock();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    setUserId(session.userId);
  }, [router]);

  const trainer = users.find((user) => user.id === userId);

  useEffect(() => {
    if (trainer && !isTrainerRole(trainer.role)) {
      router.replace(homePathForUser(trainer));
    }
  }, [trainer, router]);

  if (!userId || !trainer || !isTrainerRole(trainer.role)) {
    return null;
  }

  return (
    <TrainerProvider trainer={trainer}>
      <TrainerShell trainerName={trainer.name}>{children}</TrainerShell>
    </TrainerProvider>
  );
}
