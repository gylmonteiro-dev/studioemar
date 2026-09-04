const TIME_ZONE = 'America/Sao_Paulo';

export function calendarDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function dateInRange(
  date: string,
  startsOn: string,
  endsOn: string,
): boolean {
  return date >= startsOn && date <= endsOn;
}
