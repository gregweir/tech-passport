export function NotFoundView(): HTMLElement {
  const el = document.createElement('div');

  const heading = document.createElement('h1');
  heading.textContent = 'Page not found';
  el.appendChild(heading);

  const paragraph = document.createElement('p');
  const link = document.createElement('a');
  link.href = '#/';
  link.textContent = 'Go to dashboard';
  paragraph.appendChild(link);
  el.appendChild(paragraph);

  return el;
}
