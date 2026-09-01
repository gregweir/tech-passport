// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PassportView } from './passport-view';
import { resetStore, setOnboardingComplete, addDevice } from '../store';

describe('PassportView', () => {
  beforeEach(() => {
    resetStore();
    setOnboardingComplete(true);
    if (!URL.createObjectURL) {
      URL.createObjectURL = () => 'blob:mock-url';
    }
  });

  it('renders preview controls and an iframe', () => {
    const el = PassportView();
    expect(el.querySelector('iframe')).not.toBeNull();
    expect(el.textContent).toContain('Passport');
  });

  it('renders helper-safe content when an entity is visible', () => {
    addDevice({ label: 'Helper Phone', role: 'Phone', category: 'phone', visibility: 'helper-safe' });
    const el = PassportView();
    const iframe = el.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.srcdoc).toContain('Helper Phone');
  });
});
