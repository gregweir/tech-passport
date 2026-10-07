import {
  hasBrowserPrivacySignal,
  isAggregateAnalyticsConfigured,
  isAggregateAnalyticsOptedOut,
  setAggregateAnalyticsOptOut,
} from '../services/aggregateAnalytics';

export function AnalyticsPreferences(): HTMLElement | null {
  if (!isAggregateAnalyticsConfigured()) return null;

  const section = document.createElement('section');
  section.className = 'analytics-preferences';
  section.setAttribute('aria-labelledby', 'analytics-preferences-title');

  const title = document.createElement('h2');
  title.id = 'analytics-preferences-title';
  title.textContent = 'Privacy and analytics';
  section.appendChild(title);

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !isAggregateAnalyticsOptedOut();
  checkbox.disabled = hasBrowserPrivacySignal();
  checkbox.addEventListener('change', () => {
    setAggregateAnalyticsOptOut(!checkbox.checked);
  });
  label.append(checkbox, ' Share anonymous app-use counts');
  section.appendChild(label);

  const explanation = document.createElement('p');
  explanation.textContent = checkbox.disabled
    ? 'Your browser privacy signal has turned anonymous measurement off.'
    : 'Shares a simple app-open total. It does not send your names, devices, accounts, backups, recovery plans, notes, or any other Tech Passport content.';
  section.appendChild(explanation);

  return section;
}
