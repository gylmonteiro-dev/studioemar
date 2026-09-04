import type { TimeSlotStatus } from '@prisma/client';

export function applySeatChange(
  slot: {
    enrolledCount: number;
    capacity: number;
    status: TimeSlotStatus;
  },
  delta: number,
): { enrolledCount: number; status: TimeSlotStatus } {
  const enrolledCount = Math.max(0, slot.enrolledCount + delta);
  if (slot.status === 'CLOSED') {
    return { enrolledCount, status: 'CLOSED' };
  }
  return {
    enrolledCount,
    status: enrolledCount >= slot.capacity ? 'FULL' : 'OPEN',
  };
}

export function isSlotBookable(slot: {
  enrolledCount: number;
  capacity: number;
  status: TimeSlotStatus;
}): boolean {
  return (
    slot.status === 'OPEN' && slot.enrolledCount < slot.capacity
  );
}
