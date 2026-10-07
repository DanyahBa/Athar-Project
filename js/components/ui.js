/* Athar MVP — reusable UI pieces (return HTML strings). */
window.Athar = window.Athar || { pages: {} };

Athar.ui = (function () {
  const U = Athar.util, M = Athar.model;
  const icon = U.icon, esc = U.esc;

  function statusBadge(status) {
    const s = M.STATUS[status] || M.STATUS.draft;
    return '<span class="badge badge--' + s.tone + '"><span class="dot"></span>' + esc(s.label) + '</span>';
  }

  function statusText(status) {
    const s = M.STATUS[status] || M.STATUS.draft;
    const colors = { reuse: ['var(--ok)', 'var(--ok-fg)'], pending: ['var(--warn)', 'var(--warn-fg)'], dispose: ['var(--danger)', 'var(--danger-fg)'], info: ['var(--info)', '#2A659E'], neutral: ['#9AA8A2', 'var(--text-3)'] }[s.tone];
    return '<span class="status-text" style="color:' + colors[1] + '"><span class="dot" style="background:' + colors[0] + '"></span>' + esc(s.label) + '</span>';
  }

  function deviceThumb(device, large) {
    const t = M.typeInfo(device.type);
    return '<span class="icon-tile' + (large ? ' lg' : '') + '">' +
      (device.image ? '<img src="' + device.image + '" alt="">' : icon(t.icon, large ? 24 : 22, 1.6)) + '</span>';
  }

  // Where a device link should take the user, based on its status.
  function deviceHref(d) {
    if (d.status === 'draft') return d.type ? '#/register/' + d.id + '/details' : '#/register';
    if (d.status === 'assessing') return d.assessment ? '#/result/' + d.id : '#/assess/' + d.id;
    return '#/device/' + d.id;
  }

  function topBar(backHref, center, right, backLabel) {
    return '<div class="topbar">' +
      (backHref ? '<a class="icon-btn" href="' + backHref + '" aria-label="' + (backLabel || 'Back') + '">' + icon(backLabel === 'Close' ? 'close' : 'back', 20, 1.8) + '</a>' : '<span class="spacer"></span>') +
      (center || '') + (right || '<span class="spacer"></span>') + '</div>';
  }

  function stepper(current) {
    let html = '<div class="stepper" aria-label="Step ' + current + ' of 3">';
    for (let i = 1; i <= 3; i++) {
      const cls = i < current ? 'done' : i === current ? 'active' : '';
      html += '<span class="step ' + cls + '">' + (i < current ? icon('check', 14, 3) : '0' + i) + '</span>';
      if (i < 3) html += '<span class="step-line ' + (i < current ? 'done' : '') + '"></span>';
    }
    return html + '</div>';
  }

  function bottomNav(active) {
    const items = [['home', 'Home', '#/home', 'home'], ['devices', 'Devices', '#/devices', 'phone'], ['impact', 'Impact', '#/impact', 'leaf'], ['profile', 'Profile', '#/profile', 'user']];
    return '<nav class="bottom-nav" aria-label="Main">' + items.map(function (it) {
      const on = it[0] === active;
      return '<a class="nav-item" href="' + it[2] + '"' + (on ? ' aria-current="page"' : '') + '><span class="pill-ic">' + icon(it[3], 20, on ? 1.8 : 1.6) + '</span>' + it[1] + '</a>';
    }).join('') + '</nav>';
  }

  function empty(title, text, action) {
    return '<div class="empty"><span style="color:var(--secondary)">' + icon('leaf', 36, 1.4) + '</span>' +
      '<span class="t">' + esc(title) + '</span><span class="sub" style="font-size:13px">' + esc(text) + '</span>' + (action || '') + '</div>';
  }

  function notice(text, kind, ic) {
    return '<div class="notice ' + (kind || '') + '">' + icon(ic || 'info', 20, 1.8) + '<p>' + text + '</p></div>';
  }

  /* ---------- Admin shell ---------- */
  function adminShell(active, admin, content) {
    const pending = Athar.store.listDevices(function (d) { return d.status === 'pending_it'; }).length;
    const links = [
      ['dashboard', 'Dashboard', '#/admin', 'grid'],
      ['pending', 'Pending Reviews', '#/admin/reviews', 'shield', pending],
      ['all', 'All Devices', '#/admin/reviews?tab=all', 'list']
    ];
    return '<div class="admin">' +
      '<aside class="sidebar">' +
        U.leafSprig('bottom:-40px;right:-80px;opacity:.08;transform:rotate(-20deg)', 200, 230, ['#FFFFFF', '#FFFFFF', '#8BC34A']) +
        '<a class="brand" href="#/admin"><img src="assets/athar-mark-white.png" alt="أثر"><span class="wm"><b>ATHAR</b><span>IT ADMIN</span></span></a>' +
        '<nav class="side-nav" aria-label="Admin">' + links.map(function (l) {
          return '<a class="side-link" href="' + l[2] + '"' + (l[0] === active ? ' aria-current="page"' : '') + '>' + icon(l[3], 20, 1.6) + '<span>' + l[1] + '</span>' + (l[4] ? '<span class="count">' + l[4] + '</span>' : '') + '</a>';
        }).join('') + '</nav>' +
        '<div class="side-foot">' +
          '<button class="side-btn" type="button" data-action="admin-logout">' + icon('logout', 20, 1.6) + 'Sign out</button>' +
          '<div class="who"><span class="avatar">' + esc(U.initials(admin.name)) + '</span><span style="display:flex;flex-direction:column;gap:1px"><span style="font-size:13px;font-weight:500">' + esc(admin.name) + '</span><span style="font-size:11px;color:#CFE7D8">IT Specialist</span></span></div>' +
        '</div>' +
      '</aside>' +
      '<main class="main">' + content + '</main></div>';
  }

  function recBadge(rec) {
    const reuse = rec === 'Reuse';
    return '<span class="badge ' + (reuse ? 'badge--reuse' : 'badge--dispose') + '">' + icon('sparkle', 12, 2) + esc(rec || '—') + '</span>';
  }

  return { statusBadge: statusBadge, statusText: statusText, deviceThumb: deviceThumb, deviceHref: deviceHref, topBar: topBar, stepper: stepper, bottomNav: bottomNav, empty: empty, notice: notice, adminShell: adminShell, recBadge: recBadge };
})();
