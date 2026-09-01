// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { VisibilitySelect } from './visibility-select';
import type { Visibility } from '../types';

describe('VisibilitySelect', () => {
  it('renders current visibility options without legacy value', () => {
    const select = VisibilitySelect({ id: 'visibility' });
    expect(select.id).toBe('visibility');
    const values = Array.from(select.options).map((opt) => opt.value);
    expect(values).toEqual(['private', 'helper-safe', 'emergency', 'backup-only']);
  });

  it('reports changes as Visibility values', () => {
    let selected: Visibility | null = null;
    const select = VisibilitySelect({
      id: 'visibility',
      onChange: (value) => { selected = value; },
    });
    select.value = 'emergency';
    select.dispatchEvent(new Event('change'));
    expect(selected).toBe('emergency');
  });

  it('can include an empty option', () => {
    const select = VisibilitySelect({ id: 'visibility', includeEmpty: true, emptyLabel: 'Choose' });
    expect(select.options[0].value).toBe('');
    expect(select.options[0].textContent).toBe('Choose');
  });
});
