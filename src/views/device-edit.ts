import { getState, addDevice, updateDevice } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { VisibilitySelect } from '../components/visibility-select';
import { MultiSelect } from '../components/multi-select';
import { router } from '../routes';
import { DEVICE_CATEGORIES, TRI_STATE } from '../constants';
import type { Device, DeviceCategory, TriState, Visibility } from '../types';

interface DeviceEditViewProps {
  id: string | null;
}

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
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

const ENCRYPTED_LABELS: Record<TriState, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: "I'm not sure",
};

export function DeviceEditView(props: DeviceEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view device-edit';

  const existing = props.id ? getState().devices.find((d) => d.id === props.id) : null;

  const heading = document.createElement('h1');
  heading.textContent = existing ? 'Edit device' : 'Add device';
  container.appendChild(heading);

  let label = existing?.label ?? '';
  let role = existing?.role ?? '';
  let category: DeviceCategory = existing?.category ?? 'other';
  let ownerIds = [...(existing?.ownerIds ?? [])];
  let encrypted: TriState = existing?.encrypted ?? 'unknown';
  let model = existing?.model ?? '';
  let os = existing?.os ?? '';
  let serialNumber = existing?.serialNumber ?? '';
  let purchaseDate = existing?.purchaseDate ?? '';
  let location = existing?.location ?? '';
  let recoveryReferenceIds = [...(existing?.recoveryReferenceIds ?? [])];
  let notes = existing?.notes ?? '';
  let visibility: Visibility = existing?.visibility ?? 'private';

  const form = document.createElement('form');

  const labelInput = document.createElement('input');
  labelInput.id = 'device-label';
  labelInput.type = 'text';
  labelInput.value = label;
  labelInput.required = true;
  labelInput.addEventListener('input', () => {
    label = labelInput.value;
  });
  form.appendChild(FormField({ id: 'device-label', label: 'Label', input: labelInput }));

  const roleInput = document.createElement('input');
  roleInput.id = 'device-role';
  roleInput.type = 'text';
  roleInput.value = role;
  roleInput.addEventListener('input', () => {
    role = roleInput.value;
  });
  form.appendChild(
    FormField({
      id: 'device-role',
      label: 'Role',
      input: roleInput,
      helpText: 'What this device is used for, e.g. "Main computer".',
    }),
  );

  const categorySelect = Select({
    id: 'device-category',
    options: DEVICE_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
    value: category,
    onChange: (value) => {
      category = value as DeviceCategory;
    },
  });
  form.appendChild(FormField({ id: 'device-category', label: 'Category', input: categorySelect }));

  const peopleOptions = getState().people.map((person) => ({
    value: person.id,
    label: person.name,
  }));
  const ownerSelect = MultiSelect({
    id: 'device-owners',
    options: peopleOptions,
    selectedValues: ownerIds,
    onChange: (values) => {
      ownerIds = values;
    },
  });
  form.appendChild(FormField({ id: 'device-owners', label: 'Owners', input: ownerSelect }));

  const encryptedSelect = Select({
    id: 'device-encrypted',
    options: TRI_STATE.map((value) => ({ value, label: ENCRYPTED_LABELS[value] })),
    value: encrypted,
    onChange: (value) => {
      encrypted = value as TriState;
    },
  });
  form.appendChild(
    FormField({
      id: 'device-encrypted',
      label: 'Encrypted',
      input: encryptedSelect,
      helpText: 'Is the data on this device encrypted?',
    }),
  );

  const advancedDetails = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Advanced details';
  advancedDetails.appendChild(summary);

  const modelInput = document.createElement('input');
  modelInput.id = 'device-model';
  modelInput.type = 'text';
  modelInput.value = model;
  modelInput.addEventListener('input', () => {
    model = modelInput.value;
  });
  advancedDetails.appendChild(FormField({ id: 'device-model', label: 'Model', input: modelInput }));

  const osInput = document.createElement('input');
  osInput.id = 'device-os';
  osInput.type = 'text';
  osInput.value = os;
  osInput.addEventListener('input', () => {
    os = osInput.value;
  });
  advancedDetails.appendChild(FormField({ id: 'device-os', label: 'Operating system', input: osInput }));

  const serialInput = document.createElement('input');
  serialInput.id = 'device-serial';
  serialInput.type = 'text';
  serialInput.value = serialNumber;
  serialInput.addEventListener('input', () => {
    serialNumber = serialInput.value;
  });
  advancedDetails.appendChild(
    FormField({ id: 'device-serial', label: 'Serial number', input: serialInput }),
  );

  const purchaseInput = document.createElement('input');
  purchaseInput.id = 'device-purchase-date';
  purchaseInput.type = 'date';
  purchaseInput.value = purchaseDate;
  purchaseInput.addEventListener('input', () => {
    purchaseDate = purchaseInput.value;
  });
  advancedDetails.appendChild(
    FormField({ id: 'device-purchase-date', label: 'Purchase date', input: purchaseInput }),
  );

  const locationInput = document.createElement('input');
  locationInput.id = 'device-location';
  locationInput.type = 'text';
  locationInput.value = location;
  locationInput.addEventListener('input', () => {
    location = locationInput.value;
  });
  advancedDetails.appendChild(FormField({ id: 'device-location', label: 'Location', input: locationInput }));

  form.appendChild(advancedDetails);

  const recoveryOptions = getState().recoveryReferences.map((ref) => ({
    value: ref.id,
    label: ref.label,
  }));
  const recoverySelect = MultiSelect({
    id: 'device-recovery-refs',
    options: recoveryOptions,
    selectedValues: recoveryReferenceIds,
    onChange: (values) => {
      recoveryReferenceIds = values;
    },
  });
  form.appendChild(
    FormField({
      id: 'device-recovery-refs',
      label: 'Recovery references',
      input: recoverySelect,
      helpText: 'Ways to recover access to this device.',
    }),
  );

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'device-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'device-notes', label: 'Notes', input: notesTextarea }));

  const visibilitySelect = VisibilitySelect({
    id: 'device-visibility',
    value: visibility,
    onChange: (value) => {
      visibility = value;
    },
  });
  form.appendChild(
    FormField({
      id: 'device-visibility',
      label: 'Visibility',
      input: visibilitySelect,
    }),
  );

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/devices'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add device',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!label.trim()) return;

    const deviceData: Partial<Device> = {
      label,
      role,
      category,
      ownerIds,
      encrypted,
      model,
      os,
      serialNumber,
      purchaseDate,
      location,
      recoveryReferenceIds,
      notes,
      visibility,
    };

    if (existing) {
      updateDevice(existing.id, deviceData);
    } else {
      addDevice(deviceData as Partial<Device> & { label: string; role: string; category: DeviceCategory });
    }
    router.navigate('/devices');
  });

  container.appendChild(form);
  return container;
}
