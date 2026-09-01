import { getState } from '../store';
import { generateReviewItems } from '../services/reviewGenerator';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { router } from '../routes';
import { daysBetween, todayIso } from '../utils/date';

export function DashboardView(): HTMLElement {
  const state = getState();
  const reviewItems = generateReviewItems(state);
  const unknowns = [
    ...state.devices.filter(d => d.encrypted === 'unknown'),
    ...state.accounts.filter(a => a.mfa === 'unknown'),
    ...state.backups.filter(b => b.restored === 'unknown'),
  ].length;

  const container = document.createElement('div');
  container.className = 'dashboard';

  const heading = document.createElement('h1');
  heading.textContent = 'Tech Passport';
  container.appendChild(heading);

  const tagline = document.createElement('p');
  tagline.textContent = 'Know what you have. Know what matters. Know how to recover.';
  container.appendChild(tagline);

  const intro = document.createElement('p');
  intro.className = 'dashboard-intro';
  intro.textContent =
    'Tech Passport is a simple record of the technology your life depends on — your phone, computer, accounts, backups, and how to get back in if something goes wrong. It keeps pointers to your recovery options, like a password manager or a trusted person, but it never stores passwords, PINs, or keys.';
  container.appendChild(intro);

  const storageNotice = document.createElement('p');
  storageNotice.className = 'view-help';
  storageNotice.textContent =
    'Your data lives only in this browser profile. Another browser, a private window, or cleared site data will show a different Passport — or none at all. The MIT License covers the software; it does not grant permission to use the Tartanleaf name or logo to imply endorsement.';
  container.appendChild(storageNotice);

  const totalEntities =
    state.people.length +
    state.devices.length +
    state.accounts.length +
    state.backups.length +
    state.recoveryReferences.length;

  if (totalEntities === 0) {
    container.appendChild(startSmallCard());
  }

  container.appendChild(summaryCard(state));
  container.appendChild(attentionCard(reviewItems));
  if (unknowns > 0) container.appendChild(unknownCard(unknowns));
  container.appendChild(exportCard(state));

  return container;
}

function startSmallCard(): HTMLElement {
  return Card({
    title: 'Start small',
    subtitle:
      'You do not need to document everything today. Add one phone, one email account, and one recovery option to begin. Links come after that.',
    actions: [
      Button({ label: 'Add your phone', variant: 'primary', onClick: () => router.navigate('/devices/new') }),
      Button({ label: 'Add your email account', onClick: () => router.navigate('/accounts/new') }),
      Button({ label: 'Add a recovery option', onClick: () => router.navigate('/recovery/new') }),
    ],
  });
}

function summaryCard(state: ReturnType<typeof getState>): HTMLElement {
  return Card({
    title: 'What you have documented',
    subtitle: `${state.devices.length} devices, ${state.accounts.length} accounts, ${state.backups.length} backups, ${state.recoveryReferences.length} recovery references.`,
    actions: [
      Button({ label: 'Add device', variant: 'primary', onClick: () => router.navigate('/devices/new') }),
      Button({ label: 'Add account', onClick: () => router.navigate('/accounts/new') }),
    ],
  });
}

function attentionCard(items: ReturnType<typeof generateReviewItems>): HTMLElement {
  const due = items.filter(i => i.status === 'due' || i.status === 'overdue');
  return Card({
    title: 'What needs attention',
    subtitle: due.length ? `${due.length} item(s) need attention.` : 'Nothing needs attention right now.',
    actions: due.length ? [Button({ label: 'Review', onClick: () => router.navigate('/reviews') })] : [],
  });
}

function unknownCard(count: number): HTMLElement {
  return Card({
    title: 'What you are unsure about',
    subtitle: `${count} item(s) are marked "I'm not sure". That's useful information.`,
  });
}

function exportCard(state: ReturnType<typeof getState>): HTMLElement {
  const daysSinceExport = exportDaysSince(state.lastExportAt);
  const subtitle = daysSinceExport === null
    ? 'You have not exported your Passport yet. A backup protects you if this browser profile is lost.'
    : `Last exported: ${state.lastExportAt} (${formatAge(daysSinceExport)} ago).`;
  const actions: HTMLElement[] = [Button({ label: 'Export your Passport', variant: 'accent', onClick: () => router.navigate('/export') })];
  if (daysSinceExport === null || daysSinceExport > 30) {
    actions.unshift(Button({ label: 'Export reminder', variant: 'primary', onClick: () => router.navigate('/export') }));
  }
  return Card({
    title: 'Is your Passport backed up?',
    subtitle,
    actions,
  });
}

function exportDaysSince(lastExportAt: string): number | null {
  if (!lastExportAt) return null;
  const date = lastExportAt.slice(0, 10);
  if (!date) return null;
  const days = daysBetween(date, todayIso());
  if (days < 0) return null;
  return days;
}

function formatAge(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}
