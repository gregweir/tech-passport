// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://techpassport.tartanleaf.com/"}

import { beforeEach, describe, expect, it } from 'vitest';
import { AnalyticsPreferences } from './analytics-preferences';

describe('AnalyticsPreferences', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    localStorage.clear();
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '0' });
  });

  it('does not render until an endpoint is configured', () => {
    expect(AnalyticsPreferences()).toBeNull();
  });

  it('persists a visitor opt-out', () => {
    document.head.innerHTML = '<meta name="tartanleaf-analytics-endpoint" content="/api/analytics/events">';
    const control = AnalyticsPreferences();
    const checkbox = control!.querySelector<HTMLInputElement>('input')!;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(localStorage.getItem('tl_aggregate_analytics_opt_out')).toBe('true');
  });
});
