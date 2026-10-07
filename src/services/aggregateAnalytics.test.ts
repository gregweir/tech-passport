// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://techpassport.tartanleaf.com/"}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasBrowserPrivacySignal,
  isAggregateAnalyticsConfigured,
  recordAppOpen,
  setAggregateAnalyticsOptOut,
} from './aggregateAnalytics';

describe('aggregate analytics', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '0' });
  });

  it('honours browser privacy signals', () => {
    expect(hasBrowserPrivacySignal({ globalPrivacyControl: true } as unknown as Navigator)).toBe(true);
    expect(hasBrowserPrivacySignal({ doNotTrack: '1' } as unknown as Navigator)).toBe(true);
  });

  it('is inert when no endpoint is configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await recordAppOpen();
    expect(isAggregateAnalyticsConfigured()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a fixed payload without credentials to a same-origin endpoint', async () => {
    document.head.innerHTML = '<meta name="tartanleaf-analytics-endpoint" content="/api/analytics/events">';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await recordAppOpen();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe('https://techpassport.tartanleaf.com/api/analytics/events');
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      schema: 1,
      app: 'tech_passport',
      event: 'app_open',
    });
    expect((init as RequestInit).credentials).toBe('omit');
  });

  it('stops sending after opt-out', async () => {
    document.head.innerHTML = '<meta name="tartanleaf-analytics-endpoint" content="/api/analytics/events">';
    setAggregateAnalyticsOptOut(true);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await recordAppOpen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects cross-origin endpoints', () => {
    document.head.innerHTML = '<meta name="tartanleaf-analytics-endpoint" content="https://analytics.example/events">';
    expect(isAggregateAnalyticsConfigured()).toBe(false);
  });
});
