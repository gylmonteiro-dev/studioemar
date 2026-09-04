'use client';

import type { User } from '@studioemar/shared';
import { createContext, useContext, type ReactNode } from 'react';

const TrainerContext = createContext<User | null>(null);

export function TrainerProvider({
  trainer,
  children,
}: {
  trainer: User;
  children: ReactNode;
}) {
  return (
    <TrainerContext.Provider value={trainer}>{children}</TrainerContext.Provider>
  );
}

export function useTrainer(): User | null {
  return useContext(TrainerContext);
}
