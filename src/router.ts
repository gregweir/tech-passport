export type RouteHandler = (params: Record<string, string>) => Node;

export interface Router {
  navigate(path: string): void;
  currentPath(): string;
  renderInto(container: HTMLElement): void;
}

interface CompiledRoute {
  regex: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function compileRoutes(routes: Record<string, RouteHandler>): CompiledRoute[] {
  return Object.entries(routes).map(([path, handler]) => {
    if (path === '*') {
      return { regex: /^.*$/, paramNames: [], handler };
    }

    const paramNames: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    return {
      regex: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    };
  });
}

function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

export function createRouter(routes: Record<string, RouteHandler>): Router {
  let container: HTMLElement | null = null;
  let lastRenderedPath: string | null = null;
  const compiledRoutes = compileRoutes(routes);

  function resolvePath(): string {
    const hash = window.location.hash.replace(/^#/, '') || '/';
    return hash.split('?')[0];
  }

  function render() {
    if (!container) return;
    const path = resolvePath();
    if (path === lastRenderedPath) return;
    lastRenderedPath = path;

    for (const route of compiledRoutes) {
      const match = path.match(route.regex);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      clearContainer(container);
      const node = route.handler(params);
      container.appendChild(node);
      return;
    }
  }

  function navigate(path: string) {
    window.location.hash = path;
    render();
  }

  window.addEventListener('hashchange', render);

  return {
    navigate,
    currentPath: resolvePath,
    renderInto(el) {
      container = el;
      render();
    },
  };
}
