// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { BackupEditView } from './backup-edit';
import { resetStore, addBackup, getState } from '../store';

describe('BackupEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new backup when the form is submitted', () => {
    const el = BackupEditView({ id: null });
    const labelInput = el.querySelector('input#backup-label') as HTMLInputElement;
    const destinationInput = el.querySelector('input#backup-destination') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'Time Machine';
    labelInput.dispatchEvent(new Event('input'));
    destinationInput.value = 'External drive';
    destinationInput.dispatchEvent(new Event('input'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().backups).toHaveLength(1);
    const created = getState().backups[0];
    expect(created.label).toBe('Time Machine');
    expect(created.destination).toBe('External drive');
  });

  it('updates an existing backup when the form is submitted', () => {
    const backup = addBackup({ label: 'Old backup', destination: 'Old destination' });
    const el = BackupEditView({ id: backup.id });
    const labelInput = el.querySelector('input#backup-label') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'New backup';
    labelInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().backups[0].label).toBe('New backup');
  });
});
