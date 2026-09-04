import { Card } from '@/components/ui/card';
import { clockTime, dayNumber, weekdayShort } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BookingKind, BookingStatus } from '@studioemar/shared';
import Link from 'next/link';

type ScheduleCardProps = {
  href: string;
  startsAt: string;
  classType: string;
  kind: BookingKind;
  status: BookingStatus;
};

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Falta',
};

export function ScheduleCard({
  href,
  startsAt,
  classType,
  kind,
  status,
}: ScheduleCardProps) {
  const cancelled = status !== 'CONFIRMED';

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          'flex items-center justify-between gap-4 p-4 transition-colors hover:border-accent/50',
          cancelled && 'opacity-60',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-dark text-surface-dark-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">
              {weekdayShort(startsAt)}
            </span>
            <span className="text-lg font-bold leading-none">
              {dayNumber(startsAt)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-foreground">{clockTime(startsAt)}</p>
            <p className="text-sm text-muted-foreground">
              {classType} · {kind === 'MAKEUP' ? 'Reposição' : 'Regular'} ·{' '}
              {statusLabel[status]}
            </p>
          </div>
        </div>
        <span className="hidden font-semibold text-muted-foreground md:inline">
          Ver detalhes
        </span>
      </Card>
    </Link>
  );
}
