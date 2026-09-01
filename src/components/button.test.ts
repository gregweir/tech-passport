// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders a clickable button', () => {
    let clicked = false;
    const btn = Button({ label: 'Save', variant: 'primary', onClick: () => { clicked = true; } });
    expect(btn.textContent).toBe('Save');
    expect(btn.className).toBe('btn btn-primary');
    expect(btn.type).toBe('button');
    btn.click();
    expect(clicked).toBe(true);
  });

  it('can be disabled', () => {
    const btn = Button({ label: 'Disabled', disabled: true });
    expect(btn.disabled).toBe(true);
  });

  it('defaults to secondary variant', () => {
    const btn = Button({ label: 'Default' });
    expect(btn.className).toBe('btn btn-secondary');
  });
});
