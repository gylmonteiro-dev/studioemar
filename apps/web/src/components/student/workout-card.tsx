import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { clockTime, weekdayShort } from '@/lib/format';
import Link from 'next/link';

type WorkoutCardProps = {
  href: string;
  startsAt: string;
  classType: string;
  featured?: boolean;
};

export function WorkoutCard({
  href,
  startsAt,
  classType,
  featured = false,
}: WorkoutCardProps) {
  if (featured) {
    return (
      <Link href={href} className="block">
        <Card className="relative overflow-hidden border-0 bg-surface-dark p-6 text-surface-dark-foreground">
          <Badge className="bg-surface text-foreground">Treino confirmado</Badge>
          <h3 className="mt-4 text-3xl font-extrabold tracking-tight">
            {weekdayShort(startsAt)}, {clockTime(startsAt)}
          </h3>
          <p className="mt-1 text-white/70">{classType}</p>
          <p className="mt-6 font-semibold text-accent">Ver detalhes →</p>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-muted">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              {weekdayShort(startsAt)}
            </span>
            <span className="text-sm font-semibold">{clockTime(startsAt)}</span>
          </div>
          <p className="font-semibold text-foreground">{classType}</p>
        </div>
      </Card>
    </Link>
  );
}
