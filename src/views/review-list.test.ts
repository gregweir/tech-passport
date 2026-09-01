// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ReviewListView } from './review-list';
import { resetStore, addDevice, setOnboardingComplete, setLastExportAt, getState } from '../store';
import { todayIso } from '../utils/date';

describe('ReviewListView', () => {
  beforeEach(() => {
    resetStore();
    setOnboardingComplete(true);
    setLastExportAt(todayIso());
  });

  it('lists generated review items', () => {
    addDevice({ label: 'Phone', role: 'Main phone', category: 'phone' });
    const el = ReviewListView();
    expect(el.textContent).toContain('Phone');
  });

  it('shows empty state when there are no items', () => {
    const el = ReviewListView();
    expect(el.textContent).toContain('Nothing needs attention');
  });

  it('marks an item OK when the Mark OK button is clicked', () => {
    addDevice({ label: 'Phone', role: 'Main phone', category: 'phone' });
    const el = ReviewListView();
    const markOkButton = Array.from(el.querySelectorAll('button')).find(b => b.textContent === 'Mark OK');
    expect(markOkButton).toBeTruthy();
    markOkButton!.click();
    const item = getState().reviewItems.find(i => i.title.includes('Phone'));
    expect(item?.status).toBe('ok');
    expect(item?.lastReviewedDate).toBe(todayIso());
  });

  it('snoozes an item when the Snooze button is clicked', () => {
    addDevice({ label: 'Tablet', role: 'Main tablet', category: 'tablet' });
    const el = ReviewListView();
    const snoozeButton = Array.from(el.querySelectorAll('button')).find(b => b.textContent === 'Snooze');
    expect(snoozeButton).toBeTruthy();
    snoozeButton!.click();
    const item = getState().reviewItems.find(i => i.title.includes('Tablet'));
    expect(item?.status).toBe('snoozed');
  });
});
