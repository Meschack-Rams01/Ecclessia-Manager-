export type RouteParams = Record<string, string>;
export type RouteHandler = (params: RouteParams) => void;

const routes: Record<string, RouteHandler> = {};

export function regRoute(path: string, fn: RouteHandler) {
  routes[path] = fn;
}

export function navTo(path: string, params: RouteParams = {}) {
  const q = Object.keys(params).length ? "?" + new URLSearchParams(params).toString() : "";
  window.location.hash = path + q;
}

export function curPath(): string {
  return window.location.hash.slice(1).split("?")[0] || "/";
}

export function curParams(): RouteParams {
  const [, q] = window.location.hash.slice(1).split("?");
  return q ? Object.fromEntries(new URLSearchParams(q)) : {};
}

export function initRouter() {
  const dispatch = () => {
    const p = curPath();
    const fn = routes[p] || routes["*"];
    if (fn) fn(curParams());
  };
  window.addEventListener("hashchange", dispatch);
  dispatch();
}

