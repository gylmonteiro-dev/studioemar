'use client';

import type { User } from '@studioemar/shared';
import { createContext, useContext, type ReactNode } from 'react';

const StudentContext = createContext<User | null>(null);

export function StudentProvider({
  student,
  children,
}: {
  student: User;
  children: ReactNode;
}) {
  return (
    <StudentContext.Provider value={student}>{children}</StudentContext.Provider>
  );
}

export function useStudent(): User | null {
  return useContext(StudentContext);
}
