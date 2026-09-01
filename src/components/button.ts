export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  type?: 'button' | 'submit';
  onClick?: (event: MouseEvent) => void;
  disabled?: boolean;
}

export function Button(props: ButtonProps): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = props.type ?? 'button';
  btn.textContent = props.label;
  btn.className = `btn btn-${props.variant ?? 'secondary'}`;
  if (props.disabled) btn.disabled = true;
  if (props.onClick) btn.addEventListener('click', props.onClick);
  return btn;
}
