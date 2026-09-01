import { getState, addRecoveryReference, updateRecoveryReference } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { VisibilitySelect } from '../components/visibility-select';
import { router } from '../routes';
import { RECOVERY_KINDS } from '../constants';
import type { RecoveryReference, RecoveryKind, Visibility } from '../types';

interface RecoveryEditViewProps {
  id: string | null;
}

const KIND_LABELS: Record<RecoveryKind, string> = {
  'password-manager': 'Password manager',
  'physical-safe': 'Physical safe',
  'printed-sheet': 'Printed sheet',
  'provider-account': 'Provider account',
  'trusted-person': 'Trusted person',
  'support-contact': 'Support contact',
  other: 'Other',
};

export function RecoveryEditView(props: RecoveryEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view recovery-edit';

  const existing = props.id ? getState().recoveryReferences.find((r) => r.id === props.id) : null;

  const heading = document.createElement('h1');
  heading.textContent = existing ? 'Edit recovery reference' : 'Add recovery reference';
  container.appendChild(heading);

  let label = existing?.label ?? '';
  let kind: RecoveryKind = existing?.kind ?? 'other';
  let location = existing?.location ?? '';
  let contactInfo = existing?.contactInfo ?? '';
  let notes = existing?.notes ?? '';
  let visibility: Visibility = existing?.visibility ?? 'private';

  const form = document.createElement('form');

  const labelInput = document.createElement('input');
  labelInput.id = 'recovery-label';
  labelInput.type = 'text';
  labelInput.value = label;
  labelInput.required = true;
  labelInput.addEventListener('input', () => {
    label = labelInput.value;
  });
  form.appendChild(FormField({ id: 'recovery-label', label: 'Label', input: labelInput }));

  const kindSelect = Select({
    id: 'recovery-kind',
    options: RECOVERY_KINDS.map((value) => ({ value, label: KIND_LABELS[value] })),
    value: kind,
    onChange: (value) => {
      kind = value as RecoveryKind;
    },
  });
  form.appendChild(FormField({ id: 'recovery-kind', label: 'Kind', input: kindSelect }));

  const locationInput = document.createElement('input');
  locationInput.id = 'recovery-location';
  locationInput.type = 'text';
  locationInput.value = location;
  locationInput.addEventListener('input', () => {
    location = locationInput.value;
  });
  form.appendChild(
    FormField({
      id: 'recovery-location',
      label: 'Location',
      input: locationInput,
      helpText: 'Where this reference can be found.',
    }),
  );

  const contactInput = document.createElement('input');
  contactInput.id = 'recovery-contact';
  contactInput.type = 'text';
  contactInput.value = contactInfo;
  contactInput.addEventListener('input', () => {
    contactInfo = contactInput.value;
  });
  form.appendChild(
    FormField({
      id: 'recovery-contact',
      label: 'Contact info',
      input: contactInput,
      helpText: 'Phone, email, or other contact details.',
    }),
  );

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'recovery-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'recovery-notes', label: 'Notes', input: notesTextarea }));

  const visibilitySelect = VisibilitySelect({
    id: 'recovery-visibility',
    value: visibility,
    onChange: (value) => {
      visibility = value;
    },
  });
  form.appendChild(FormField({ id: 'recovery-visibility', label: 'Visibility', input: visibilitySelect }));

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/recovery'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add recovery reference',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!label.trim()) return;

    const recoveryData: Partial<RecoveryReference> = {
      label,
      kind,
      location,
      contactInfo,
      notes,
      visibility,
    };

    if (existing) {
      updateRecoveryReference(existing.id, recoveryData);
    } else {
      addRecoveryReference(recoveryData as Partial<RecoveryReference> & { label: string; kind: RecoveryKind });
    }
    router.navigate('/recovery');
  });

  container.appendChild(form);
  return container;
}
