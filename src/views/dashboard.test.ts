// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardView } from './dashboard';
import { resetStore, addDevice } from '../store';

describe('DashboardView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders summary counts', () => {
    addDevice({ label: 'MacBook', role: 'Main computer', category: 'computer' });
    const el = DashboardView();
    expect(el.textContent).toContain('1 devices');
  });

  it('shows export reminder when not exported', () => {
    const el = DashboardView();
    expect(el.textContent).toContain('Export your Passport');
  });
});
