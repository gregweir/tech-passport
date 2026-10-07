const ENDPOINT_META_NAME = 'tartanleaf-analytics-endpoint';
const OPT_OUT_STORAGE_KEY = 'tl_aggregate_analytics_opt_out';
const PRODUCTION_HOSTS = new Set(['techpassport.tartanleaf.com']);

interface PrivacyNavigator extends Navigator {
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string;
}

export function hasBrowserPrivacySignal(nav: PrivacyNavigator = navigator as PrivacyNavigator): boolean {
  const dnt = nav.doNotTrack ?? nav.msDoNotTrack;
  return nav.globalPrivacyControl === true || dnt === '1' || dnt === 'yes';
}

export function isAggregateAnalyticsOptedOut(): boolean {
  if (hasBrowserPrivacySignal()) return true;
  try {
    return localStorage.getItem(OPT_OUT_STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

export function setAggregateAnalyticsOptOut(optedOut: boolean): void {
  try {
    localStorage.setItem(OPT_OUT_STORAGE_KEY, optedOut ? 'true' : 'false');
  } catch {
    // If the preference cannot be retained, fail closed.
  }
}

function configuredEndpoint(): URL | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;
  if (!PRODUCTION_HOSTS.has(window.location.hostname.toLowerCase())) return null;
  const raw = document.querySelector<HTMLMetaElement>(
    `meta[name="${ENDPOINT_META_NAME}"]`,
  )?.content.trim();
  if (!raw) return null;

  try {
    const endpoint = new URL(raw, window.location.origin);
    return endpoint.origin === window.location.origin ? endpoint : null;
  } catch {
    return null;
  }
}

export function isAggregateAnalyticsConfigured(): boolean {
  return configuredEndpoint() !== null;
}

export async function recordAppOpen(): Promise<void> {
  if (isAggregateAnalyticsOptedOut() || !navigator.onLine) return;
  const endpoint = configuredEndpoint();
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: 1,
        app: 'tech_passport',
        event: 'app_open',
      }),
    });
  } catch {
    // Measurement must never delay or break the app, and is not queued.
  }
}
