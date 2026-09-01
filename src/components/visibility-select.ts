import { Select } from './select';
import { VISIBILITIES } from '../constants';
import type { Visibility } from '../types';

export interface VisibilitySelectProps {
  id: string;
  value?: Visibility;
  includeEmpty?: boolean;
  emptyLabel?: string;
  onChange?: (value: Visibility) => void;
}

const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: 'Private',
  'helper-safe': 'Helper safe',
  emergency: 'Emergency',
  'backup-only': 'Backup only',
  'do-not-export': 'Backup only',
};

export function VisibilitySelect(props: VisibilitySelectProps): HTMLSelectElement {
  const selectable: Visibility[] = VISIBILITIES.filter(v => v !== 'do-not-export');
  const options = selectable.map((value) => ({
    value,
    label: VISIBILITY_LABELS[value],
  }));

  return Select({
    id: props.id,
    options,
    value: props.value,
    includeEmpty: props.includeEmpty,
    emptyLabel: props.emptyLabel,
    onChange: (value) => {
      if (props.onChange) props.onChange(value as Visibility);
    },
  });
}
