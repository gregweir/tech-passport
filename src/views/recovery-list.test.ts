// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryListView } from './recovery-list';
import { resetStore, addRecoveryReference } from '../store';

describe('RecoveryListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the empty state when no recovery references exist', () => {
    const el = RecoveryListView();
    expect(el.textContent).toContain('No recovery references yet.');
    expect(el.textContent).toContain('Example:');
    expect(el.textContent).toContain('Add recovery reference');
  });

  it('shows a recovery reference after it is added to the store', () => {
    addRecoveryReference({ label: 'Safe code sheet', kind: 'printed-sheet' });
    const el = RecoveryListView();
    expect(el.textContent).toContain('Safe code sheet');
    expect(el.textContent).not.toContain('No recovery references yet');
  });
});
