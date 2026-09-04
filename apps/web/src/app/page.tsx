'use client';

import { homePathForUser } from '@/lib/auth-routing';
import { findUserById, useStudioMock } from '@/lib/mock-api';
import { getSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  useStudioMock();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    const user = findUserById(session.userId);
    router.replace(user ? homePathForUser(user) : '/login');
  }, [router]);

  return null;
}
