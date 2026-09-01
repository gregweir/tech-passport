import { getState, deleteDevice } from '../store';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { EntityList } from '../components/entity-list';
import { ConfirmDialog } from '../components/confirm-dialog';
import { router } from '../routes';
import { DEVICE_CATEGORIES } from '../constants';

const CATEGORY_LABELS: Record<typeof DEVICE_CATEGORIES[number], string> = {
  phone: 'Phone',
  computer: 'Computer',
  tablet: 'Tablet',
  router: 'Router',
  modem: 'Modem',
  nas: 'NAS',
  'home-server': 'Home server',
  'smart-home-hub': 'Smart home hub',
  'backup-drive': 'Backup drive',
  printer: 'Printer',
  'security-key': 'Security key',
  other: 'Other',
};

export function DeviceListView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view device-list';

  const heading = document.createElement('h1');
  heading.textContent = 'Devices';
  container.appendChild(heading);

  const addButton = Button({
    label: 'Add device',
    variant: 'primary',
    onClick: () => router.navigate('/devices/new'),
  });
  container.appendChild(addButton);

  const devices = [...getState().devices].sort((a, b) => a.label.localeCompare(b.label));

  const items = devices.map((device) => {
    const actions: HTMLElement[] = [
      Button({
        label: 'Edit',
        onClick: () => router.navigate(`/devices/${device.id}/edit`),
      }),
      Button({
        label: 'Delete',
        variant: 'danger',
        onClick: () => {
          const dialog = ConfirmDialog({
            title: 'Delete device',
            message: `Are you sure you want to delete ${device.label}? This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => {
              deleteDevice(device.id);
              dialog.remove();
            },
            onCancel: () => dialog.remove(),
          });
          container.appendChild(dialog);
        },
      }),
    ];

    const badges = [CATEGORY_LABELS[device.category], device.encrypted];

    return Card({
      title: device.label,
      subtitle: device.role,
      badges,
      actions,
    });
  });

  container.appendChild(
    EntityList({
      items,
      emptyMessage: 'No devices yet. Add the phone or computer you use every day.',
      emptyExample: 'MacBook Pro — Computer; iPhone 15 — Phone.',
      emptyActions: [
        Button({
          label: 'Add device',
          variant: 'primary',
          onClick: () => router.navigate('/devices/new'),
        }),
      ],
    }),
  );

  return container;
}
