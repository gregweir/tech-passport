import { EXPORTABLE_VISIBILITIES } from '../constants';
import type { Visibility } from '../types';

export function filterByVisibility<T extends { visibility: Visibility }>(
  entities: T[],
  allowed: Visibility[]
): T[] {
  return entities.filter(e => allowed.includes(e.visibility));
}

export const HELPER_VISIBILITY: Visibility[] = ['helper-safe', 'emergency'];
export const EMERGENCY_VISIBILITY: Visibility[] = ['emergency'];
export const FULL_VISIBILITY: Visibility[] = [...EXPORTABLE_VISIBILITIES];
