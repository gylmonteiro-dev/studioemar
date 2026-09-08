export const PLAN_MONTH_WEEKS = 4;

export function normalizePlanName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
}

export function monthlyClassCount(weeklyFrequency: number): number {
  return weeklyFrequency * PLAN_MONTH_WEEKS;
}

export function monthlyTrainingHours(
  weeklyFrequency: number,
  sessionMinutes: number,
): number {
  return (monthlyClassCount(weeklyFrequency) * sessionMinutes) / 60;
}
