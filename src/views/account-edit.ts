import { getState, addAccount, updateAccount } from '../store';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Select } from '../components/select';
import { VisibilitySelect } from '../components/visibility-select';
import { MultiSelect } from '../components/multi-select';
import { router } from '../routes';
import { TRI_STATE } from '../constants';
import type { Account, TriState, Visibility } from '../types';

interface AccountEditViewProps {
  id: string | null;
}

const MFA_LABELS: Record<TriState, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: "I'm not sure",
};

export function AccountEditView(props: AccountEditViewProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view account-edit';

  const existing = props.id ? getState().accounts.find((a) => a.id === props.id) : null;

  const heading = document.createElement('h1');
  heading.textContent = existing ? 'Edit account' : 'Add account';
  container.appendChild(heading);

  let label = existing?.label ?? '';
  let provider = existing?.provider ?? '';
  let purpose = existing?.purpose ?? '';
  let personIds = [...(existing?.personIds ?? [])];
  let mfa: TriState = existing?.mfa ?? 'unknown';
  let recoveryReferenceIds = [...(existing?.recoveryReferenceIds ?? [])];
  let notes = existing?.notes ?? '';
  let visibility: Visibility = existing?.visibility ?? 'private';

  const form = document.createElement('form');

  const labelInput = document.createElement('input');
  labelInput.id = 'account-label';
  labelInput.type = 'text';
  labelInput.value = label;
  labelInput.required = true;
  labelInput.addEventListener('input', () => {
    label = labelInput.value;
  });
  form.appendChild(FormField({ id: 'account-label', label: 'Label', input: labelInput }));

  const providerInput = document.createElement('input');
  providerInput.id = 'account-provider';
  providerInput.type = 'text';
  providerInput.value = provider;
  providerInput.addEventListener('input', () => {
    provider = providerInput.value;
  });
  form.appendChild(FormField({ id: 'account-provider', label: 'Provider', input: providerInput }));

  const purposeInput = document.createElement('input');
  purposeInput.id = 'account-purpose';
  purposeInput.type = 'text';
  purposeInput.value = purpose;
  purposeInput.addEventListener('input', () => {
    purpose = purposeInput.value;
  });
  form.appendChild(
    FormField({
      id: 'account-purpose',
      label: 'Purpose',
      input: purposeInput,
      helpText: 'What this account is for, e.g. "Email" or "Banking".',
    }),
  );

  const peopleOptions = getState().people.map((person) => ({
    value: person.id,
    label: person.name,
  }));
  const personSelect = MultiSelect({
    id: 'account-people',
    options: peopleOptions,
    selectedValues: personIds,
    onChange: (values) => {
      personIds = values;
    },
  });
  form.appendChild(FormField({ id: 'account-people', label: 'People', input: personSelect }));

  const mfaSelect = Select({
    id: 'account-mfa',
    options: TRI_STATE.map((value) => ({ value, label: MFA_LABELS[value] })),
    value: mfa,
    onChange: (value) => {
      mfa = value as TriState;
    },
  });
  form.appendChild(
    FormField({
      id: 'account-mfa',
      label: 'Multi-factor authentication',
      input: mfaSelect,
    }),
  );

  const recoveryOptions = getState().recoveryReferences.map((ref) => ({
    value: ref.id,
    label: ref.label,
  }));
  const recoverySelect = MultiSelect({
    id: 'account-recovery-refs',
    options: recoveryOptions,
    selectedValues: recoveryReferenceIds,
    onChange: (values) => {
      recoveryReferenceIds = values;
    },
  });
  form.appendChild(
    FormField({
      id: 'account-recovery-refs',
      label: 'Recovery references',
      input: recoverySelect,
      helpText: 'Ways to recover access to this account.',
    }),
  );

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'account-notes';
  notesTextarea.rows = 4;
  notesTextarea.value = notes;
  notesTextarea.addEventListener('input', () => {
    notes = notesTextarea.value;
  });
  form.appendChild(FormField({ id: 'account-notes', label: 'Notes', input: notesTextarea }));

  const visibilitySelect = VisibilitySelect({
    id: 'account-visibility',
    value: visibility,
    onChange: (value) => {
      visibility = value;
    },
  });
  form.appendChild(FormField({ id: 'account-visibility', label: 'Visibility', input: visibilitySelect }));

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  actions.appendChild(
    Button({
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => router.navigate('/accounts'),
    }),
  );

  actions.appendChild(
    Button({
      label: existing ? 'Save changes' : 'Add account',
      variant: 'primary',
      type: 'submit',
    }),
  );

  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!label.trim()) return;

    const accountData: Partial<Account> = {
      label,
      provider,
      purpose,
      personIds,
      mfa,
      recoveryReferenceIds,
      notes,
      visibility,
    };

    if (existing) {
      updateAccount(existing.id, accountData);
    } else {
      addAccount(accountData as Partial<Account> & { label: string });
    }
    router.navigate('/accounts');
  });

  container.appendChild(form);
  return container;
}
