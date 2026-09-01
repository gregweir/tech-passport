interface NavTask {
  path: string;
  label: string;
}

interface NavGroup {
  label: string;
  children: NavTask[];
}

const PRIMARY_TASKS: (NavTask | NavGroup)[] = [
  { path: '/', label: 'Home' },
  {
    label: 'Add or update',
    children: [
      { path: '/people', label: 'People' },
      { path: '/devices', label: 'Devices' },
      { path: '/accounts', label: 'Accounts' },
      { path: '/backups', label: 'Backups' },
      { path: '/recovery', label: 'Recovery' },
      { path: '/dependencies', label: 'What relies on what?' },
    ],
  },
  { path: '/reviews', label: 'Review' },
  {
    label: 'Export / Passport',
    children: [
      { path: '/passport', label: 'Passport' },
      { path: '/export', label: 'Export' },
    ],
  },
];

export function Nav(): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'app-nav';
  nav.setAttribute('aria-label', 'Main');

  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  brand.href = '#/';

  const logoBox = document.createElement('span');
  logoBox.className = 'nav-logo-box';

  const logo = document.createElement('img');
  logo.className = 'nav-logo';
  logo.src = '/tartanleaf-logo.jpg';
  logo.alt = 'Tartanleaf';
  logoBox.appendChild(logo);
  brand.appendChild(logoBox);

  const brandText = document.createElement('span');
  brandText.textContent = 'Tech Passport';
  brand.appendChild(brandText);

  nav.appendChild(brand);

  const menuButton = document.createElement('button');
  menuButton.className = 'nav-menu-button';
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', 'nav-menu');
  menuButton.setAttribute('aria-label', 'Toggle navigation menu');
  menuButton.textContent = '☰';
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    list.classList.toggle('nav-open', !expanded);
  });
  nav.appendChild(menuButton);

  const list = document.createElement('ul');
  list.id = 'nav-menu';
  list.className = 'nav-list';

  function lockMenus(): void {
    nav.setAttribute('data-menu-locked', 'true');
  }

  function unlockMenus(): void {
    nav.removeAttribute('data-menu-locked');
  }

  function closeAllMenus(): void {
    menuButton.setAttribute('aria-expanded', 'false');
    list.classList.remove('nav-open');
    for (const button of list.querySelectorAll('.nav-group-button')) {
      button.setAttribute('aria-expanded', 'false');
    }
    for (const sub of list.querySelectorAll('.nav-sublist')) {
      sub.classList.remove('nav-open');
    }
    lockMenus();
  }

  for (const task of PRIMARY_TASKS) {
    if ('children' in task) {
      const group = document.createElement('li');
      group.className = 'nav-group';

      const groupButton = document.createElement('button');
      groupButton.className = 'nav-group-button';
      groupButton.textContent = task.label;
      groupButton.setAttribute('aria-expanded', 'false');
      groupButton.addEventListener('click', () => {
        unlockMenus();
        const expanded = groupButton.getAttribute('aria-expanded') === 'true';
        groupButton.setAttribute('aria-expanded', String(!expanded));
        subList.classList.toggle('nav-open', !expanded);
      });
      group.appendChild(groupButton);

      const subList = document.createElement('ul');
      subList.className = 'nav-sublist';
      for (const child of task.children) {
        subList.appendChild(makeLink(child, closeAllMenus));
      }
      group.appendChild(subList);
      list.appendChild(group);
    } else {
      list.appendChild(makeLink(task, closeAllMenus));
    }
  }

  // Close menus when clicking outside the nav.
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target as Node)) {
      closeAllMenus();
    }
  });

  // Re-enable hover when the pointer moves to a different nav item.
  nav.addEventListener('mouseenter', (event) => {
    if (
      event.target instanceof HTMLElement &&
      (event.target.classList.contains('nav-group-button') || event.target.classList.contains('nav-link'))
    ) {
      unlockMenus();
    }
  }, true);

  nav.appendChild(list);

  return nav;
}

function makeLink(link: { path: string; label: string }, onClick?: () => void): HTMLElement {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = `#${link.path}`;
  a.textContent = link.label;
  a.className = 'nav-link';
  a.dataset.path = link.path;
  if (onClick) {
    a.addEventListener('click', onClick);
  }
  li.appendChild(a);
  return li;
}
