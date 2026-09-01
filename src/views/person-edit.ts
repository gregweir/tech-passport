import { getState, addPerson, updatePerson } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { VisibilitySelect } from '../components/visibility-select';
import { router } from '../routes';
import type { Person, Visibility } from '../types';

interface PersonEditViewProps {
  id: string | null;
}

const ROLE_OPTIONS: { value: Person['role']; label: string }[] = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'trusted-helper', label: 'Trusted helper' },
  { value: 'other', label: 'Other' },
];

export function PersonEditView(props: PersonEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view person-edit';

  const existing = props.id ? getState().people.find((p) => p.id === props.id) : null;
  const isMe = existing?.role === 'me';

  const heading = document.createElement('h1');
  heading.textContent = existing ? (isMe ? 'Edit Me' : 'Edit person') : 'Add person';
  container.appendChild(heading);

  let name = existing?.name ?? '';
  let role: Person['role'] = existing?.role ?? 'other';
  let notes = existing?.notes ?? '';
  let visibility: Visibility = existing?.visibility ?? 'private';

  const form = document.createElement('form');

  const nameInput = document.createElement('input');
  nameInput.id = 'person-name';
  nameInput.type = 'text';
  nameInput.value = name;
  nameInput.required = true;
  nameInput.addEventListener('input', () => {
    name = nameInput.value;
  });
  form.appendChild(FormField({ id: 'person-name', label: 'Name', input: nameInput }));

  if (isMe) {
    const roleReadout = document.createElement('p');
    roleReadout.textContent = 'Role: Me';
    roleReadout.id = 'person-role';
    form.appendChild(FormField({ id: 'person-role', label: 'Role', input: roleReadout }));
  } else {
    const roleSelect = Select({
      id: 'person-role',
      options: ROLE_OPTIONS,
      value: role,
      onChange: (value) => {
        role = value as Person['role'];
      },
    });
    form.appendChild(FormField({ id: 'person-role', label: 'Role', input: roleSelect }));
  }

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'person-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'person-notes', label: 'Notes', input: notesTextarea }));

  const visibilitySelect = VisibilitySelect({
    id: 'person-visibility',
    value: visibility,
    onChange: (value) => {
      visibility = value;
    },
  });
  form.appendChild(
    FormField({
      id: 'person-visibility',
      label: 'Visibility',
      input: visibilitySelect,
      helpText: 'Who else may see this information.',
    }),
  );

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/people'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add person',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    if (existing) {
      updatePerson(existing.id, { name, role, notes, visibility });
    } else {
      addPerson({ name, role, notes, visibility });
    }
    router.navigate('/people');
  });

  container.appendChild(form);
  return container;
}
