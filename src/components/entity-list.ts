export interface EntityListProps {
  items: HTMLElement[];
  emptyMessage?: string;
  emptyActions?: HTMLElement[];
  emptyExample?: string;
}

export function EntityList(props: EntityListProps): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'entity-list';

  if (props.items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'entity-list-empty';

    const message = document.createElement('p');
    message.textContent = props.emptyMessage ?? 'Nothing here yet.';
    empty.appendChild(message);

    if (props.emptyExample) {
      const example = document.createElement('p');
      example.className = 'entity-list-example';
      example.textContent = `Example: ${props.emptyExample}`;
      empty.appendChild(example);
    }

    if (props.emptyActions?.length) {
      const actions = document.createElement('div');
      actions.className = 'entity-list-empty-actions';
      for (const action of props.emptyActions) {
        actions.appendChild(action);
      }
      empty.appendChild(actions);
    }

    container.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'entity-list-items';
    list.setAttribute('role', 'list');
    for (const item of props.items) {
      const row = document.createElement('div');
      row.className = 'entity-list-item';
      row.setAttribute('role', 'listitem');
      row.appendChild(item);
      list.appendChild(row);
    }
    container.appendChild(list);
  }

  return container;
}
