'use client';

import { StudentShell } from '@/components/layout/student-shell';
import { StudentProvider } from '@/lib/student-context';
import { useStudioMock } from '@/lib/mock-api';
import { getSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export default function AlunoLayout({ children }: { children: ReactNode }) {
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

  const student = users.find((user) => user.id === userId);
  if (!userId || !student) {
    return null;
  }

  return (
    <StudentProvider student={student}>
      <StudentShell studentName={student.name}>{children}</StudentShell>
    </StudentProvider>
  );
}
