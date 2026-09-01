import { describe, it, expect } from 'vitest';
import { DEFAULT_ME, SCHEMA_VERSION } from './constants';
import type { Visibility } from './types';

describe('constants', () => {
  it('has a default Me person with role me', () => {
    expect(DEFAULT_ME.role).toBe('me');
    expect(DEFAULT_ME.name).toBe('Me');
  });

  it('has a schema version number', () => {
    expect(typeof SCHEMA_VERSION).toBe('number');
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });
});

describe('types compile', () => {
  it('allows valid visibility values', () => {
    const v: Visibility = 'helper-safe';
    expect(v).toBe('helper-safe');
  });
});
