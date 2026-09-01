import { getSaveStatus, getLastSaveError, subscribe } from '../store';

export function SaveStatus(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'save-status';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  function render() {
    const status = getSaveStatus();
    const error = getLastSaveError();

    el.className = 'save-status';
    if (status === 'saving') {
      el.classList.add('save-status-saving');
      el.textContent = 'Saving…';
    } else if (status === 'saved') {
      el.classList.add('save-status-saved');
      el.textContent = 'Saved';
    } else if (status === 'error') {
      el.classList.add('save-status-error');
      el.textContent = error ? `Save failed: ${error}` : 'Save failed.';
    } else {
      el.textContent = ' ';
    }
  }

  render();
  const unsubscribe = subscribe(render);
  el.addEventListener('removeFromDom', unsubscribe);
  return el;
}
