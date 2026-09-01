// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryEditView } from './recovery-edit';
import { resetStore, addRecoveryReference, getState } from '../store';

describe('RecoveryEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new recovery reference when the form is submitted', () => {
    const el = RecoveryEditView({ id: null });
    const labelInput = el.querySelector('input#recovery-label') as HTMLInputElement;
    const kindSelect = el.querySelector('select#recovery-kind') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'Safe code sheet';
    labelInput.dispatchEvent(new Event('input'));
    kindSelect.value = 'printed-sheet';
    kindSelect.dispatchEvent(new Event('change'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().recoveryReferences).toHaveLength(1);
    const created = getState().recoveryReferences[0];
    expect(created.label).toBe('Safe code sheet');
    expect(created.kind).toBe('printed-sheet');
  });

  it('updates an existing recovery reference when the form is submitted', () => {
    const recoveryReference = addRecoveryReference({ label: 'Old ref', kind: 'other' });
    const el = RecoveryEditView({ id: recoveryReference.id });
    const labelInput = el.querySelector('input#recovery-label') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'Updated ref';
    labelInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().recoveryReferences[0].label).toBe('Updated ref');
  });
});
