// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PersonListView } from './person-list';
import { resetStore, addPerson } from '../store';

describe('PersonListView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows the default Me person when no other people exist', () => {
    const el = PersonListView();
    expect(el.textContent).toContain('Me');
    const cards = el.querySelectorAll('.card');
    expect(cards.length).toBe(1);
  });

  it('lists Me first and then other people', () => {
    addPerson({ name: 'Partner', role: 'partner' });
    addPerson({ name: 'Alex', role: 'other' });
    const el = PersonListView();
    const cards = el.querySelectorAll('.card');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('Me');
    expect(cards[1].textContent).toContain('Alex');
    expect(cards[2].textContent).toContain('Partner');
  });

  it('does not show a delete button for the Me person', () => {
    const el = PersonListView();
    const cards = el.querySelectorAll('.card');
    expect(cards[0].textContent).toContain('Me');
    expect(cards[0].textContent).not.toContain('Delete');
  });
});
