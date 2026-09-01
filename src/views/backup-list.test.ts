// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { BackupListView } from './backup-list';
import { resetStore, addBackup } from '../store';

describe('BackupListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the empty state when no backups exist', () => {
    const el = BackupListView();
    expect(el.textContent).toContain('No backups yet.');
    expect(el.textContent).toContain('Example:');
    expect(el.textContent).toContain('Add backup');
  });

  it('shows a backup after it is added to the store', () => {
    addBackup({ label: 'Time Machine', destination: 'External drive' });
    const el = BackupListView();
    expect(el.textContent).toContain('Time Machine');
    expect(el.textContent).not.toContain('No backups yet');
  });
});
