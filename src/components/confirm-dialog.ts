import { Button } from './button';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'confirm-title');

  const modal = document.createElement('div');
  modal.className = 'modal confirm-dialog';

  const heading = document.createElement('h2');
  heading.id = 'confirm-title';
  heading.textContent = props.title;
  modal.appendChild(heading);

  const body = document.createElement('p');
  body.textContent = props.message;
  modal.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const confirmButton = Button({
    label: props.confirmLabel ?? 'Confirm',
    variant: 'danger',
    onClick: props.onConfirm,
  });

  const cancelButton = Button({
    label: props.cancelLabel ?? 'Cancel',
    variant: 'secondary',
    onClick: props.onCancel,
  });

  actions.appendChild(cancelButton);
  actions.appendChild(confirmButton);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) props.onCancel();
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') props.onCancel();
  });

  return overlay;
}
