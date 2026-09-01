// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createRouter } from './router';

describe('router', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    history.pushState(null, '', '#/');
  });

  it('renders the matching route', () => {
    const router = createRouter({
      '/': () => {
        const el = document.createElement('div');
        el.textContent = 'home';
        return el;
      },
      '/devices': () => {
        const el = document.createElement('div');
        el.textContent = 'devices';
        return el;
      },
    });
    router.renderInto(container);
    expect(container.textContent).toBe('home');
  });

  it('navigates to a new route', () => {
    const router = createRouter({
      '/': () => document.createTextNode('home'),
      '/devices': () => document.createTextNode('devices'),
    });
    router.renderInto(container);
    router.navigate('/devices');
    expect(container.textContent).toBe('devices');
  });

  it('does not double-render when hashchange fires after navigate', () => {
    let renderCount = 0;
    const router = createRouter({
      '/': () => {
        renderCount++;
        return document.createTextNode('home');
      },
      '/devices': () => {
        renderCount++;
        return document.createTextNode('devices');
      },
    });
    router.renderInto(container);
    expect(renderCount).toBe(1);
    router.navigate('/devices');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(container.textContent).toBe('devices');
    expect(renderCount).toBe(2);
  });

  it('extracts route parameters and passes them to the handler', () => {
    let capturedParams: Record<string, string> = {};
    const router = createRouter({
      '/': () => document.createTextNode('home'),
      '/people/:id/edit': (params) => {
        capturedParams = params;
        const el = document.createElement('div');
        el.textContent = `edit ${params.id}`;
        return el;
      },
    });
    router.renderInto(container);
    router.navigate('/people/abc123/edit');
    expect(capturedParams).toEqual({ id: 'abc123' });
    expect(container.textContent).toBe('edit abc123');
  });

  it('prefers exact match over parameterized route when both could match', () => {
    const router = createRouter({
      '/people/new': () => {
        const el = document.createElement('div');
        el.textContent = 'new';
        return el;
      },
      '/people/:id/edit': (params) => {
        const el = document.createElement('div');
        el.textContent = `edit ${params.id}`;
        return el;
      },
    });
    router.renderInto(container);
    router.navigate('/people/new');
    expect(container.textContent).toBe('new');
  });
});
