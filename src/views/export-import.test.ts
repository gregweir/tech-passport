// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExportImportView } from './export-import';
import { resetStore, setOnboardingComplete, addDevice } from '../store';

describe('ExportImportView', () => {
  beforeEach(() => {
    resetStore();
    setOnboardingComplete(true);
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock') });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders export buttons', () => {
    const el = ExportImportView();
    expect(el.textContent).toContain('Full JSON backup');
    expect(el.textContent).toContain('Helper copy');
  });

  it('reflects last export date', () => {
    addDevice({ label: 'Phone', role: 'Phone', category: 'phone' });
    const el = ExportImportView();
    expect(el.textContent).toContain('Last exported');
  });
});
