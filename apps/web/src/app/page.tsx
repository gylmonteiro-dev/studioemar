'use client';

import { homePathForUser } from '@/lib/auth-routing';
import { getSession } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    router.replace(homePathForUser(session.user));
  }, [router]);

  return null;
}
