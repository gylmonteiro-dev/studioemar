import { isSlotBookable } from './slot-occupancy';

export function remainingSpotsForRegularPair(
  slots: ReadonlyArray<{
    enrolledCount: number;
    capacity: number;
    status: 'OPEN' | 'FULL' | 'CLOSED';
  }>,
): number | null {
  const relevant = slots.filter((slot) => slot.status !== 'CLOSED');
  if (relevant.length === 0 || !relevant.every(isSlotBookable)) {
    return null;
  }
  return Math.min(
    ...relevant.map((slot) => slot.capacity - slot.enrolledCount),
  );
}
