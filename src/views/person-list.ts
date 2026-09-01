import { getState, deletePerson } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';

const ROLE_LABELS: Record<string, string> = {
  me: 'Me',
  partner: 'Partner',
  parent: 'Parent',
  child: 'Child',
  'trusted-helper': 'Trusted helper',
  other: 'Other',
};

export function PersonListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view person-list';

  const heading = document.createElement('h1');
  heading.textContent = 'People';
  container.appendChild(heading);

  const addButton = Button({
    label: 'Add person',
    variant: 'primary',
    onClick: () => router.navigate('/people/new'),
  });
  container.appendChild(addButton);

  const people = [...getState().people].sort((a, b) => {
    if (a.role === 'me') return -1;
    if (b.role === 'me') return 1;
    return a.name.localeCompare(b.name);
  });

  const items = people.map((person) => {
    const isMe = person.role === 'me';
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/people/${person.id}/edit`),
      }),
    ];

    if (!isMe) {
      actions.push(
        Button({
          label: 'Delete',
          variant: 'danger',
          onClick: () => {
            const dialog = ConfirmDialog({
              title: 'Delete person',
              message: `Are you sure you want to delete ${person.name}? This cannot be undone.`,
              confirmLabel: 'Delete',
              onConfirm: () => {
                deletePerson(person.id);
                dialog.remove();
              },
              onCancel: () => dialog.remove(),
            });
            container.appendChild(dialog);
          },
        }),
      );
    }

    return Card({
      title: person.name,
      subtitle: ROLE_LABELS[person.role] ?? person.role,
      badges: [person.visibility],
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No people yet. Start with yourself, then add a trusted helper.',
      emptyExample: 'Jane Doe — Me; John Smith — Trusted helper.',
      emptyActions: [
        Button({
          label: 'Add person',
          variant: 'primary',
          onClick: () => router.navigate('/people/new'),
        }),
      ],
    }),
  );

  return container;
}
