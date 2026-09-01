import { describe, it, expect } from 'vitest';
import { filterByVisibility } from './exportFilter';
import type { Person } from '../types';

describe('filterByVisibility', () => {
  const items: Person[] = [
    { id: '1', name: 'A', role: 'other', notes: '', visibility: 'private' },
    { id: '2', name: 'B', role: 'other', notes: '', visibility: 'helper-safe' },
    { id: '3', name: 'C', role: 'other', notes: '', visibility: 'emergency' },
    { id: '4', name: 'D', role: 'other', notes: '', visibility: 'backup-only' },
  ];

  it('includes helper-safe and emergency by default', () => {
    const result = filterByVisibility(items, ['helper-safe', 'emergency']);
    expect(result.map(i => i.id)).toEqual(['2', '3']);
  });

  it('includes private when requested', () => {
    const result = filterByVisibility(items, ['private', 'helper-safe', 'emergency']);
    expect(result.map(i => i.id)).toEqual(['1', '2', '3']);
  });

  it('excludes backup-only from shared exports', () => {
    const result = filterByVisibility(items, ['private', 'helper-safe', 'emergency']);
    expect(result.map(i => i.id)).not.toContain('4');
  });
});
