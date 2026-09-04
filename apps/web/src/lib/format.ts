const TIME_ZONE = 'America/Sao_Paulo';

const WEEKDAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;
const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

function spParts(
  iso: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options }).formatToParts(
    new Date(iso),
  );
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? '';
}

export function weekdayIndex(iso: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
  }).format(new Date(iso));
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[weekdayIndex(iso)] ?? '';
}

export function weekdayLong(iso: string): string {
  return WEEKDAYS_LONG[weekdayIndex(iso)] ?? '';
}

export function clockTime(iso: string): string {
  const parts = spParts(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${part(parts, 'hour')}:${part(parts, 'minute')}`;
}

export function dayNumber(iso: string): string {
  return part(spParts(iso, { day: '2-digit' }), 'day');
}

export function monthShort(iso: string): string {
  return part(spParts(iso, { month: 'short' }), 'month')
    .replace('.', '')
    .toUpperCase();
}

export function formatDateLong(iso: string): string {
  const parts = spParts(iso, { weekday: 'short', day: '2-digit', month: 'long' });
  const weekday = part(parts, 'weekday').replace('.', '');
  const day = part(parts, 'day');
  const month = part(parts, 'month');
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} de ${month}`;
}

export function formatDateHeading(iso: string): string {
  return `${weekdayLong(iso)}, ${dayNumber(iso)} de ${part(spParts(iso, { month: 'long' }), 'month')}`;
}

export function calendarDate(iso: string): string {
  const parts = spParts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

/** Meio-dia em São Paulo no mesmo dia civil, estável em UTC. */
export function atSaoPauloNoon(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 15, 0, 0));
}

export function startOfWeekMonday(iso: string): Date {
  const date = calendarDate(iso);
  const parts = date.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const noon = atSaoPauloNoon(year, month, day);
  const index = weekdayIndex(noon.toISOString());
  const offset = index === 0 ? -6 : 1 - index;
  noon.setUTCDate(noon.getUTCDate() + offset);
  return noon;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isInWeek(iso: string, weekStart: Date): boolean {
  const start = weekStart.getTime();
  const end = addDays(weekStart, 7).getTime();
  const value = new Date(iso).getTime();
  return value >= start && value < end;
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  return `${dayNumber(weekStart.toISOString())} – ${dayNumber(end.toISOString())} ${monthShort(end.toISOString())}`;
}

export function spotsLeft(enrolledCount: number, capacity: number): number {
  return Math.max(0, capacity - enrolledCount);
}
