import { AvailabilityBadge } from '@/components/student/availability-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { clockTime, spotsLeft } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { TimeSlot } from '@studioemar/shared';

type TimeSlotCardProps = {
  slot: TimeSlot;
  alreadyBooked?: boolean;
  onSchedule: () => void;
};

export function TimeSlotCard({
  slot,
  alreadyBooked = false,
  onSchedule,
}: TimeSlotCardProps) {
  const free = spotsLeft(slot.enrolledCount, slot.capacity);
  const full = slot.status === 'FULL' || free <= 0;
  const blocked = full || alreadyBooked;

  return (
    <Card
      className={cn(
        'flex items-center justify-between gap-4 p-4',
        blocked && 'opacity-75',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-muted">
          <span className="text-lg font-semibold text-foreground">
            {clockTime(slot.startsAt)}
          </span>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-semibold text-foreground">{slot.classType}</span>
            <AvailabilityBadge status={slot.status} spotsLeft={free} />
          </div>
          <p className="text-sm text-muted-foreground">
            {slot.enrolledCount}/{slot.capacity} alunos
          </p>
        </div>
      </div>
      {alreadyBooked ? (
        <Button variant="ghost" disabled>
          Já inscrito
        </Button>
      ) : full ? (
        <Button variant="ghost" disabled>
          Lotado
        </Button>
      ) : (
        <Button variant="cta" onClick={onSchedule}>
          Agendar
        </Button>
      )}
    </Card>
  );
}
