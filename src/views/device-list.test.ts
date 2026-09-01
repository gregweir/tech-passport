// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceListView } from './device-list';
import { resetStore, addDevice } from '../store';

describe('DeviceListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the empty state when no devices exist', () => {
    const el = DeviceListView();
    expect(el.textContent).toContain('No devices yet.');
    expect(el.textContent).toContain('Example:');
    expect(el.textContent).toContain('Add device');
  });

  it('shows a device after it is added to the store', () => {
    addDevice({ label: 'MacBook', role: 'Main computer', category: 'computer' });
    const el = DeviceListView();
    expect(el.textContent).toContain('MacBook');
    expect(el.textContent).not.toContain('No devices yet');
  });
});
