export function getClientNow(): Date {
  const raw = process.env.NEXT_PUBLIC_CLOCK_NOW;
  if (!raw) {
    return new Date();
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
