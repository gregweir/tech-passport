// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { FormField } from './form-field';

describe('FormField', () => {
  it('associates label with input and renders help text', () => {
    const input = document.createElement('input');
    input.id = 'name';
    const field = FormField({ id: 'name', label: 'Full name', input, helpText: 'As shown on ID.' });
    const label = field.querySelector('label');
    expect(label?.textContent).toBe('Full name');
    expect(label?.htmlFor).toBe('name');
    expect(field.querySelector('.help-text')?.textContent).toBe('As shown on ID.');
    expect(field.contains(input)).toBe(true);
  });

  it('omits help text when not provided', () => {
    const input = document.createElement('input');
    input.id = 'email';
    const field = FormField({ id: 'email', label: 'Email', input });
    expect(field.querySelector('.help-text')).toBeNull();
  });
});
