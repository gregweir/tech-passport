import { Select, type SelectOption } from './select';

export interface MultiSelectProps {
  id: string;
  options: SelectOption[];
  selectedValues?: string[];
  onChange?: (values: string[]) => void;
}

export function MultiSelect(props: MultiSelectProps): HTMLSelectElement {
  const select = Select({
    id: props.id,
    options: props.options,
    value: props.selectedValues?.[0],
    onChange: () => {
      if (props.onChange) {
        props.onChange(Array.from(select.selectedOptions).map((option) => option.value));
      }
    },
  });
  select.multiple = true;
  select.setAttribute('aria-multiselectable', 'true');

  if (props.selectedValues) {
    for (const option of select.options) {
      option.selected = props.selectedValues.includes(option.value);
    }
  }

  return select;
}
