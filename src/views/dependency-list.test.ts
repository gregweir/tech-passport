// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyListView } from './dependency-list';
import { resetStore, addDependency, addAccount } from '../store';

describe('DependencyListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the empty state when no dependencies exist', () => {
    const el = DependencyListView();
    expect(el.textContent).toContain('What relies on what?');
    expect(el.textContent).toContain('No links yet.');
    expect(el.textContent).toContain('Example:');
    expect(el.textContent).toContain('Add a link');
  });

  it('shows a dependency after it is added to the store', () => {
    const account = addAccount({ label: 'Bank' });
    const account2 = addAccount({ label: 'Tax' });
    addDependency({ sourceId: account.id, targetId: account2.id, kind: 'requires' });
    const el = DependencyListView();
    expect(el.textContent).toContain('Requires');
    expect(el.textContent).toContain('Bank');
    expect(el.textContent).not.toContain('No links yet');
  });
});
