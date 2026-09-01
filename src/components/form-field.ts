export interface FormFieldProps {
  id: string;
  label: string;
  input: HTMLElement;
  helpText?: string;
}

export function FormField(props: FormFieldProps): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const label = document.createElement('label');
  label.htmlFor = props.id;
  label.textContent = props.label;

  if (props.helpText) {
    const help = document.createElement('p');
    help.className = 'help-text';
    help.textContent = props.helpText;
    wrapper.appendChild(help);
  }

  wrapper.appendChild(label);
  wrapper.appendChild(props.input);
  return wrapper;
}
