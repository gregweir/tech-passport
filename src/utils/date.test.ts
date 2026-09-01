import { describe, it, expect } from 'vitest';
import { todayIso, daysBetween, addDays } from './date';

describe('date helpers', () => {
  it('todayIso returns YYYY-MM-DD', () => {
    const t = todayIso();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDays adds the requested number of days', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02');
  });

  it('daysBetween returns positive days', () => {
    expect(daysBetween('2024-01-01', '2024-01-05')).toBe(4);
  });
});
