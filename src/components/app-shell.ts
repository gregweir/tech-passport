import { SaveStatus } from './save-status';

export interface AppShellProps {
  nav: HTMLElement;
  main: HTMLElement;
}

export function AppShell(props: AppShellProps): HTMLElement {
  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const header = document.createElement('header');
  header.className = 'app-header';
  header.appendChild(props.nav);
  header.appendChild(SaveStatus());
  shell.appendChild(header);

  const main = document.createElement('main');
  main.className = 'app-main';
  main.id = 'main-content';
  main.appendChild(props.main);
  shell.appendChild(main);

  return shell;
}
