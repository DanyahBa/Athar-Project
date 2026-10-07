/* Screens 12–13 — My Devices, Impact, Profile */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  /* ---------- My Devices ---------- */
  const FILTERS = [
    ['all', 'All', function () { return true; }],
    ['reuse', 'Reuse', function (d) { return d.status === 'reuse'; }],
    ['dispose', 'Dispose', function (d) { return d.status === 'dispose'; }],
    ['review', 'Under Review', function (d) { return ['assessing', 'pending_it', 'returned'].includes(d.status); }]
  ];

  Athar.pages.devices = {
    route: '#/devices', role: 'user', title: 'My devices',
    render: function (ctx) {
      const all = S.devicesOf(ctx.user.id);
      const f = FILTERS.find(function (x) { return x[0] === ctx.query.filter; }) || FILTERS[0];
      const list = all.filter(f[2]);
      const inReview = all.filter(FILTERS[3][2]).length;
      return '<div class="screen"><div class="content with-nav" style="gap:18px">' +
        '<header class="topbar"><div style="display:flex;flex-direction:column;gap:2px"><h1 class="h1" style="font-size:26px">My Devices</h1><span class="caption" style="font-size:13px">' + all.length + ' registered · ' + inReview + ' under review</span></div>' +
        '<a class="icon-btn solid" href="#/register" aria-label="Register a device">' + icon('plus', 20, 2) + '</a></header>' +
        '<div class="chips" role="tablist" aria-label="Filter devices">' + FILTERS.map(function (x) {
          return '<a class="chip" role="tab" href="#/devices?filter=' + x[0] + '" aria-selected="' + (x === f) + '" style="display:inline-flex;align-items:center;text-decoration:none">' + x[1] + '</a>';
        }).join('') + '</div>' +
        (list.length ? '<div class="list" style="gap:12px">' + list.map(function (d) {
          const co2 = d.status === 'reuse' || d.status === 'dispose' ? U.kg(d.co2Saved) + ' CO₂e' : d.assessment ? 'Est. ' + U.kg(d.assessment.co2Estimate) : '';
          return '<a class="device-card" href="' + UI.deviceHref(d) + '">' + UI.deviceThumb(d, true) +
            '<span class="meta"><span class="row"><span style="font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(M.deviceName(d)) + '</span>' + UI.statusBadge(d.status) + '</span>' +
            '<span class="caption">Registered ' + U.formatDate(d.createdAt) + '</span>' +
            '<span class="foot"><span style="color:var(--text-2)">ID <b style="font-weight:500;color:var(--text)">' + esc(d.id) + '</b></span><span style="color:var(--ok-fg);font-weight:500">' + co2 + '</span></span></span></a>';
        }).join('') + '</div>'
        : UI.empty(all.length ? 'No devices here' : 'No devices yet', all.length ? 'Try another filter.' : 'Devices you register will appear in this list.', all.length ? '' : '<a class="btn btn-primary btn-sm" href="#/register">' + icon('plus', 16, 2) + 'Register Device</a>')) +
        '</div>' + UI.bottomNav('devices') + '</div>';
    }
  };

  /* ---------- Impact ---------- */
  Athar.pages.impact = {
    route: '#/impact', role: 'user', title: 'Your impact',
    render: function (ctx) {
      const devices = S.devicesOf(ctx.user.id);
      const s = Athar.impact.summary(devices);
      const done = devices.filter(function (d) { return d.status === 'reuse' || d.status === 'dispose'; });
      const kpi = function (v, l) { return '<div class="card" style="display:flex;flex-direction:column;gap:4px;padding:14px"><span style="font-size:22px;font-weight:600">' + v + '</span><span class="caption" style="line-height:1.35">' + l + '</span></div>'; };
      return '<div class="screen"><div class="content with-nav" style="gap:18px">' +
        '<header class="topbar"><h1 class="h1" style="font-size:26px">Your Impact</h1></header>' +
        (done.length ?
          '<section class="hero" style="gap:6px">' + U.leafSprig('right:-20px;top:-10px;opacity:.5', 150, 170) +
            '<span class="sub" style="position:relative;color:var(--text-3);font-size:13px">Total CO₂e saved</span>' +
            '<span style="position:relative;display:flex;align-items:baseline;gap:8px"><span style="font-size:48px;font-weight:600;letter-spacing:-.03em;color:var(--primary);line-height:1.05">' + (Math.round(s.co2 * 10) / 10) + '</span><span style="font-size:18px;font-weight:500;color:var(--primary)">kg CO₂e</span></span>' +
            '<span class="sub" style="position:relative;color:var(--text-3);font-size:13px">From ' + s.processed + ' verified device' + (s.processed === 1 ? '' : 's') + '</span>' +
          '</section>' +
          '<div class="stat-grid">' + kpi(s.processed, 'Devices Processed') + kpi(s.reused, 'Devices Reused') + kpi(U.kg(s.co2), 'CO₂e Saved') + '</div>' +
          '<section class="section"><h2 class="h2">Contributions</h2><div class="list">' + done.map(function (d) {
            return '<a class="device-row" href="#/device/' + d.id + '">' + UI.deviceThumb(d) +
              '<span class="grow"><span class="name">' + esc(M.deviceName(d)) + '</span><span class="caption">' + (d.status === 'reuse' ? 'Reused · ' + M.DESTINATIONS[d.destination].label : 'Certified disposal') + '</span></span>' +
              '<span style="font-size:14px;font-weight:600;color:var(--ok-fg)">' + U.kg(d.co2Saved) + '</span></a>';
          }).join('') + '</div></section>' +
          UI.notice('Your contribution helps extend device life and reduce electronic waste. CO₂e values are estimates.', '', 'info')
        : UI.empty('No impact yet', s.inReview ? 'Your impact appears here once IT verifies your device.' : 'Register a device to start making an impact.', '<a class="btn btn-primary btn-sm" href="' + (s.inReview ? '#/devices' : '#/register') + '">' + (s.inReview ? 'View My Devices' : 'Register Device') + '</a>')) +
        '</div>' + UI.bottomNav('impact') + '</div>';
    }
  };

  /* ---------- Profile ---------- */
  Athar.pages.profile = {
    route: '#/profile', role: 'user', title: 'Profile',
    render: function (ctx) {
      const u = ctx.user;
      return '<div class="screen"><div class="content with-nav" style="gap:18px">' +
        '<header class="topbar"><h1 class="h1" style="font-size:26px">Profile</h1></header>' +
        '<section class="card" style="display:flex;align-items:center;gap:14px"><span class="icon-btn solid" style="width:52px;height:52px;border-radius:50%;font-weight:600">' + esc(U.initials(u.name)) + '</span>' +
          '<span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:16px;font-weight:600">' + esc(u.name) + '</span><span class="caption">' + esc(u.email) + (u.universityId ? ' · ' + esc(u.universityId) : '') + '</span></span></section>' +
        '<div class="list">' +
          '<a class="device-row" href="#/devices"><span class="icon-tile">' + icon('phone', 20) + '</span><span class="grow"><span class="name">My Devices</span></span>' + icon('chevron', 18, 1.8) + '</a>' +
          '<a class="device-row" href="#/impact"><span class="icon-tile">' + icon('leaf', 20) + '</span><span class="grow"><span class="name">My Impact</span></span>' + icon('chevron', 18, 1.8) + '</a>' +
          '<a class="device-row" href="#/admin/login"><span class="icon-tile">' + icon('shield', 20) + '</span><span class="grow"><span class="name">IT Portal</span><span class="caption">For IT staff (demo)</span></span>' + icon('chevron', 18, 1.8) + '</a>' +
        '</div>' +
        '<button class="btn btn-secondary btn-block" type="button" data-action="logout">' + icon('logout', 18) + 'Sign Out</button>' +
        '<button class="btn btn-ghost btn-block" type="button" data-action="reset" style="color:var(--text-2);font-size:13px">' + icon('refresh', 16) + 'Reset demo data</button>' +
        '</div>' + UI.bottomNav('profile') + '</div>';
    },
    mount: function (ctx, root) {
      root.querySelector('[data-action="logout"]').addEventListener('click', function () { S.clearSession('user'); Athar.router.go('#/login'); });
      root.querySelector('[data-action="reset"]').addEventListener('click', function () {
        if (confirm('Reset all demo data? Registered devices will be removed.')) { S.resetDemo(); Athar.router.go('#/login'); }
      });
    }
  };
})();
