/**
 * Простой Hash-роутер для SPA (поддерживает параметры вида /cars/:id).
 */
export class Router {
  constructor(routes, outletElement) {
    this.routes = routes;
    this.outlet = outletElement;
    this.currentCleanup = null;
  }

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    this.resolve();
  }

  navigate(path) {
    window.location.hash = `#${path}`;
  }

  async resolve() {
    const rawHash = window.location.hash.replace(/^#/, '') || '/';
    const [path] = rawHash.split('?');

    let matchedRoute = null;
    let params = {};

    for (const route of this.routes) {
      const match = this.matchPath(route.path, path);
      if (match) {
        matchedRoute = route;
        params = match;
        break;
      }
    }

    if (!matchedRoute) {
      matchedRoute = this.routes.find((r) => r.path === '*') || this.routes[0];
    }

    if (typeof this.currentCleanup === 'function') {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    if (matchedRoute && typeof matchedRoute.render === 'function') {
      const cleanup = await matchedRoute.render(this.outlet, params);
      if (typeof cleanup === 'function') {
        this.currentCleanup = cleanup;
      }
    }
  }

  matchPath(pattern, actualPath) {
    if (pattern === '*') return {};
    const patternParts = pattern.split('/').filter(Boolean);
    const actualParts = actualPath.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i += 1) {
      const part = patternParts[i];
      const actual = actualParts[i];
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(actual);
      } else if (part !== actual) {
        return null;
      }
    }
    return params;
  }
}
