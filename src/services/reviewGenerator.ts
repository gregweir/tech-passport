import { todayIso, daysBetween, addDays } from '../utils/date';
import { EXPORT_REMINDER_TITLE } from '../constants';
import type { AppState, ReviewItem } from '../types';

export function generateReviewItems(state: AppState): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const backup of state.backups) {
    if (!backup.lastCheckedDate) {
      items.push(makeItem(`Check backup: ${backup.label}`, 30, backup.id));
    } else if (daysBetween(backup.lastCheckedDate, todayIso()) > 30) {
      items.push(makeItem(`Backup not checked recently: ${backup.label}`, 30, backup.id));
    }
    if (backup.restored === 'no' || backup.restored === 'unknown') {
      items.push(makeItem(`Test restore for: ${backup.label}`, 90, backup.id));
    }
  }

  for (const device of state.devices) {
    if (device.recoveryReferenceIds.length === 0) {
      items.push(makeItem(`Add recovery reference for: ${device.label}`, 30, device.id));
    }
  }

  for (const account of state.accounts) {
    if (account.recoveryReferenceIds.length === 0) {
      items.push(makeItem(`Add recovery reference for: ${account.label}`, 30, account.id));
    }
    if (account.mfa === 'unknown') {
      items.push(makeItem(`Confirm MFA status for: ${account.label}`, 60, account.id));
    }
  }

  if (!state.lastExportAt || daysBetween(state.lastExportAt, todayIso()) > 30) {
    items.push(makeItem(EXPORT_REMINDER_TITLE, 30));
  }

  return mergeWithExisting(state.reviewItems, items);
}

export function findAttentionItems(state: AppState): ReviewItem[] {
  return generateReviewItems(state).filter(
    item => item.status === 'due' || item.status === 'overdue'
  );
}

function makeItem(title: string, recurrenceDays: number, linkedId?: string): ReviewItem {
  const id = `review-${linkedId ?? title}`;
  const nextReviewDate = addDays(todayIso(), recurrenceDays);
  return {
    id,
    title,
    recurrenceDays,
    lastReviewedDate: '',
    nextReviewDate,
    status: 'due',
    notes: '',
    linkedEntityIds: linkedId ? [linkedId] : [],
    source: 'app',
  };
}

function mergeWithExisting(existing: ReviewItem[], generated: ReviewItem[]): ReviewItem[] {
  const map = new Map(existing.map(i => [i.id, i]));
  for (const item of generated) {
    const current = map.get(item.id);
    if (!current || current.status === 'ok') {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
