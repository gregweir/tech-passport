import { getState, addBackup, updateBackup } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { VisibilitySelect } from '../components/visibility-select';
import { MultiSelect } from '../components/multi-select';
import { router } from '../routes';
import { TRI_STATE } from '../constants';
import type { Backup, TriState, Visibility } from '../types';

interface BackupEditViewProps {
  id: string | null;
}

const COPIES_OPTIONS: { value: Backup['copies']; label: string }[] = [
  { value: 'one', label: 'One copy' },
  { value: 'multiple', label: 'Multiple copies' },
  { value: 'unknown', label: "I'm not sure" },
];

const RESTORED_LABELS: Record<TriState, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: "I'm not sure",
};

export function BackupEditView(props: BackupEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view backup-edit';

  const existing = props.id ? getState().backups.find((b) => b.id === props.id) : null;

  const heading = document.createElement('h1');
  heading.textContent = existing ? 'Edit backup' : 'Add backup';
  container.appendChild(heading);

  let label = existing?.label ?? '';
  let destination = existing?.destination ?? '';
  let coversIds = [...(existing?.coversIds ?? [])];
  let copies: Backup['copies'] = existing?.copies ?? 'unknown';
  let lastCheckedDate = existing?.lastCheckedDate ?? '';
  let restoreTestedDate = existing?.restoreTestedDate ?? '';
  let restored: TriState = existing?.restored ?? 'unknown';
  let canRestorePersonIds = [...(existing?.canRestorePersonIds ?? [])];
  let notes = existing?.notes ?? '';
  let visibility: Visibility = existing?.visibility ?? 'private';

  const form = document.createElement('form');

  const labelInput = document.createElement('input');
  labelInput.id = 'backup-label';
  labelInput.type = 'text';
  labelInput.value = label;
  labelInput.required = true;
  labelInput.addEventListener('input', () => {
    label = labelInput.value;
  });
  form.appendChild(FormField({ id: 'backup-label', label: 'Label', input: labelInput }));

  const destinationInput = document.createElement('input');
  destinationInput.id = 'backup-destination';
  destinationInput.type = 'text';
  destinationInput.value = destination;
  destinationInput.addEventListener('input', () => {
    destination = destinationInput.value;
  });
  form.appendChild(
    FormField({
      id: 'backup-destination',
      label: 'Destination',
      input: destinationInput,
      helpText: 'Where this backup is stored, e.g. "External drive".',
    }),
  );

  const state = getState();
  const coversOptions = [
    ...state.devices.map((device) => ({
      value: device.id,
      label: `Device: ${device.label}`,
    })),
    ...state.accounts.map((account) => ({
      value: account.id,
      label: `Account: ${account.label}`,
    })),
  ];
  const coversSelect = MultiSelect({
    id: 'backup-covers',
    options: coversOptions,
    selectedValues: coversIds,
    onChange: (values) => {
      coversIds = values;
    },
  });
  form.appendChild(
    FormField({
      id: 'backup-covers',
      label: 'Covers',
      input: coversSelect,
      helpText: 'Devices and accounts protected by this backup.',
    }),
  );

  const copiesSelect = Select({
    id: 'backup-copies',
    options: COPIES_OPTIONS,
    value: copies,
    onChange: (value) => {
      copies = value as Backup['copies'];
    },
  });
  form.appendChild(FormField({ id: 'backup-copies', label: 'Copies', input: copiesSelect }));

  const lastCheckedInput = document.createElement('input');
  lastCheckedInput.id = 'backup-last-checked';
  lastCheckedInput.type = 'date';
  lastCheckedInput.value = lastCheckedDate;
  lastCheckedInput.addEventListener('input', () => {
    lastCheckedDate = lastCheckedInput.value;
  });
  form.appendChild(
    FormField({
      id: 'backup-last-checked',
      label: 'Last checked',
      input: lastCheckedInput,
    }),
  );

  const restoreTestedInput = document.createElement('input');
  restoreTestedInput.id = 'backup-restore-tested';
  restoreTestedInput.type = 'date';
  restoreTestedInput.value = restoreTestedDate;
  restoreTestedInput.addEventListener('input', () => {
    restoreTestedDate = restoreTestedInput.value;
  });
  form.appendChild(
    FormField({
      id: 'backup-restore-tested',
      label: 'Restore tested',
      input: restoreTestedInput,
    }),
  );

  const restoredSelect = Select({
    id: 'backup-restored',
    options: TRI_STATE.map((value) => ({ value, label: RESTORED_LABELS[value] })),
    value: restored,
    onChange: (value) => {
      restored = value as TriState;
    },
  });
  form.appendChild(
    FormField({
      id: 'backup-restored',
      label: 'Has this been restored?',
      input: restoredSelect,
    }),
  );

  const peopleOptions = state.people.map((person) => ({
    value: person.id,
    label: person.name,
  }));
  const canRestoreSelect = MultiSelect({
    id: 'backup-can-restore',
    options: peopleOptions,
    selectedValues: canRestorePersonIds,
    onChange: (values) => {
      canRestorePersonIds = values;
    },
  });
  form.appendChild(
    FormField({
      id: 'backup-can-restore',
      label: 'People who can restore',
      input: canRestoreSelect,
    }),
  );

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'backup-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'backup-notes', label: 'Notes', input: notesTextarea }));

  const visibilitySelect = VisibilitySelect({
    id: 'backup-visibility',
    value: visibility,
    onChange: (value) => {
      visibility = value;
    },
  });
  form.appendChild(FormField({ id: 'backup-visibility', label: 'Visibility', input: visibilitySelect }));

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/backups'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add backup',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!label.trim()) return;

    const backupData: Partial<Backup> = {
      label,
      destination,
      coversIds,
      copies,
      lastCheckedDate,
      restoreTestedDate,
      restored,
      canRestorePersonIds,
      notes,
      visibility,
    };

    if (existing) {
      updateBackup(existing.id, backupData);
    } else {
      addBackup(backupData as Partial<Backup> & { label: string });
    }
    router.navigate('/backups');
  });

  container.appendChild(form);
  return container;
}
