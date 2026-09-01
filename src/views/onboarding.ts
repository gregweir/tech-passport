import { getState, setOnboardingComplete, addDevice, addBackup, setLastExportAt } from '../store';
import { buildFullExport } from '../services/export';
import { Button } from '../components/button';
import { Select } from '../components/select';
import { FormField } from '../components/form-field';
import { router } from '../routes';

const PRIORITIES = [
  { value: 'phone', label: 'My phone' },
  { value: 'computer', label: 'My computer' },
  { value: 'files', label: 'My photos or files' },
  { value: 'internet', label: 'My Internet connection' },
  { value: 'accounts', label: 'My passwords and accounts' },
  { value: 'smart-home', label: 'My smart home' },
  { value: 'backups', label: 'My backups' },
  { value: 'other', label: 'Something else' },
];

const OS_OPTIONS = [
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'Mac' },
  { value: 'linux', label: 'Linux' },
  { value: 'chromebook', label: 'Chromebook' },
  { value: 'unknown', label: 'I\'m not sure' },
];

const BACKUP_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'I\'m not sure' },
];

export function OnboardingView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'onboarding';

  let step = 0;
  let priority = '';
  let deviceType = '';
  let deviceLabel = '';
  let backedUp = '';
  let backupDestination = '';

  function clearContainer(): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function advance(): void {
    step += 1;
    render();
  }

  function render(): void {
    clearContainer();
    if (step === 0) {
      container.appendChild(stepIntro());
    } else if (step === 1) {
      container.appendChild(stepPriority());
    } else if (step === 2) {
      container.appendChild(stepDeviceType());
    } else if (step === 3) {
      container.appendChild(stepDeviceName());
    } else if (step === 4) {
      container.appendChild(stepBackup());
    } else if (step === 5) {
      container.appendChild(stepStorageWarning());
    } else if (step === 6) {
      container.appendChild(stepFinish());
    }
  }

  function stepIntro(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'Welcome to Tech Passport';
    el.appendChild(heading);

    const paragraph = document.createElement('p');
    paragraph.textContent = 'We will document the technology that matters most, one step at a time.';
    el.appendChild(paragraph);

    const storage = document.createElement('p');
    storage.className = 'view-help';
    storage.textContent = 'Your data stays only in this browser. It is not synced to the cloud or stored on a server. You will be able to download a backup file at the end.';
    el.appendChild(storage);

    el.appendChild(Button({ label: 'Start', variant: 'accent', onClick: advance }));
    return el;
  }

  function stepPriority(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'What would be hardest to lose or replace?';
    el.appendChild(heading);

    const select = Select({
      id: 'priority',
      options: PRIORITIES,
      includeEmpty: true,
      emptyLabel: '— I\'m not sure —',
      value: priority,
      onChange: (value) => {
        priority = value;
      },
    });
    el.appendChild(FormField({ id: 'priority', label: 'Choose one', input: select }));
    el.appendChild(Button({ label: 'Continue', variant: 'primary', onClick: advance }));
    return el;
  }

  function stepDeviceType(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'Let\'s start with your main computer.';
    el.appendChild(heading);

    const paragraph = document.createElement('p');
    paragraph.textContent = 'What kind is it?';
    el.appendChild(paragraph);

    const select = Select({
      id: 'os',
      options: OS_OPTIONS,
      includeEmpty: true,
      value: deviceType,
      onChange: (value) => {
        deviceType = value;
      },
    });
    el.appendChild(FormField({ id: 'os', label: 'Operating system', input: select }));
    el.appendChild(Button({ label: 'Continue', variant: 'primary', onClick: advance }));
    return el;
  }

  function stepDeviceName(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'What do you call this computer?';
    el.appendChild(heading);

    const input = document.createElement('input');
    input.id = 'device-label';
    input.placeholder = 'e.g., My MacBook Air';
    input.value = deviceLabel;
    input.addEventListener('input', () => {
      deviceLabel = input.value;
    });

    el.appendChild(FormField({ id: 'device-label', label: 'Name', input }));
    el.appendChild(Button({ label: 'Continue', variant: 'primary', onClick: advance }));
    return el;
  }

  function stepBackup(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'Are important files from this computer backed up?';
    el.appendChild(heading);

    const select = Select({
      id: 'backed-up',
      options: BACKUP_OPTIONS,
      value: backedUp,
      onChange: (value) => {
        backedUp = value;
        render();
      },
    });
    el.appendChild(FormField({ id: 'backed-up', label: 'Backup status', input: select }));

    if (backedUp === 'yes') {
      const input = document.createElement('input');
      input.id = 'backup-destination';
      input.placeholder = 'e.g., External drive + iCloud';
      input.value = backupDestination;
      input.addEventListener('input', () => {
        backupDestination = input.value;
      });
      el.appendChild(FormField({ id: 'backup-destination', label: 'Where is the backup?', input }));
    }

    el.appendChild(Button({ label: 'Continue', variant: 'primary', onClick: advance }));
    return el;
  }

  function stepStorageWarning(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'Before you finish';
    el.appendChild(heading);

    const paragraph = document.createElement('p');
    paragraph.textContent =
      'Tech Passport stores your data only in this browser profile. If you clear site data, switch browsers, or use a private window, your Passport will not appear here. We recommend downloading a JSON backup now and keeping it somewhere safe.';
    el.appendChild(paragraph);

    el.appendChild(Button({
      label: 'Download a backup now',
      variant: 'accent',
      onClick: () => {
        downloadBackup();
        advance();
      },
    }));

    el.appendChild(Button({
      label: 'Skip for now',
      variant: 'secondary',
      onClick: advance,
    }));

    return el;
  }

  function stepFinish(): HTMLElement {
    const el = document.createElement('div');

    const heading = document.createElement('h1');
    heading.textContent = 'You are ready';
    el.appendChild(heading);

    const paragraph = document.createElement('p');
    paragraph.textContent = 'We will save your first device and backup.';
    el.appendChild(paragraph);

    el.appendChild(Button({
      label: 'Finish',
      variant: 'primary',
      onClick: () => {
        const meId = getState().people[0]?.id ?? 'person-me';
        const device = addDevice({
          label: deviceLabel.trim() || 'Main computer',
          role: 'Main computer',
          category: 'computer',
          ownerIds: [meId],
          os: deviceType,
        });

        if (backedUp === 'yes' && backupDestination.trim()) {
          addBackup({
            label: `${device.label} backup`,
            destination: backupDestination.trim(),
            coversIds: [device.id],
            copies: 'unknown',
            restored: 'unknown',
          });
        }

        setOnboardingComplete(true);
        router.navigate('/');
      },
    }));
    return el;
  }

  function downloadBackup(): void {
    const backup = buildFullExport(getState());
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tech-passport-backup-${timestamp}.json`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setLastExportAt(new Date().toISOString());
  }

  render();
  return container;
}
