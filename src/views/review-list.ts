import { getState, updateReviewItem, addReviewItem } from '../store';
import { generateReviewItems } from '../services/reviewGenerator';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { AttentionBadge } from '../components/attention-badge';
import { todayIso } from '../utils/date';

export function ReviewListView(): HTMLElement {
  const state = getState();
  const items = generateReviewItems(state);
  const due = items.filter(i => i.status === 'due' || i.status === 'overdue');

  const container = document.createElement('div');
  container.className = 'review-list';

  const heading = document.createElement('h1');
  heading.textContent = 'Review / attention';
  container.appendChild(heading);

  if (due.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Nothing needs attention right now.';
    container.appendChild(empty);
    return container;
  }

  for (const item of due) {
    container.appendChild(reviewCard(item));
  }

  return container;
}

function ensureReviewItem(item: ReturnType<typeof generateReviewItems>[number]): void {
  const exists = getState().reviewItems.some(i => i.id === item.id);
  if (!exists) {
    addReviewItem(item);
  }
}

function reviewCard(item: ReturnType<typeof generateReviewItems>[number]): HTMLElement {
  return Card({
    title: item.title,
    badges: [AttentionBadge(item.status).textContent ?? item.status],
    subtitle: item.notes || undefined,
    actions: [
      Button({
        label: 'Mark OK',
        variant: 'secondary',
        onClick: () => {
          ensureReviewItem(item);
          updateReviewItem(item.id, {
            status: 'ok',
            lastReviewedDate: todayIso(),
          });
        },
      }),
      Button({
        label: 'Snooze',
        variant: 'secondary',
        onClick: () => {
          ensureReviewItem(item);
          updateReviewItem(item.id, { status: 'snoozed' });
        },
      }),
    ],
  });
}
