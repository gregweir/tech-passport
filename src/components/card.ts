export interface CardProps {
  title: string;
  subtitle?: string;
  badges?: string[];
  actions?: HTMLElement[];
  onClick?: () => void;
}

export function Card(props: CardProps): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'card';
  if (props.onClick) {
    card.role = 'button';
    card.tabIndex = 0;
    card.addEventListener('click', props.onClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') props.onClick!();
    });
  }

  const heading = document.createElement('h2');
  heading.textContent = props.title;
  card.appendChild(heading);

  if (props.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'card-subtitle';
    sub.textContent = props.subtitle;
    card.appendChild(sub);
  }

  if (props.badges?.length) {
    const row = document.createElement('div');
    row.className = 'badge-row';
    for (const text of props.badges) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = text;
      row.appendChild(badge);
    }
    card.appendChild(row);
  }

  if (props.actions?.length) {
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    for (const action of props.actions) actions.appendChild(action);
    card.appendChild(actions);
  }

  return card;
}
