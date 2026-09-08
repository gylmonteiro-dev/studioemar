export function normalizeClassTypeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
}
