'use client';

import { TrainerShell } from '@/components/layout/trainer-shell';
import { getMe } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { homePathForUser, isTrainerRole } from '@/lib/auth-routing';
import { getSession, patchSessionUser } from '@/lib/session';
import { TrainerProvider } from '@/lib/trainer-context';
import type { User } from '@studioemar/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export default function TreinadorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [trainer, setTrainer] = useState<User | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!isTrainerRole(session.user.role)) {
      router.replace(homePathForUser(session.user));
      return;
    }
    setTrainer(session.user);

    void getMe()
      .then((user) => {
        patchSessionUser(user);
        if (!isTrainerRole(user.role)) {
          router.replace(homePathForUser(user));
          return;
        }
        setTrainer(user);
      })
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace('/login');
        }
      });
  }, [router]);

  if (!trainer || !isTrainerRole(trainer.role)) {
    return null;
  }

  return (
    <TrainerProvider trainer={trainer}>
      <TrainerShell trainerName={trainer.name}>{children}</TrainerShell>
    </TrainerProvider>
  );
}
