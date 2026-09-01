// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceEditView } from './device-edit';
import { resetStore, addDevice, getState } from '../store';

describe('DeviceEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new device when the form is submitted', () => {
    const el = DeviceEditView({ id: null });
    const labelInput = el.querySelector('input#device-label') as HTMLInputElement;
    const roleInput = el.querySelector('input#device-role') as HTMLInputElement;
    const categorySelect = el.querySelector('select#device-category') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'MacBook';
    labelInput.dispatchEvent(new Event('input'));
    roleInput.value = 'Main computer';
    roleInput.dispatchEvent(new Event('input'));
    categorySelect.value = 'computer';
    categorySelect.dispatchEvent(new Event('change'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().devices).toHaveLength(1);
    const created = getState().devices[0];
    expect(created.label).toBe('MacBook');
    expect(created.role).toBe('Main computer');
    expect(created.category).toBe('computer');
  });

  it('updates an existing device when the form is submitted', () => {
    const device = addDevice({ label: 'Old laptop', role: 'Laptop', category: 'computer' });
    const el = DeviceEditView({ id: device.id });
    const labelInput = el.querySelector('input#device-label') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'MacBook Air';
    labelInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().devices[0].label).toBe('MacBook Air');
  });
});
