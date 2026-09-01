export interface ModalProps {
  title: string;
  content: HTMLElement;
  onClose: () => void;
}

export function Modal(props: ModalProps): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-title');

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const heading = document.createElement('h2');
  heading.id = 'modal-title';
  heading.textContent = props.title;
  header.appendChild(heading);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'modal-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', props.onClose);
  header.appendChild(closeButton);

  modal.appendChild(header);
  modal.appendChild(props.content);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) props.onClose();
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') props.onClose();
  });

  return overlay;
}
