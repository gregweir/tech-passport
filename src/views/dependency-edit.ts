import { getState, addDependency, updateDependency } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { router } from '../routes';
import { DEPENDENCY_KINDS } from '../constants';
import type { Dependency, DependencyKind } from '../types';

interface DependencyEditViewProps {
  id: string | null;
}

const KIND_LABELS: Record<DependencyKind, string> = {
  requires: 'Requires',
  'authenticates-with': 'Authenticates with',
  'backed-up-to': 'Backed up to',
  other: 'Other',
};

function buildEntityOptions(state: ReturnType<typeof getState>): { value: string; label: string }[] {
  return [
    ...state.people.map((person) => ({ value: person.id, label: `Person: ${person.name}` })),
    ...state.devices.map((device) => ({ value: device.id, label: `Device: ${device.label}` })),
    ...state.accounts.map((account) => ({ value: account.id, label: `Account: ${account.label}` })),
    ...state.backups.map((backup) => ({ value: backup.id, label: `Backup: ${backup.label}` })),
    ...state.recoveryReferences.map((recoveryReference) => ({
      value: recoveryReference.id,
      label: `Recovery: ${recoveryReference.label}`,
    })),
  ];
}

export function DependencyEditView(props: DependencyEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view dependency-edit';

  const existing = props.id ? getState().dependencies.find((d) => d.id === props.id) : null;

  const heading = document.createElement('h1');
  heading.textContent = existing ? 'Edit dependency' : 'Add dependency';
  container.appendChild(heading);

  const help = document.createElement('p');
  help.className = 'view-help';
  help.textContent =
    'Choose the item that depends on something else (Source), the item it depends on (Target), and how they are connected.';
  container.appendChild(help);

  const state = getState();
  let sourceId = existing?.sourceId ?? '';
  let targetId = existing?.targetId ?? '';
  let kind: DependencyKind = existing?.kind ?? 'other';
  let notes = existing?.notes ?? '';

  const form = document.createElement('form');

  const entityOptions = buildEntityOptions(state);

  const sourceSelect = Select({
    id: 'dependency-source',
    options: entityOptions,
    includeEmpty: true,
    emptyLabel: '— Select source —',
    value: sourceId,
    onChange: (value) => {
      sourceId = value;
    },
  });
  form.appendChild(FormField({ id: 'dependency-source', label: 'Source', input: sourceSelect }));

  const targetSelect = Select({
    id: 'dependency-target',
    options: entityOptions,
    includeEmpty: true,
    emptyLabel: '— Select target —',
    value: targetId,
    onChange: (value) => {
      targetId = value;
    },
  });
  form.appendChild(FormField({ id: 'dependency-target', label: 'Target', input: targetSelect }));

  const kindSelect = Select({
    id: 'dependency-kind',
    options: DEPENDENCY_KINDS.map((value) => ({ value, label: KIND_LABELS[value] })),
    value: kind,
    onChange: (value) => {
      kind = value as DependencyKind;
    },
  });
  form.appendChild(FormField({ id: 'dependency-kind', label: 'Kind', input: kindSelect }));

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'dependency-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'dependency-notes', label: 'Notes', input: notesTextarea }));

  const errorContainer = document.createElement('p');
  errorContainer.className = 'form-error';
  errorContainer.setAttribute('role', 'alert');
  form.appendChild(errorContainer);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/dependencies'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add dependency',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!sourceId || !targetId) return;

    if (sourceId === targetId) {
      errorContainer.textContent = 'A dependency cannot link an entity to itself.';
      return;
    }

    const dependencyData: Partial<Dependency> = {
      sourceId,
      targetId,
      kind,
      notes,
    };

    if (existing) {
      updateDependency(existing.id, dependencyData);
    } else {
      addDependency(dependencyData as Partial<Dependency> & { sourceId: string; targetId: string; kind: DependencyKind });
    }
    router.navigate('/dependencies');
  });

  container.appendChild(form);
  return container;
}
