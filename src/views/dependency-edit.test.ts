// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyEditView } from './dependency-edit';
import { resetStore, addAccount, addDependency, getState } from '../store';

describe('DependencyEditView', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new dependency when the form is submitted', () => {
    const source = addAccount({ label: 'Bank' });
    const target = addAccount({ label: 'Tax' });

    const el = DependencyEditView({ id: null });
    const sourceSelect = el.querySelector('select#dependency-source') as HTMLSelectElement;
    const targetSelect = el.querySelector('select#dependency-target') as HTMLSelectElement;
    const kindSelect = el.querySelector('select#dependency-kind') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    sourceSelect.value = source.id;
    sourceSelect.dispatchEvent(new Event('change'));
    targetSelect.value = target.id;
    targetSelect.dispatchEvent(new Event('change'));
    kindSelect.value = 'requires';
    kindSelect.dispatchEvent(new Event('change'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().dependencies).toHaveLength(1);
    const created = getState().dependencies[0];
    expect(created.sourceId).toBe(source.id);
    expect(created.targetId).toBe(target.id);
    expect(created.kind).toBe('requires');
  });

  it('prevents self-dependency', () => {
    const account = addAccount({ label: 'Bank' });

    const el = DependencyEditView({ id: null });
    const sourceSelect = el.querySelector('select#dependency-source') as HTMLSelectElement;
    const targetSelect = el.querySelector('select#dependency-target') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    sourceSelect.value = account.id;
    sourceSelect.dispatchEvent(new Event('change'));
    targetSelect.value = account.id;
    targetSelect.dispatchEvent(new Event('change'));

    form.dispatchEvent(new Event('submit'));

    expect(getState().dependencies).toHaveLength(0);
    expect(el.textContent).toContain('cannot link an entity to itself');
  });

  it('updates an existing dependency when the form is submitted', () => {
    const source = addAccount({ label: 'Bank' });
    const target = addAccount({ label: 'Tax' });
    const dependency = addDependency({ sourceId: source.id, targetId: target.id, kind: 'requires' });

    const el = DependencyEditView({ id: dependency.id });
    const kindSelect = el.querySelector('select#dependency-kind') as HTMLSelectElement;
    const form = el.querySelector('form') as HTMLFormElement;

    kindSelect.value = 'other';
    kindSelect.dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event('submit'));

    expect(getState().dependencies[0].kind).toBe('other');
  });
});
