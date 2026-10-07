/* =========================================================
   Athar MVP — tiny hash router

   Each page is an object registered in Athar.pages:
     { route: '#/path/:id', role: 'user' | 'admin' | null,
       title: 'Screen name',
       render(ctx) → HTML string,
       mount(ctx, root)  (optional: attach event handlers) }
   ctx = { params, query, user, admin }
   ========================================================= */
window.Athar = window.Athar || { pages: {} };

Athar.router = (function () {
  let current = null;

  function compile(route) {
    const keys = [];
    const re = new RegExp('^' + route.replace(/:[a-zA-Z]+/g, function (m) { keys.push(m.slice(1)); return '([^/?]+)'; }) + '$');
    return { re: re, keys: keys };
  }

  function match(hash) {
    const parts = hash.split('?');
    const path = parts[0];
    const query = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (kv) { const p = kv.split('='); query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    const pages = Object.values(Athar.pages);
    for (const page of pages) {
      if (!page._c) page._c = compile(page.route);
      const m = path.match(page._c.re);
      if (m) {
        const params = {};
        page._c.keys.forEach(function (k, i) { params[k] = decodeURIComponent(m[i + 1]); });
        return { page: page, params: params, query: query };
      }
    }
    return null;
  }

  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  function render() {
    const root = document.getElementById('app');
    const hash = location.hash || '#/';
    if (hash === '#/' || hash === '#') { go(Athar.store.currentUser('user') ? '#/home' : '#/login'); return; }
    const found = match(hash);
    if (!found) { go('#/'); return; }
    const page = found.page;
    const ctx = { params: found.params, query: found.query, user: Athar.store.currentUser('user'), admin: Athar.store.currentUser('admin') };
    if (page.role === 'user' && !ctx.user) { go('#/login'); return; }
    if (page.role === 'admin' && !ctx.admin) { go('#/admin/login'); return; }

    if (current && current.unmount) current.unmount();
    current = page;
    document.body.className = page.area === 'admin' ? 'admin-app' : 'mobile-app';
    document.title = (page.title ? page.title + ' · ' : '') + 'أثر Athar';
    root.innerHTML = page.render(ctx);
    if (page.mount) page.mount(ctx, root);
    const keepScroll = page._lastHash === hash;
    page._lastHash = hash;
    if (!keepScroll) window.scrollTo(0, 0);
  }

  // Re-render the current page (used when data changes, e.g. from another tab).
  function refresh() { if (current && !current.noAutoRefresh) render(); }

  return { render: render, go: go, refresh: refresh };
})();
