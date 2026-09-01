import { Button } from './button';

export interface UpdatePromptProps {
  onUpdate: () => void;
}

export function UpdatePrompt(props: UpdatePromptProps): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'update-prompt';
  banner.setAttribute('role', 'status');

  const message = document.createElement('p');
  message.textContent = 'An update is available. Reload to use the latest version.';
  banner.appendChild(message);

  const updateButton = Button({
    label: 'Reload now',
    variant: 'accent',
    onClick: props.onUpdate,
  });
  banner.appendChild(updateButton);

  const dismissButton = Button({
    label: 'Later',
    variant: 'secondary',
    onClick: () => banner.remove(),
  });
  banner.appendChild(dismissButton);

  return banner;
}
