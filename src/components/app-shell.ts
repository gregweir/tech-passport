import { SaveStatus } from './save-status';
import { AnalyticsPreferences } from './analytics-preferences';

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

  const analyticsPreferences = AnalyticsPreferences();
  if (analyticsPreferences) {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.appendChild(analyticsPreferences);
    shell.appendChild(footer);
  }

  return shell;
}
