import { getState, deleteAccount } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';

const MFA_LABELS: Record<import('../types').TriState, string> = {
  yes: 'MFA enabled',
  no: 'MFA not enabled',
  unknown: "MFA status unknown",
};

export function AccountListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view account-list';

  const heading = document.createElement('h1');
  heading.textContent = 'Accounts and services';
  container.appendChild(heading);

  const addButton = Button({
    label: 'Add account',
    variant: 'primary',
    onClick: () => router.navigate('/accounts/new'),
  });
  container.appendChild(addButton);

  const accounts = [...getState().accounts].sort((a, b) => a.label.localeCompare(b.label));

  const items = accounts.map((account) => {
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/accounts/${account.id}/edit`),
      }),
      Button({
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          const dialog = ConfirmDialog({
            title: 'Delete account',
            message: `Are you sure you want to delete ${account.label}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => {
              deleteAccount(account.id);
              dialog.remove();
            },
            onCancel: () => dialog.remove(),
          });
          container.appendChild(dialog);
        },
      }),
    ];

    const badges = [MFA_LABELS[account.mfa], account.visibility];

    return Card({
      title: account.label,
      subtitle: account.provider || account.purpose,
      badges,
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No accounts yet. Add an account you would panic without, such as email, banking, or cloud storage.',
      emptyExample: 'Gmail — Communications; Dropbox — Cloud storage.',
      emptyActions: [
        Button({
          label: 'Add account',
          variant: 'primary',
          onClick: () => router.navigate('/accounts/new'),
        }),
      ],
    }),
  );

  return container;
}
