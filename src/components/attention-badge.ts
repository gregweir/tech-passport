export type AttentionStatus = 'ok' | 'due' | 'overdue' | 'snoozed' | 'unknown';

export function AttentionBadge(status: AttentionStatus): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = `badge badge-attention attention-${status}`;
  badge.textContent = statusLabel(status);
  return badge;
}

function statusLabel(status: AttentionStatus): string {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'due':
      return 'Due';
    case 'overdue':
      return 'Overdue';
    case 'snoozed':
      return 'Snoozed';
    case 'unknown':
      return 'Unknown';
  }
}
