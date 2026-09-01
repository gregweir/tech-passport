// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders title, subtitle, badges and actions', () => {
    const action = document.createElement('button');
    action.textContent = 'Edit';
    const card = Card({
      title: 'MacBook Air',
      subtitle: 'Main computer',
      badges: ['laptop'],
      actions: [action],
    });
    expect(card.querySelector('h2')?.textContent).toBe('MacBook Air');
    expect(card.querySelector('.card-subtitle')?.textContent).toBe('Main computer');
    expect(card.querySelectorAll('.badge').length).toBe(1);
    expect(card.querySelector('.badge')?.textContent).toBe('laptop');
    expect(card.querySelector('.card-actions')?.contains(action)).toBe(true);
  });

  it('is clickable via mouse and keyboard when onClick is provided', () => {
    let clicked = 0;
    const card = Card({
      title: 'Clickable',
      onClick: () => { clicked += 1; },
    });
    expect(card.getAttribute('role')).toBe('button');
    expect(card.tabIndex).toBe(0);
    card.click();
    expect(clicked).toBe(1);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clicked).toBe(2);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(clicked).toBe(3);
  });
});
