// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PersonEditView } from './person-edit';
import { resetStore, addPerson, getState } from '../store';

describe('PersonEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new person when the form is submitted', () => {
    const el = PersonEditView({ id: null });
    const nameInput = el.querySelector('input#person-name') as HTMLInputElement;
    const roleSelect = el.querySelector('select#person-role') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    nameInput.value = 'Partner';
    nameInput.dispatchEvent(new Event('input'));
    roleSelect.value = 'partner';
    roleSelect.dispatchEvent(new Event('change'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().people).toHaveLength(2);
    const created = getState().people.find((p) => p.name === 'Partner');
    expect(created).not.toBeUndefined();
    expect(created?.role).toBe('partner');
  });

  it('updates an existing person when the form is submitted', () => {
    const person = addPerson({ name: 'Old name', role: 'other' });
    const el = PersonEditView({ id: person.id });
    const nameInput = el.querySelector('input#person-name') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    nameInput.value = 'New name';
    nameInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().people.find((p) => p.id === person.id)?.name).toBe('New name');
  });
});
