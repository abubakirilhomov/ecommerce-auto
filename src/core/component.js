/**
 * Хелпер монтирования компонента/страницы в DOM-контейнер.
 * Повторяет жизненный цикл React-компонента: render -> mount -> cleanup.
 */
export function renderToContainer(container, html, onMount) {
  if (!container) return null;
  container.innerHTML = html;
  if (typeof onMount === 'function') {
    return onMount(container);
  }
  return null;
}
