import { getState, deleteRecoveryReference } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';
import type { RecoveryKind } from '../types';

const KIND_LABELS: Record<RecoveryKind, string> = {
  'password-manager': 'Password manager',
  'physical-safe': 'Physical safe',
  'printed-sheet': 'Printed sheet',
  'provider-account': 'Provider account',
  'trusted-person': 'Trusted person',
  'support-contact': 'Support contact',
  other: 'Other',
};

export function RecoveryListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view recovery-list';

  const heading = document.createElement('h1');
  heading.textContent = 'Recovery references';
  container.appendChild(heading);

  const addButton = Button({
    label: 'Add recovery reference',
    variant: 'primary',
    onClick: () => router.navigate('/recovery/new'),
  });
  container.appendChild(addButton);

  const recoveryReferences = [...getState().recoveryReferences].sort((a, b) => a.label.localeCompare(b.label));

  const items = recoveryReferences.map((recoveryReference) => {
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/recovery/${recoveryReference.id}/edit`),
      }),
      Button({
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          const dialog = ConfirmDialog({
            title: 'Delete recovery reference',
            message: `Are you sure you want to delete ${recoveryReference.label}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => {
              deleteRecoveryReference(recoveryReference.id);
              dialog.remove();
            },
            onCancel: () => dialog.remove(),
          });
          container.appendChild(dialog);
        },
      }),
    ];

    return Card({
      title: recoveryReference.label,
      subtitle: KIND_LABELS[recoveryReference.kind],
      badges: [recoveryReference.visibility],
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No recovery references yet. Add how you get back in when something fails.',
      emptyExample: '1Password — Password manager; Printed passwords — Physical safe.',
      emptyActions: [
        Button({
          label: 'Add recovery reference',
          variant: 'primary',
          onClick: () => router.navigate('/recovery/new'),
        }),
      ],
    }),
  );

  return container;
}
