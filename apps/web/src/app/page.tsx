'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/session';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getSession() ? '/aluno' : '/login');
  }, [router]);

  return null;
}
