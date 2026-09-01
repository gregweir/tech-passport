import { filterByVisibility, FULL_VISIBILITY, HELPER_VISIBILITY, EMERGENCY_VISIBILITY } from '../utils/exportFilter';
import { todayIso, daysBetween } from '../utils/date';
import type { AppState, AppBackup, Device, Account, Backup, RecoveryReference, Dependency, Person, ReviewItem } from '../types';

export function buildFullExport(state: AppState): AppBackup {
  return {
    schemaVersion: state.schemaVersion,
    exportedAt: new Date().toISOString(),
    people: state.people,
    devices: state.devices,
    accounts: state.accounts,
    backups: state.backups,
    recoveryReferences: state.recoveryReferences,
    dependencies: state.dependencies,
    reviewItems: state.reviewItems,
    onboardingComplete: state.onboardingComplete,
    lastExportAt: state.lastExportAt,
  };
}

export function buildHelperExport(state: AppState): AppBackup {
  return buildFilteredExport(state, HELPER_VISIBILITY);
}

export function buildEmergencyExport(state: AppState): AppBackup {
  return buildFilteredExport(state, EMERGENCY_VISIBILITY);
}

function buildFilteredExport(state: AppState, allowed: typeof FULL_VISIBILITY): AppBackup {
  const people = filterByVisibility(state.people, allowed);
  const allowedPersonIds = new Set(people.map(p => p.id));

  const recoveryReferences = filterByVisibility(state.recoveryReferences, allowed);
  const allowedRecoveryReferenceIds = new Set(recoveryReferences.map(r => r.id));

  const devices = filterByVisibility(state.devices, allowed)
    .map(d => filterDeviceReferences(d, allowedPersonIds, allowedRecoveryReferenceIds));
  const allowedDeviceIds = new Set(devices.map(d => d.id));

  const accounts = filterByVisibility(state.accounts, allowed)
    .map(a => filterAccountReferences(a, allowedPersonIds, allowedRecoveryReferenceIds));
  const allowedAccountIds = new Set(accounts.map(a => a.id));

  const backups = filterByVisibility(state.backups, allowed)
    .map(b => filterBackupReferences(b, allowedPersonIds, allowedRecoveryReferenceIds, allowedDeviceIds, allowedAccountIds));

  const allowedEntityIds = new Set([
    ...people.map(p => p.id),
    ...devices.map(d => d.id),
    ...accounts.map(a => a.id),
    ...backups.map(b => b.id),
    ...recoveryReferences.map(r => r.id),
  ]);

  const dependencies = state.dependencies.filter(
    d => allowedEntityIds.has(d.sourceId) && allowedEntityIds.has(d.targetId)
  );

  const reviewItems = state.reviewItems.filter(r => {
    if (r.linkedEntityIds.length > 0) {
      return r.linkedEntityIds.every(id => allowedEntityIds.has(id));
    }
    // Unlinked review items are shared only when they are app-generated global reminders.
    return r.source === 'app';
  });

  return {
    schemaVersion: state.schemaVersion,
    exportedAt: new Date().toISOString(),
    people,
    devices,
    accounts,
    backups,
    recoveryReferences,
    dependencies,
    reviewItems,
    onboardingComplete: state.onboardingComplete,
    lastExportAt: state.lastExportAt,
  };
}

function filterDeviceReferences(
  device: Device,
  allowedPersonIds: Set<string>,
  allowedRecoveryReferenceIds: Set<string>,
): Device {
  return {
    ...device,
    ownerIds: device.ownerIds.filter(id => allowedPersonIds.has(id)),
    recoveryReferenceIds: device.recoveryReferenceIds.filter(id => allowedRecoveryReferenceIds.has(id)),
  };
}

function filterAccountReferences(
  account: Account,
  allowedPersonIds: Set<string>,
  allowedRecoveryReferenceIds: Set<string>,
): Account {
  return {
    ...account,
    personIds: account.personIds.filter(id => allowedPersonIds.has(id)),
    recoveryReferenceIds: account.recoveryReferenceIds.filter(id => allowedRecoveryReferenceIds.has(id)),
  };
}

function filterBackupReferences(
  backup: Backup,
  allowedPersonIds: Set<string>,
  allowedRecoveryReferenceIds: Set<string>,
  allowedDeviceIds: Set<string>,
  allowedAccountIds: Set<string>,
): Backup {
  const allowedCoveredIds = new Set([...allowedDeviceIds, ...allowedAccountIds]);
  return {
    ...backup,
    recoveryReferenceIds: backup.recoveryReferenceIds.filter(id => allowedRecoveryReferenceIds.has(id)),
    canRestorePersonIds: backup.canRestorePersonIds.filter(id => allowedPersonIds.has(id)),
    coversIds: backup.coversIds.filter(id => allowedCoveredIds.has(id)),
  };
}

export interface PassportHtmlOptions {
  title: string;
  subtitle: string;
  sensitivityNotice: string;
  allowed: typeof FULL_VISIBILITY;
}

interface IndexedEntity {
  byId: Map<string, Person | Device | Account | Backup | RecoveryReference>;
  people: Person[];
  devices: Device[];
  accounts: Account[];
  backups: Backup[];
  recoveryReferences: RecoveryReference[];
  dependencies: Dependency[];
  reviewItems: ReviewItem[];
}

interface LabelledEntity {
  id: string;
  label: string;
}

function indexEntities(backup: AppBackup): IndexedEntity {
  const byId = new Map<string, Person | Device | Account | Backup | RecoveryReference>();
  for (const p of backup.people) byId.set(p.id, p);
  for (const d of backup.devices) byId.set(d.id, d);
  for (const a of backup.accounts) byId.set(a.id, a);
  for (const b of backup.backups) byId.set(b.id, b);
  for (const r of backup.recoveryReferences) byId.set(r.id, r);
  return {
    byId,
    people: backup.people,
    devices: backup.devices,
    accounts: backup.accounts,
    backups: backup.backups,
    recoveryReferences: backup.recoveryReferences,
    dependencies: backup.dependencies,
    reviewItems: backup.reviewItems,
  };
}

function entityLabel(byId: IndexedEntity['byId'], id: string): string {
  const e = byId.get(id) as LabelledEntity | Person | undefined;
  if (!e) return 'Unknown';
  if ('label' in e) return e.label;
  if ('name' in e) return e.name;
  return 'Unknown';
}

function personName(byId: IndexedEntity['byId'], id: string): string {
  const p = byId.get(id) as Person | undefined;
  return p?.name ?? 'Unknown';
}

function recoveryRefLabel(byId: IndexedEntity['byId'], id: string): string {
  const r = byId.get(id) as RecoveryReference | undefined;
  return r?.label ?? 'Unknown reference';
}

export function buildPassportHtml(state: AppState, options: PassportHtmlOptions): string {
  const filtered = buildFilteredExport(state, options.allowed);
  const ix = indexEntities(filtered);

  const css = `
    body{font-family:system-ui,sans-serif;line-height:1.5;max-width:55rem;margin:2rem auto;padding:0 1rem;background:#f4efe5;color:#173847;}
    h1{border-bottom:3px solid #173847;}h2{margin-top:1.75rem;border-bottom:1px solid #eae3d7;padding-bottom:.25rem;}
    .lead{font-size:1.1rem;margin-bottom:1.5rem;}
    .notice{background:#eae3d7;padding:.75rem 1rem;border-radius:.5rem;margin:1rem 0;}
    .priority{background:#f58a6a;color:#173847;padding:.75rem 1rem;border-radius:.5rem;margin:1rem 0;}
    .priority h2{margin:0;border:none;padding:0;font-size:1.1rem;}
    .priority ol{margin:.5rem 0 0 1.25rem;padding:0;}
    table{width:100%;border-collapse:collapse;margin:.75rem 0;}
    th,td{text-align:left;padding:.4rem .6rem;vertical-align:top;border-bottom:1px solid #eae3d7;}
    th{width:35%;font-weight:600;}
    ul{margin:.25rem 0;padding-left:1.25rem;}
    li{margin:.25rem 0;}
    .missing{color:#c45a33;font-style:italic;}
    .meta{color:#5e7a82;font-size:.9rem;}
    section{margin:1.5rem 0;}
    @media print{body{margin:0;background:#fff;}.priority{background:#f58a6a !important;-webkit-print-color-adjust:exact;}}
  `;

  const csp = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';";

  const lines = [
    '<!doctype html>',
    '<html lang="en"><head>',
    `<meta charset="UTF-8"><title>${escapeHtml(options.title)}</title>`,
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    `<style>${css}</style>`,
    '</head><body>',
    `<h1>${escapeHtml(options.title)}</h1>`,
    `<p class="lead"><strong>${escapeHtml(options.subtitle)}</strong></p>`,
    `<p class="notice">${escapeHtml(options.sensitivityNotice)}</p>`,
    '<p class="meta">Keep printed copies in a secure place. Do not leave this document where it can be read by people you do not trust.</p>',
  ];

  lines.push(buildPrioritySection(ix));
  lines.push(buildPeopleSection(ix));
  lines.push(buildDevicesSection(ix));
  lines.push(buildAccountsSection(ix));
  lines.push(buildBackupsSection(ix));
  lines.push(buildRecoveryReferencesSection(ix));
  lines.push(buildDependenciesSection(ix));
  lines.push(buildReviewSection(ix));
  lines.push(buildAbsentSection(state, options.allowed));

  lines.push(`<p class="meta"><em>Exported from Tech Passport on ${todayIso()}</em></p>`);
  lines.push('</body></html>');
  return lines.join('\n');
}

function buildPrioritySection(ix: IndexedEntity): string {
  const actions: string[] = [];
  const backupsOverdue = ix.backups.filter(b => b.lastCheckedDate && daysBetween(b.lastCheckedDate, todayIso()) > 90);
  const restoreUntested = ix.backups.filter(b => !b.restoreTestedDate);
  const noBackups = ix.devices.filter(d => !ix.backups.some(b => b.coversIds.includes(d.id)));

  if (noBackups.length) {
    actions.push(`Back up these devices: ${listLabels(noBackups)}.`);
  }
  if (backupsOverdue.length) {
    actions.push(`Check these backups: ${listLabels(backupsOverdue)}.`);
  }
  if (restoreUntested.length) {
    actions.push(`Test restoring from these backups: ${listLabels(restoreUntested)}.`);
  }

  const dueReviews = ix.reviewItems.filter(r => r.status === 'due' || r.status === 'overdue');
  if (dueReviews.length) {
    actions.push(`Review: ${dueReviews.map(r => r.title).join(', ')}.`);
  }

  if (!actions.length) return '';

  return `<div class="priority"><h2>What to do first</h2><ol>${actions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ol></div>`;
}

function buildPeopleSection(ix: IndexedEntity): string {
  if (!ix.people.length) return '';
  return `<section><h2>People</h2><ul>${ix.people.map(p =>
    `<li><strong>${escapeHtml(p.name)}</strong>${p.role !== 'other' ? ` (${escapeHtml(p.role)})` : ''}${p.notes ? ` — ${escapeHtml(p.notes)}` : ''}</li>`
  ).join('')}</ul></section>`;
}

function buildDevicesSection(ix: IndexedEntity): string {
  if (!ix.devices.length) return '';
  let html = '<section><h2>Devices</h2>';
  for (const d of ix.devices) {
    html += '<table>';
    html += textRow('Label', d.label);
    html += textRow('Role', d.role);
    if (d.category) html += textRow('Type', d.category);
    if (d.model) html += textRow('Model', d.model);
    if (d.os) html += textRow('Operating system', d.os);
    if (d.location) html += textRow('Location', d.location);
    if (d.ownerIds.length) html += textRow('Owner(s)', d.ownerIds.map(id => personName(ix.byId, id)).join(', '));
    if (d.encrypted !== 'unknown') html += textRow('Encrypted?', d.encrypted === 'yes' ? 'Yes' : 'No');
    if (d.recoveryReferenceIds.length) {
      html += textRow('Recovery info', d.recoveryReferenceIds.map(id => recoveryRefLabel(ix.byId, id)).join(', '));
    }
    if (d.notes) html += textRow('Notes', d.notes);
    const coveredBy = ix.backups.filter(b => b.coversIds.includes(d.id));
    html += htmlRow('Backed up by', coveredBy.length ? coveredBy.map(b => escapeHtml(b.label)).join(', ') : '<span class="missing">No backup recorded</span>');
    html += '</table>';
  }
  html += '</section>';
  return html;
}

function buildAccountsSection(ix: IndexedEntity): string {
  if (!ix.accounts.length) return '';
  let html = '<section><h2>Accounts and services</h2>';
  for (const a of ix.accounts) {
    html += '<table>';
    html += textRow('Label', a.label);
    if (a.provider) html += textRow('Provider', a.provider);
    if (a.purpose) html += textRow('Purpose', a.purpose);
    if (a.personIds.length) html += textRow('Used by', a.personIds.map(id => personName(ix.byId, id)).join(', '));
    if (a.mfa !== 'unknown') html += textRow('MFA?', a.mfa === 'yes' ? 'Yes' : 'No');
    if (a.recoveryReferenceIds.length) {
      html += textRow('Recovery info', a.recoveryReferenceIds.map(id => recoveryRefLabel(ix.byId, id)).join(', '));
    }
    if (a.notes) html += textRow('Notes', a.notes);
    html += '</table>';
  }
  html += '</section>';
  return html;
}

function buildBackupsSection(ix: IndexedEntity): string {
  if (!ix.backups.length) return '';
  let html = '<section><h2>Backups</h2>';
  for (const b of ix.backups) {
    html += '<table>';
    html += textRow('Label', b.label);
    html += htmlRow('Destination', b.destination ? escapeHtml(b.destination) : '<span class="missing">Not recorded</span>');
    html += textRow('Copies', b.copies);
    if (b.lastCheckedDate) html += textRow('Last checked', `${b.lastCheckedDate} (${daysBetween(b.lastCheckedDate, todayIso())} days ago)`);
    if (b.restoreTestedDate) html += textRow('Restore tested', `${b.restoreTestedDate} (${daysBetween(b.restoreTestedDate, todayIso())} days ago)`);
    else html += htmlRow('Restore tested', '<span class="missing">Not tested</span>');
    if (b.canRestorePersonIds.length) html += textRow('Can be restored by', b.canRestorePersonIds.map(id => personName(ix.byId, id)).join(', '));
    if (b.recoveryReferenceIds.length) html += textRow('Recovery references', b.recoveryReferenceIds.map(id => recoveryRefLabel(ix.byId, id)).join(', '));
    if (b.coversIds.length) html += textRow('Covers', b.coversIds.map(id => entityLabel(ix.byId, id)).join(', '));
    if (b.notes) html += textRow('Notes', b.notes);
    html += '</table>';
  }
  html += '</section>';
  return html;
}

function buildRecoveryReferencesSection(ix: IndexedEntity): string {
  if (!ix.recoveryReferences.length) return '';
  let html = '<section><h2>Recovery references</h2>';
  for (const r of ix.recoveryReferences) {
    html += '<table>';
    html += textRow('Label', r.label);
    html += textRow('Kind', r.kind);
    html += htmlRow('Location', r.location ? escapeHtml(r.location) : '<span class="missing">Not recorded</span>');
    if (r.contactInfo) html += textRow('Contact', r.contactInfo);
    if (r.notes) html += textRow('Notes', r.notes);
    html += '</table>';
  }
  html += '</section>';
  return html;
}

function buildDependenciesSection(ix: IndexedEntity): string {
  if (!ix.dependencies.length) return '';
  const kindLabel: Record<string, string> = {
    requires: 'requires',
    'authenticates-with': 'authenticates with',
    'backed-up-to': 'backed up to',
    other: 'relates to',
  };
  return `<section><h2>What relies on what</h2><ul>${ix.dependencies.map(d => {
    const source = entityLabel(ix.byId, d.sourceId);
    const target = entityLabel(ix.byId, d.targetId);
    return `<li><strong>${escapeHtml(source)}</strong> ${kindLabel[d.kind] ?? d.kind} <strong>${escapeHtml(target)}</strong>${d.notes ? ` — ${escapeHtml(d.notes)}` : ''}</li>`;
  }).join('')}</ul></section>`;
}

function buildReviewSection(ix: IndexedEntity): string {
  if (!ix.reviewItems.length) return '';
  const open = ix.reviewItems.filter(r => r.status !== 'ok');
  if (!open.length) return '';
  return `<section><h2>Scheduled checks</h2><ul>${open.map(r => {
    const linked = r.linkedEntityIds.map(id => entityLabel(ix.byId, id)).join(', ');
    return `<li><strong>${escapeHtml(r.title)}</strong>${linked ? ` (${escapeHtml(linked)})` : ''}${r.notes ? ` — ${escapeHtml(r.notes)}` : ''}</li>`;
  }).join('')}</ul></section>`;
}

function buildAbsentSection(state: AppState, allowed: typeof FULL_VISIBILITY): string {
  const absent: string[] = [];
  const totalDevices = state.devices.length;
  const totalAccounts = state.accounts.length;
  const totalBackups = state.backups.length;
  const totalPeople = state.people.length;

  const excluded = [
    ...state.devices.filter(d => !allowed.includes(d.visibility)),
    ...state.accounts.filter(a => !allowed.includes(a.visibility)),
    ...state.backups.filter(b => !allowed.includes(b.visibility)),
    ...state.recoveryReferences.filter(r => !allowed.includes(r.visibility)),
    ...state.people.filter(p => !allowed.includes(p.visibility)),
  ];

  if (totalPeople <= 1) absent.push('Only the default owner is recorded.');
  if (totalDevices === 0) absent.push('No devices are recorded.');
  if (totalAccounts === 0) absent.push('No accounts are recorded.');
  if (totalBackups === 0) absent.push('No backups are recorded.');

  if (excluded.length) {
    const byType: Record<string, number> = {};
    for (const e of excluded) {
      const type = 'model' in e ? 'device' : 'provider' in e ? 'account' : 'destination' in e ? 'backup' : 'kind' in e ? 'recovery reference' : 'person';
      byType[type] = (byType[type] ?? 0) + 1;
    }
    const summary = Object.entries(byType).map(([type, count]) => `${count} ${type}${count === 1 ? '' : 's'}`).join(', ');
    absent.push(`This copy intentionally omits ${summary} marked as not safe to share (${excluded.length} total).`);
  }

  if (!absent.length) return '';
  return `<section><h2>What this copy does not include</h2><ul>${absent.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul></section>`;
}

/** Render a key/value row where both label and value are plain text (escaped). */
function textRow(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

/** Render a key/value row where the value is trusted app-generated markup. */
function htmlRow(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`;
}

function listLabels(items: { label: string }[]): string {
  return items.map(i => i.label).join(', ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
