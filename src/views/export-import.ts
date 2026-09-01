import { getState, setLastExportAt, importBackup } from '../store';
import { buildFullExport, buildPassportHtml } from '../services/export';
import { parseImport } from '../services/import';
import { MAX_FILE_BYTES } from '../utils/validateBackup';
import { HELPER_VISIBILITY, EMERGENCY_VISIBILITY } from '../utils/exportFilter';
import { filterByVisibility } from '../utils/exportFilter';
import { Button } from '../components/button';
import { FormField } from '../components/form-field';
import { Card } from '../components/card';

const SENSITIVITY_NOTICE =
  'Exports may contain sensitive personal information. Store them securely and share only with people you trust.';

export function ExportImportView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'export-import';

  const heading = document.createElement('h1');
  heading.textContent = 'Export and import';
  container.appendChild(heading);

  const notice = document.createElement('p');
  notice.className = 'sensitivity-notice';
  notice.textContent = SENSITIVITY_NOTICE;
  container.appendChild(notice);

  const trust = document.createElement('p');
  trust.className = 'view-help';
  trust.textContent =
    'Your data never leaves this device unless you save an export yourself. When you download a JSON backup or a Passport HTML file, that file is under your control: store it somewhere safe, share it only with people you trust, and keep in mind that Tech Passport does not store actual passwords or keys.';
  container.appendChild(trust);

  const state = getState();

  const exportStatus = document.createElement('p');
  exportStatus.textContent = state.lastExportAt
    ? `Last exported: ${state.lastExportAt}`
    : 'Last exported: never';
  container.appendChild(exportStatus);

  const exportSection = document.createElement('section');
  exportSection.setAttribute('aria-labelledby', 'export-heading');

  const exportHeading = document.createElement('h2');
  exportHeading.id = 'export-heading';
  exportHeading.textContent = 'Export';
  exportSection.appendChild(exportHeading);

  const exportActions = document.createElement('div');
  exportActions.className = 'export-actions';

  exportActions.appendChild(
    Button({
      label: 'Full JSON backup',
      variant: 'primary',
      onClick: () => {
        const backup = buildFullExport(getState());
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        downloadFile(
          JSON.stringify(backup, null, 2),
          `tech-passport-backup-${timestamp}.json`,
          'application/json',
        );
        setLastExportAt(new Date().toISOString());
      },
    }),
  );

  exportActions.appendChild(
    Button({
      label: 'Helper copy',
      onClick: () => {
        downloadHtmlPassport('Helper copy', HELPER_VISIBILITY, 'helper-passport');
      },
    }),
  );

  exportActions.appendChild(
    Button({
      label: 'Emergency copy',
      onClick: () => {
        downloadHtmlPassport('Emergency copy', EMERGENCY_VISIBILITY, 'emergency-passport');
      },
    }),
  );

  exportActions.appendChild(
    Button({
      label: 'Passport HTML',
      onClick: () => {
        downloadHtmlPassport('Passport HTML', HELPER_VISIBILITY, 'passport');
      },
    }),
  );

  exportSection.appendChild(exportActions);

  exportSection.appendChild(buildExportPreview(state));

  const jsonHelp = document.createElement('p');
  jsonHelp.className = 'view-help';
  jsonHelp.textContent =
    'The full JSON backup is a complete, machine-readable copy of your Passport. Save it somewhere safe (such as an encrypted drive or a cloud folder only you can access) and you can import it back into Tech Passport later if you switch browsers or lose your device.';
  exportSection.appendChild(jsonHelp);

  container.appendChild(exportSection);

  const importSection = document.createElement('section');
  importSection.setAttribute('aria-labelledby', 'import-heading');

  const importHeading = document.createElement('h2');
  importHeading.id = 'import-heading';
  importHeading.textContent = 'Import';
  importSection.appendChild(importHeading);

  const importNotice = document.createElement('p');
  importNotice.textContent = 'Importing a backup will replace all current Passport data.';
  importSection.appendChild(importNotice);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'import-file';
  fileInput.accept = '.json,application/json';

  const errorMessage = document.createElement('p');
  errorMessage.className = 'import-error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.setAttribute('aria-live', 'polite');

  fileInput.addEventListener('change', () => {
    errorMessage.textContent = '';
    const file = fileInput.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      errorMessage.textContent = `Backup file is too large (max ${MAX_FILE_BYTES} bytes).`;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImport(String(reader.result));
      if (!result.success) {
        errorMessage.textContent = result.error ?? 'Import failed.';
        return;
      }
      const confirmed = window.confirm(
        'This will overwrite your existing Passport data. Are you sure?',
      );
      if (confirmed && result.data) {
        importBackup(result.data);
        fileInput.value = '';
      }
    };
    reader.onerror = () => {
      errorMessage.textContent = 'Could not read the selected file.';
    };
    reader.readAsText(file);
  });

  importSection.appendChild(
    FormField({
      id: 'import-file',
      label: 'Import from JSON backup',
      helpText: 'Choose a .json backup file exported from Tech Passport.',
      input: fileInput,
    }),
  );
  importSection.appendChild(errorMessage);
  container.appendChild(importSection);

  return container;
}

function buildExportPreview(state: ReturnType<typeof getState>): HTMLElement {
  const section = document.createElement('div');
  section.className = 'export-preview';

  const heading = document.createElement('h3');
  heading.textContent = 'What each export includes';
  section.appendChild(heading);

  const entityLists: Array<{ visibility: import('../types').Visibility }>[] = [
    state.people,
    state.devices,
    state.accounts,
    state.backups,
    state.recoveryReferences,
  ];

  const fullCount = entityLists.reduce((sum, list) => sum + list.length, 0);
  const helperCount = entityLists.reduce(
    (sum, list) => sum + filterByVisibility(list, HELPER_VISIBILITY).length,
    0,
  );
  const emergencyCount = entityLists.reduce(
    (sum, list) => sum + filterByVisibility(list, EMERGENCY_VISIBILITY).length,
    0,
  );

  const privateCount = fullCount - helperCount;

  const helperCard = Card({
    title: 'Helper copy',
    subtitle: `${helperCount} of ${fullCount} items included. ${privateCount} private or backup-only item${privateCount === 1 ? '' : 's'} left out.`,
  });

  const emergencyCard = Card({
    title: 'Emergency copy',
    subtitle: `${emergencyCount} of ${fullCount} items included. This is the smallest shareable version, meant for crisis situations.`,
  });

  const jsonCard = Card({
    title: 'Full JSON backup',
    subtitle: `${fullCount} items included. This is the complete, importable copy, including private and backup-only records.`,
  });

  section.appendChild(jsonCard);
  section.appendChild(helperCard);
  section.appendChild(emergencyCard);

  if (privateCount > 0) {
    const note = document.createElement('p');
    note.className = 'view-help';
    note.textContent =
      'Items marked Private or Backup only are intentionally absent from helper and emergency copies. Links and review items that depend on those excluded items are also left out so the exported file does not leak private context.';
    section.appendChild(note);
  }

  return section;
}

function downloadHtmlPassport(
  title: string,
  allowed: typeof HELPER_VISIBILITY,
  filenamePrefix: string,
): void {
  const html = buildPassportHtml(getState(), {
    title,
    subtitle: 'A human-readable summary of the technology that matters.',
    sensitivityNotice: SENSITIVITY_NOTICE,
    allowed,
  });
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(html, `${filenamePrefix}-${timestamp}.html`, 'text/html');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
