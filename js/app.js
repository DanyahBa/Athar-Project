/* Athar MVP — app start-up */
(function () {
  Athar.store.init();
  // Re-render when data changes in another tab (e.g. IT approves while the donor app is open).
  Athar.store.onChange(function () { /* same-tab writes are handled by each page */ });
  window.addEventListener('storage', function () { Athar.router.refresh(); });
  window.addEventListener('hashchange', Athar.router.render);
  Athar.router.render();
})();
