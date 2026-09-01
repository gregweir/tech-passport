export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  options: SelectOption[];
  value?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  onChange?: (value: string) => void;
}

export function Select(props: SelectProps): HTMLSelectElement {
  const select = document.createElement('select');
  select.id = props.id;
  if (props.includeEmpty) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = props.emptyLabel ?? '— Select —';
    select.appendChild(empty);
  }
  for (const opt of props.options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  }
  if (props.value) select.value = props.value;
  if (props.onChange) {
    select.addEventListener('change', () => props.onChange!(select.value));
  }
  return select;
}
