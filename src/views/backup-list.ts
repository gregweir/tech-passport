import { getState, deleteBackup } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';

const COPIES_LABELS: Record<import('../types').Backup['copies'], string> = {
  one: 'One copy',
  multiple: 'Multiple copies',
  unknown: 'Unknown copies',
};

const RESTORED_LABELS: Record<import('../types').TriState, string> = {
  yes: 'Restore tested',
  no: 'Restore not tested',
  unknown: "Restore status unknown",
};

export function BackupListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view backup-list';

  const heading = document.createElement('h1');
  heading.textContent = 'Backups';
  container.appendChild(heading);

  const addButton = Button({
    label: 'Add backup',
    variant: 'primary',
    onClick: () => router.navigate('/backups/new'),
  });
  container.appendChild(addButton);

  const backups = [...getState().backups].sort((a, b) => a.label.localeCompare(b.label));

  const items = backups.map((backup) => {
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/backups/${backup.id}/edit`),
      }),
      Button({
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          const dialog = ConfirmDialog({
            title: 'Delete backup',
            message: `Are you sure you want to delete ${backup.label}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => {
              deleteBackup(backup.id);
              dialog.remove();
            },
            onCancel: () => dialog.remove(),
          });
          container.appendChild(dialog);
        },
      }),
    ];

    const badges = [COPIES_LABELS[backup.copies], RESTORED_LABELS[backup.restored], backup.visibility];

    return Card({
      title: backup.label,
      subtitle: backup.destination,
      badges,
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No backups yet. Add wherever your important data is copied.',
      emptyExample: 'Time Machine — External drive; iCloud Photos — Cloud service.',
      emptyActions: [
        Button({
          label: 'Add backup',
          variant: 'primary',
          onClick: () => router.navigate('/backups/new'),
        }),
      ],
    }),
  );

  return container;
}
