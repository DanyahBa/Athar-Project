/* Screen 03 — Home Dashboard */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, icon = U.icon, esc = U.esc;

  Athar.pages.home = {
    route: '#/home', role: 'user', title: 'Home',
    render: function (ctx) {
      const devices = Athar.store.devicesOf(ctx.user.id);
      const s = Athar.impact.summary(devices);
      const first = ctx.user.name.split(' ')[0];
      const recent = devices.slice(0, 3);

      const stat = function (href, ic, value, label) {
        return '<a class="stat" href="' + href + '"><span class="icon-circle">' + icon(ic, 18) + '</span><span class="value">' + value + '</span><span class="label">' + label + '</span></a>';
      };

      return '<div class="screen">' +
        U.leafSprig('top:60px;right:-44px;opacity:.12;transform:rotate(12deg)') +
        '<div class="content with-nav" style="position:relative;gap:22px">' +
          '<header class="topbar">' +
            '<img src="assets/athar-mark.png" alt="أثر Athar" style="height:40px">' +
            '<div style="display:flex;gap:8px">' +
              '<a class="icon-btn" href="#/devices" aria-label="My devices">' + icon('bell', 20, 1.6) + (s.inReview ? '<span style="position:absolute;top:10px;right:11px;width:8px;height:8px;border-radius:50%;background:var(--danger);border:2px solid #fff"></span>' : '') + '</a>' +
              '<a class="icon-btn solid" href="#/profile" aria-label="Profile" style="font-size:15px;font-weight:600">' + esc(U.initials(ctx.user.name)) + '</a>' +
            '</div>' +
          '</header>' +
          '<div style="display:flex;flex-direction:column;gap:4px">' +
            '<span class="sub">' + U.greeting() + '</span>' +
            '<h1 class="h1 lg">' + esc(first) + ' 👋</h1>' +
            '<span class="sub">Ready to make an impact?</span>' +
          '</div>' +
          '<section class="hero">' +
            U.leafSprig('right:-28px;top:-6px;opacity:.55', 170, 190) +
            '<div style="position:relative;display:flex;gap:14px;align-items:flex-start">' +
              '<span class="icon-tile" style="background:#fff;width:48px;height:48px;box-shadow:0 4px 12px rgba(7,91,69,.1)">' + icon('phone', 24, 1.6) + '</span>' +
              '<div style="display:flex;flex-direction:column;gap:6px"><h2>Give your device<br>a second life.</h2><p>Register your electronic device and let Athar assess its condition.</p></div>' +
            '</div>' +
            '<a class="btn btn-primary" href="#/register" style="position:relative;align-self:flex-start;height:48px">' + icon('plus', 18, 2) + 'Register Device</a>' +
          '</section>' +
          '<section class="section">' +
            '<div class="section-head"><h2 class="h2">Your Impact</h2><a href="#/impact" style="font-size:13px;font-weight:500;text-decoration:none;padding:8px 0">View Impact</a></div>' +
            '<div class="stat-grid">' +
              stat('#/impact', 'leaf', U.kg(s.co2), 'CO₂e Saved') +
              stat('#/devices', 'recycle', s.reused, 'Reused') +
              stat('#/devices', 'phone', s.registered, 'Devices') +
            '</div>' +
          '</section>' +
          '<section class="section">' +
            '<div class="section-head"><h2 class="h2">Recent Devices</h2>' + (devices.length ? '<a href="#/devices" style="font-size:13px;font-weight:500;text-decoration:none;padding:8px 0">View All</a>' : '') + '</div>' +
            (recent.length ? '<div class="list">' + recent.map(function (d) {
              return '<a class="device-row" href="' + UI.deviceHref(d) + '">' + UI.deviceThumb(d) +
                '<span class="grow"><span class="name">' + esc(M.deviceName(d)) + '</span>' + UI.statusText(d.status) + '</span>' +
                '<span style="color:var(--text-2)">' + icon('chevron', 18, 1.8) + '</span></a>';
            }).join('') + '</div>'
            : UI.empty('No devices yet', 'Register your first device to see it here.', '<a class="btn btn-primary btn-sm" href="#/register">' + icon('plus', 16, 2) + 'Register Device</a>')) +
          '</section>' +
        '</div>' + UI.bottomNav('home') + '</div>';
    }
  };
})();
