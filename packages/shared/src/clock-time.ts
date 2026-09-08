const CLOCK_TIME_PATTERN =
  /^(\d{1,2}):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

export function toClockMinutes(value: string): number | null {
  const match = CLOCK_TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

export function normalizeClockTime(value: string): string | null {
  const minutes = toClockMinutes(value);
  if (minutes === null) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
