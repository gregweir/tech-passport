import { getState, deleteDependency } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';
import type { DependencyKind } from '../types';

const KIND_LABELS: Record<DependencyKind, string> = {
  requires: 'Requires',
  'authenticates-with': 'Authenticates with',
  'backed-up-to': 'Backed up to',
  other: 'Other',
};

function entityLabel(state: ReturnType<typeof getState>, id: string): string {
  const person = state.people.find((p) => p.id === id);
  if (person) return `Person: ${person.name}`;

  const device = state.devices.find((d) => d.id === id);
  if (device) return `Device: ${device.label}`;

  const account = state.accounts.find((a) => a.id === id);
  if (account) return `Account: ${account.label}`;

  const backup = state.backups.find((b) => b.id === id);
  if (backup) return `Backup: ${backup.label}`;

  const recoveryReference = state.recoveryReferences.find((r) => r.id === id);
  if (recoveryReference) return `Recovery: ${recoveryReference.label}`;

  return id;
}

export function DependencyListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view dependency-list';

  const heading = document.createElement('h1');
  heading.textContent = 'What relies on what?';
  container.appendChild(heading);

  const help = document.createElement('p');
  help.className = 'view-help';
  help.textContent =
    'Links show how your technology depends on other things. For example, your phone may require your computer, your accounts may authenticate with a security key, or your files may be backed up to an external drive.';
  container.appendChild(help);

  const addButton = Button({
    label: 'Add a link',
    variant: 'primary',
    onClick: () => router.navigate('/dependencies/new'),
  });
  container.appendChild(addButton);

  const state = getState();
  const dependencies = [...state.dependencies].sort((a, b) =>
    entityLabel(state, a.sourceId).localeCompare(entityLabel(state, b.sourceId)),
  );

  const items = dependencies.map((dependency) => {
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/dependencies/${dependency.id}/edit`),
      }),
      Button({
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          const dialog = ConfirmDialog({
            title: 'Delete link',
            message: 'Are you sure you want to delete this link? This cannot be undone.',
            confirmLabel: 'Delete',
            onConfirm: () => {
              deleteDependency(dependency.id);
              dialog.remove();
            },
            onCancel: () => dialog.remove(),
          });
          container.appendChild(dialog);
        },
      }),
    ];

    const subtitle = `${entityLabel(state, dependency.sourceId)} ${KIND_LABELS[dependency.kind].toLowerCase()} ${entityLabel(state, dependency.targetId)}`;

    return Card({
      title: KIND_LABELS[dependency.kind],
      subtitle,
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No links yet. Start with the thing you would miss most if it stopped working today.',
      emptyExample: 'Phone requires Password manager; Email account authenticates with Phone.',
      emptyActions: [
        Button({
          label: 'Add a link',
          variant: 'primary',
          onClick: () => router.navigate('/dependencies/new'),
        }),
      ],
    }),
  );

  return container;
}
