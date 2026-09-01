import { hydrate, subscribe, getState, resetStore } from './store';
import { router } from './routes';
import { AppShell } from './components/app-shell';
import { Nav } from './components/nav';
import { UpdatePrompt } from './components/update-prompt';
import { registerSW } from 'virtual:pwa-register';
import { clearState } from './db';

async function init() {
  const mainContainer = document.createElement('div');
  const shell = AppShell({ nav: Nav(), main: mainContainer });
  const app = document.getElementById('app');
  if (!app) {
    console.error('App root not found');
    return;
  }
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
  app.appendChild(shell);

  await hydrate();

  if (import.meta.env.DEV) {
    Object.assign(window, {
      __resetTechPassportData: async () => {
        await clearState();
        resetStore();
        router.navigate('/onboarding');
        router.renderInto(mainContainer);
      },
    });
  }

  if (!getState().onboardingComplete && router.currentPath() !== '/onboarding') {
    router.navigate('/onboarding');
  }

  router.renderInto(mainContainer);

  subscribe(() => {
    // Re-render current view on state change
    router.renderInto(mainContainer);
  });

  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        const banner = UpdatePrompt({
          onUpdate: () => updateSW(true),
        });
        app.insertBefore(banner, app.firstChild);
      },
      onOfflineReady() {},
    });
  }
}

init().catch(console.error);
