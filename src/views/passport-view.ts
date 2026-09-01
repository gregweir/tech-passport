import { getState } from '../store';
import { buildPassportHtml } from '../services/export';
import { HELPER_VISIBILITY, EMERGENCY_VISIBILITY } from '../utils/exportFilter';
import { Button } from '../components/button';
import { Select } from '../components/select';
import { FormField } from '../components/form-field';

const MODES = [
  { value: 'helper', label: 'Helper copy' },
  { value: 'emergency', label: 'Emergency copy' },
];

export function PassportView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'passport-view';

  const heading = document.createElement('h1');
  heading.textContent = 'Human-readable Passport';
  container.appendChild(heading);

  const notice = document.createElement('p');
  notice.className = 'notice';
  notice.textContent = 'This view shows only the information you have marked as safe to share. Keep printed copies in a secure place.';
  container.appendChild(notice);

  let mode = 'helper';
  const iframe = document.createElement('iframe');
  iframe.className = 'passport-preview';
  iframe.title = 'Passport preview';
  iframe.setAttribute('sandbox', 'allow-same-origin');

  function refresh() {
    const allowed = mode === 'emergency' ? EMERGENCY_VISIBILITY : HELPER_VISIBILITY;
    const title = mode === 'emergency' ? 'Emergency Passport' : 'Tech Passport — Helper copy';
    const html = buildPassportHtml(getState(), {
      title,
      subtitle: mode === 'emergency' ? 'Essential information only' : 'Helper-safe information',
      sensitivityNotice: 'This copy may contain sensitive information. Share it only with people you trust.',
      allowed,
    });
    iframe.srcdoc = html;
  }

  const modeSelect = Select({
    id: 'passport-mode',
    options: MODES,
    value: mode,
    onChange: (value) => {
      mode = value;
      refresh();
    },
  });
  container.appendChild(FormField({ id: 'passport-mode', label: 'Passport copy', input: modeSelect }));

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.appendChild(Button({
    label: 'Print',
    variant: 'primary',
    onClick: () => {
      const win = iframe.contentWindow;
      if (win) win.print();
    },
  }));
  container.appendChild(actions);

  container.appendChild(iframe);
  refresh();

  return container;
}
