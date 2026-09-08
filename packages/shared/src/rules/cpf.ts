const CPF_DIGITS = /^\d{11}$/;
const REPEATED_DIGITS = /^(\d)\1{10}$/;

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

function checkDigit(digits: string, factor: number): number {
  let sum = 0;
  for (const char of digits) {
    sum += Number(char) * factor;
    factor -= 1;
  }
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function isValidCpf(value: string): boolean {
  const digits = normalizeCpf(value);
  if (!CPF_DIGITS.test(digits) || REPEATED_DIGITS.test(digits)) {
    return false;
  }
  const first = checkDigit(digits.slice(0, 9), 10);
  if (first !== Number(digits[9])) {
    return false;
  }
  const second = checkDigit(digits.slice(0, 10), 11);
  return second === Number(digits[10]);
}

export function formatCpf(value: string): string {
  const digits = normalizeCpf(value).slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  if (digits.length <= 3) {
    return part1;
  }
  if (digits.length <= 6) {
    return `${part1}.${part2}`;
  }
  if (digits.length <= 9) {
    return `${part1}.${part2}.${part3}`;
  }
  return `${part1}.${part2}.${part3}-${part4}`;
}
