// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountListView } from './account-list';
import { resetStore, addAccount } from '../store';

describe('AccountListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the empty state when no accounts exist', () => {
    const el = AccountListView();
    expect(el.textContent).toContain('No accounts yet.');
    expect(el.textContent).toContain('Example:');
    expect(el.textContent).toContain('Add account');
  });

  it('shows an account after it is added to the store', () => {
    addAccount({ label: 'Email', provider: 'Fastmail' });
    const el = AccountListView();
    expect(el.textContent).toContain('Email');
    expect(el.textContent).not.toContain('No accounts yet');
  });
});
