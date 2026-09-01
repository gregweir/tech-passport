// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountEditView } from './account-edit';
import { resetStore, addAccount, getState } from '../store';

describe('AccountEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new account when the form is submitted', () => {
    const el = AccountEditView({ id: null });
    const labelInput = el.querySelector('input#account-label') as HTMLInputElement;
    const providerInput = el.querySelector('input#account-provider') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'Email';
    labelInput.dispatchEvent(new Event('input'));
    providerInput.value = 'Fastmail';
    providerInput.dispatchEvent(new Event('input'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().accounts).toHaveLength(1);
    const created = getState().accounts[0];
    expect(created.label).toBe('Email');
    expect(created.provider).toBe('Fastmail');
  });

  it('updates an existing account when the form is submitted', () => {
    const account = addAccount({ label: 'Old email', provider: 'Old provider' });
    const el = AccountEditView({ id: account.id });
    const labelInput = el.querySelector('input#account-label') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    labelInput.value = 'New email';
    labelInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().accounts[0].label).toBe('New email');
  });
});
