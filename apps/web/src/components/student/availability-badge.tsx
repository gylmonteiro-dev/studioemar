import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { TimeSlotStatus } from '@studioemar/shared';

type AvailabilityBadgeProps = {
  status: TimeSlotStatus;
  spotsLeft: number;
};

export function AvailabilityBadge({
  status,
  spotsLeft,
}: AvailabilityBadgeProps) {
  if (status === 'FULL' || spotsLeft <= 0) {
    return <Badge variant="full">Lotado</Badge>;
  }

  if (spotsLeft === 1) {
    return <Badge variant="warning">1 vaga</Badge>;
  }

  return (
    <Badge variant="success" className={cn('uppercase')}>
      {spotsLeft} vagas
    </Badge>
  );
}
