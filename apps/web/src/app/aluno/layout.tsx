'use client';

import { StudentShell } from '@/components/layout/student-shell';
import { getMe } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { homePathForUser, isTrainerRole } from '@/lib/auth-routing';
import { getSession, patchSessionUser } from '@/lib/session';
import { StudentProvider } from '@/lib/student-context';
import type { User } from '@studioemar/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export default function AlunoLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [student, setStudent] = useState<User | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    if (isTrainerRole(session.user.role)) {
      router.replace(homePathForUser(session.user));
      return;
    }
    setStudent(session.user);

    void getMe()
      .then((user) => {
        patchSessionUser(user);
        if (isTrainerRole(user.role)) {
          router.replace(homePathForUser(user));
          return;
        }
        setStudent(user);
      })
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace('/login');
        }
      });
  }, [router]);

  if (!student || isTrainerRole(student.role)) {
    return null;
  }

  return (
    <StudentProvider student={student}>
      <StudentShell studentName={student.name}>{children}</StudentShell>
    </StudentProvider>
  );
}
