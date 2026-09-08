import { Button } from '@/components/ui/button';
import { formatWeekRange } from '@/lib/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type WeekSwitcherProps = {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
};

export function WeekSwitcher({ weekStart, onPrev, onNext }: WeekSwitcherProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-1 md:w-auto">
      <Button
        variant="ghost"
        aria-label="Semana anterior"
        className="h-10 w-10 px-0 py-0"
        onClick={onPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="px-4 font-semibold uppercase tracking-widest text-foreground">
        {formatWeekRange(weekStart)}
      </span>
      <Button
        variant="ghost"
        aria-label="Próxima semana"
        className="h-10 w-10 px-0 py-0"
        onClick={onNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
