export function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isNonEmptyString(value: unknown): boolean {
  return trimString(value).length > 0;
}

export function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(parseDate(value).getTime());
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
