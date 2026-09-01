// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Select } from './select';

describe('Select', () => {
  it('renders options and reports changes', () => {
    let selected = '';
    const select = Select({
      id: 'kind',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'computer', label: 'Computer' },
      ],
      onChange: (value) => { selected = value; },
    });
    expect(select.id).toBe('kind');
    expect(select.options.length).toBe(2);
    expect(select.options[0].textContent).toBe('Phone');
    select.value = 'computer';
    select.dispatchEvent(new Event('change'));
    expect(selected).toBe('computer');
  });

  it('includes an empty option when requested', () => {
    const select = Select({
      id: 'kind',
      options: [{ value: 'phone', label: 'Phone' }],
      includeEmpty: true,
      emptyLabel: 'Choose one',
    });
    expect(select.options.length).toBe(2);
    expect(select.options[0].value).toBe('');
    expect(select.options[0].textContent).toBe('Choose one');
  });

  it('sets the provided value', () => {
    const select = Select({
      id: 'kind',
      options: [{ value: 'phone', label: 'Phone' }],
      value: 'phone',
    });
    expect(select.value).toBe('phone');
  });
});
