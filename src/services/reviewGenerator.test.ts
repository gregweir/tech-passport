import { describe, it, expect } from 'vitest';
import { generateReviewItems, findAttentionItems } from './reviewGenerator';
import { DEFAULT_ME } from '../constants';
import { todayIso, addDays } from '../utils/date';
import type { AppState, Device, Account, ReviewItem } from '../types';

const base: AppState = {
  schemaVersion: 1,
  people: [DEFAULT_ME],
  devices: [], accounts: [], backups: [],
  recoveryReferences: [], dependencies: [], reviewItems: [],
  onboardingComplete: true, lastExportAt: '',
};

describe('reviewGenerator', () => {
  it('flags a backup that has never been checked', () => {
    const device: Device = {
      id: 'd1', label: 'MacBook', role: 'Main computer', category: 'computer',
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '',
    };
    const state: AppState = {
      ...base,
      devices: [device],
      backups: [{
        id: 'b1', label: 'MacBook backup', destination: 'External drive',
        recoveryReferenceIds: [], coversIds: ['d1'], copies: 'one',
        lastCheckedDate: '', restoreTestedDate: '', restored: 'unknown',
        canRestorePersonIds: [], notes: '', visibility: 'private', reviewDate: '',
      }],
    };
    const items = generateReviewItems(state);
    const titles = items.map(i => i.title);
    expect(titles.some(t => t.includes('backup'))).toBe(true);
  });

  it('flags an overdue export', () => {
    const state: AppState = { ...base, lastExportAt: addDays(todayIso(), -40) };
    const items = generateReviewItems(state);
    expect(items.some(i => i.title.toLowerCase().includes('export'))).toBe(true);
  });

  it('does not mutate the input state', () => {
    const state: AppState = { ...base, lastExportAt: addDays(todayIso(), -40) };
    const before = JSON.stringify(state);
    generateReviewItems(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('preserves existing review items that are not ok', () => {
    const existing: ReviewItem = {
      id: 'review-b1',
      title: 'Existing backup item',
      recurrenceDays: 30,
      lastReviewedDate: '',
      nextReviewDate: addDays(todayIso(), -5),
      status: 'overdue',
      notes: '',
      linkedEntityIds: ['b1'],
      source: 'user',
    };
    const state: AppState = {
      ...base,
      backups: [{
        id: 'b1', label: 'MacBook backup', destination: 'External drive',
        recoveryReferenceIds: [], coversIds: ['d1'], copies: 'one',
        lastCheckedDate: '', restoreTestedDate: '', restored: 'unknown',
        canRestorePersonIds: [], notes: '', visibility: 'private', reviewDate: '',
      }],
      reviewItems: [existing],
    };
    const items = generateReviewItems(state);
    const found = items.find(i => i.id === existing.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe('overdue');
    expect(found!.nextReviewDate).toBe(existing.nextReviewDate);
  });

  it('replaces existing review items that are ok', () => {
    const existing: ReviewItem = {
      id: 'review-b1',
      title: 'Old title',
      recurrenceDays: 30,
      lastReviewedDate: todayIso(),
      nextReviewDate: addDays(todayIso(), -5),
      status: 'ok',
      notes: '',
      linkedEntityIds: ['b1'],
      source: 'user',
    };
    const state: AppState = {
      ...base,
      backups: [{
        id: 'b1', label: 'MacBook backup', destination: 'External drive',
        recoveryReferenceIds: [], coversIds: ['d1'], copies: 'one',
        lastCheckedDate: '', restoreTestedDate: '', restored: 'unknown',
        canRestorePersonIds: [], notes: '', visibility: 'private', reviewDate: '',
      }],
      reviewItems: [existing],
    };
    const items = generateReviewItems(state);
    const found = items.find(i => i.id === existing.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe('due');
    expect(found!.title).toContain('backup');
  });

  it('generates deterministic review item ids', () => {
    const state: AppState = { ...base, lastExportAt: addDays(todayIso(), -40) };
    const first = generateReviewItems(state).map(i => i.id).sort();
    const second = generateReviewItems(state).map(i => i.id).sort();
    expect(first).toEqual(second);
  });
});

describe('findAttentionItems', () => {
  it('returns only review items whose status is due or overdue', () => {
    const device: Device = {
      id: 'd1', label: 'MacBook', role: 'Main computer', category: 'computer',
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '',
    };
    const account: Account = {
      id: 'a1', label: 'Email', provider: '', purpose: '', personIds: [], mfa: 'unknown',
      recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '',
    };
    const okItem: ReviewItem = {
      id: 'review-a1',
      title: 'Account recovery reference',
      recurrenceDays: 30,
      lastReviewedDate: todayIso(),
      nextReviewDate: addDays(todayIso(), 30),
      status: 'ok',
      notes: '',
      linkedEntityIds: ['a1'],
      source: 'user',
    };
    const state: AppState = {
      ...base,
      devices: [device],
      accounts: [account],
      reviewItems: [okItem],
    };
    const attention = findAttentionItems(state);
    expect(attention.every(i => i.status === 'due' || i.status === 'overdue')).toBe(true);
    expect(attention.length).toBeGreaterThan(0);
  });
});
