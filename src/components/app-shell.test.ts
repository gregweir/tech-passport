// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { AppShell } from './app-shell';
import { Nav } from './nav';

describe('AppShell', () => {
  it('renders header and main regions', () => {
    const nav = Nav();
    const main = document.createElement('div');
    const shell = AppShell({ nav, main });
    expect(shell.querySelector('header')).not.toBeNull();
    expect(shell.querySelector('main')).not.toBeNull();
    expect(shell.querySelector('main')?.contains(main)).toBe(true);
  });
});
