import { describe, it, expect } from 'vitest';
import { analyzeSecretRisk } from './secretWarnings';

describe('analyzeSecretRisk', () => {
  it('flags long random strings', () => {
    const result = analyzeSecretRisk('aBc9xYz2qR5wT8uI0oP7lK4jH1gF6dS3');
    expect(result.concern).toBe(true);
  });

  it('does not flag ordinary descriptions', () => {
    const result = analyzeSecretRisk('My main laptop in the study');
    expect(result.concern).toBe(false);
  });

  it('flags seed-phrase-like word lists', () => {
    const result = analyzeSecretRisk('abandon ability about above absent abstract');
    expect(result.concern).toBe(true);
  });

  it('flags base32 TOTP seeds', () => {
    const result = analyzeSecretRisk('JBSWY3DPEHPK3PXP');
    expect(result.concern).toBe(true);
  });
});
