/* IT / Admin — Login, Dashboard, Device lists */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  function bindShell(root) {
    const out = root.querySelector('[data-action="admin-logout"]');
    if (out) out.addEventListener('click', function () { S.clearSession('admin'); Athar.router.go('#/admin/login'); });
  }

  function deviceCell(d) {
    const owner = S.getUser(d.userId);
    return '<span style="display:flex;align-items:center;gap:12px">' + UI.deviceThumb(d).replace('icon-tile', 'icon-tile" style="width:40px;height:40px;border-radius:12px') +
      '<span style="display:flex;flex-direction:column;gap:2px"><span style="font-weight:500">' + esc(M.deviceName(d)) + '</span><span class="caption">' + esc(d.id) + ' · ' + M.typeInfo(d.type).label + (owner ? ' · ' + esc(owner.name) : '') + '</span></span></span>';
  }
  function condText(c) {
    const col = { Good: 'var(--ok-fg)', Fair: 'var(--warn-fg)', Poor: 'var(--danger-fg)' }[c] || 'var(--text-2)';
    return '<span style="color:' + col + ';font-weight:500">' + (c || '—') + '</span>';
  }
  Athar.adminHelpers = { deviceCell: deviceCell, condText: condText, bindShell: bindShell };

  function devicesTable(list, emptyText) {
    if (!list.length) return '<div class="panel-body">' + UI.empty(emptyText, 'New submissions appear here automatically.') + '</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Device</th><th scope="col">AI Recommendation</th><th scope="col">Condition</th><th scope="col">CO₂e</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>' +
      list.map(function (d) {
        const a = d.assessment || {};
        const submitted = (d.history || []).filter(function (h) { return h.status === 'pending_it'; }).pop();
        return '<tr><td>' + deviceCell(d) + '</td><td>' + UI.recBadge(a.recommendation) + '</td><td>' + condText(a.condition) + '</td>' +
          '<td style="font-variant-numeric:tabular-nums">' + U.kg(d.status === 'reuse' || d.status === 'dispose' ? d.co2Saved : a.co2Estimate) + '</td>' +
          '<td class="caption" style="white-space:nowrap">' + U.formatDate(submitted ? submitted.at : d.createdAt, true) + '</td>' +
          '<td>' + UI.statusBadge(d.status) + '</td>' +
          '<td><a class="btn ' + (d.status === 'pending_it' ? 'btn-primary' : 'btn-secondary') + ' btn-sm" style="box-shadow:none" href="#/admin/review/' + d.id + '">' + (d.status === 'pending_it' ? 'Review' : 'View') + '</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- Admin login ---------- */
  Athar.pages.adminLogin = {
    route: '#/admin/login', role: null, area: 'admin', title: 'IT sign in',
    render: function () {
      return '<div class="admin-login">' +
        '<section class="brand-side">' +
          U.leafSprig('right:-150px;bottom:-120px;opacity:.1;transform:rotate(-18deg)', 460, 520, ['#FFFFFF', '#FFFFFF', '#8BC34A']) +
          '<img src="assets/athar-logo-white.png" alt="أثر Athar — Smart E-Waste Management" style="position:relative;width:220px">' +
          '<div style="position:relative;display:flex;flex-direction:column;gap:16px;max-width:460px">' +
            '<span class="pill" style="align-self:flex-start;background:rgba(139,195,74,.2);color:#E4F4CF;letter-spacing:.04em">IT VERIFICATION PORTAL</span>' +
            '<h1 style="font-size:40px;font-weight:600;line-height:1.15;letter-spacing:-.02em">AI recommends.<br>Experts decide.</h1>' +
            '<p style="font-size:16px;line-height:1.6;color:#D7EBDD">Review AI assessments, confirm the final decision, and route every device to its next life — responsibly.</p>' +
          '</div><span></span>' +
        '</section>' +
        '<section class="form-side"><form class="form" id="admin-form" style="width:100%;max-width:420px" novalidate>' +
          '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"><h2 style="font-size:28px;font-weight:600">Sign in to Athar Admin</h2><p class="sub" style="font-size:15px">For IT specialists and administrators.</p></div>' +
          '<div class="field"><label class="label" for="a-email">Staff email</label><input class="input" id="a-email" name="login" type="email" value="it@kau.edu.sa" autocomplete="username"></div>' +
          '<div class="field"><label class="label" for="a-pass">Password</label><input class="input" id="a-pass" name="password" type="password" value="admin123" autocomplete="current-password"></div>' +
          '<div id="admin-error" role="alert"></div>' +
          '<button class="btn btn-primary btn-block" type="submit">Sign In</button>' +
          '<p class="caption" style="text-align:center">Demo IT account: <b>it@kau.edu.sa</b> / <b>admin123</b></p>' +
          '<p class="caption" style="text-align:center"><a href="#/login" style="font-weight:600;text-decoration:none">← Back to the donor app</a></p>' +
        '</form></section></div>';
    },
    mount: function (ctx, root) {
      root.querySelector('#admin-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const f = new FormData(e.target);
        try { S.login(f.get('login'), f.get('password'), 'admin'); Athar.router.go('#/admin'); }
        catch (ex) { root.querySelector('#admin-error').innerHTML = '<p class="form-error">' + esc(ex.message) + '</p>'; }
      });
    }
  };

  /* ---------- Admin dashboard ---------- */
  Athar.pages.adminDashboard = {
    route: '#/admin', role: 'admin', area: 'admin', title: 'IT dashboard',
    render: function (ctx) {
      const all = S.listDevices(function (d) { return d.status !== 'draft'; });
      const pending = all.filter(function (d) { return d.status === 'pending_it'; });
      const reuse = all.filter(function (d) { return d.status === 'reuse'; });
      const dispose = all.filter(function (d) { return d.status === 'dispose'; });
      const kpi = function (href, label, value, ic, tone, foot, warn) {
        const tones = { ok: ['var(--ok-bg)', 'var(--ok-fg)'], warn: ['var(--warn-bg)', 'var(--warn-fg)'], danger: ['var(--danger-bg)', 'var(--danger-fg)'], neutral: ['var(--muted)', 'var(--primary)'] }[tone];
        return '<a class="kpi' + (warn ? ' warn' : '') + '" href="' + href + '"><span class="top">' + label + '<span class="ic" style="background:' + tones[0] + ';color:' + tones[1] + '">' + icon(ic, 18) + '</span></span><span class="v">' + value + '</span><span class="caption">' + foot + '</span></a>';
      };
      const content =
        '<header class="page-head"><div style="display:flex;flex-direction:column;gap:4px"><h1>Overview</h1><span class="sub">' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + pending.length + ' device' + (pending.length === 1 ? '' : 's') + ' waiting for your verification</span></div></header>' +
        '<section class="kpis" aria-label="Key figures">' +
          kpi('#/admin/reviews', 'Pending Reviews', pending.length, 'clock', 'warn', 'Need an expert decision', true) +
          kpi('#/admin/reviews?tab=approved', 'Approved Devices', reuse.length + dispose.length, 'shield', 'neutral', 'Verified by IT') +
          kpi('#/admin/reviews?tab=reuse', 'Reuse', reuse.length, 'recycle', 'ok', 'Students, departments & charities') +
          kpi('#/admin/reviews?tab=dispose', 'Dispose', dispose.length, 'factory', 'danger', 'Certified e-waste disposal') +
        '</section>' +
        '<section class="panel"><div class="panel-head"><div style="display:flex;flex-direction:column;gap:2px"><h2 class="h2">Pending AI Assessments</h2><span class="caption">Every AI recommendation needs an expert decision</span></div>' +
          '<a class="btn btn-secondary btn-sm" href="#/admin/reviews">View all ' + pending.length + '</a></div>' +
          devicesTable(pending.slice(0, 6), 'No devices waiting for review') + '</section>';
      return UI.adminShell('dashboard', ctx.admin, content);
    },
    mount: function (ctx, root) { bindShell(root); }
  };

  /* ---------- Device lists (pending / approved / reuse / dispose / all) ---------- */
  const TABS = [
    ['pending', 'Pending', function (d) { return d.status === 'pending_it'; }],
    ['approved', 'Approved', function (d) { return d.status === 'reuse' || d.status === 'dispose'; }],
    ['reuse', 'Reuse', function (d) { return d.status === 'reuse'; }],
    ['dispose', 'Dispose', function (d) { return d.status === 'dispose'; }],
    ['returned', 'Review requested', function (d) { return d.status === 'returned'; }],
    ['all', 'All', function (d) { return d.status !== 'draft'; }]
  ];
  Athar.pages.adminReviews = {
    route: '#/admin/reviews', role: 'admin', area: 'admin', title: 'Device reviews',
    render: function (ctx) {
      const tab = TABS.find(function (t) { return t[0] === ctx.query.tab; }) || TABS[0];
      const all = S.listDevices();
      const list = all.filter(tab[2]);
      const content =
        '<header class="page-head"><div style="display:flex;flex-direction:column;gap:4px"><h1>' + (tab[0] === 'pending' ? 'Pending Reviews' : tab[0] === 'all' ? 'All Devices' : tab[1] + ' Devices') + '</h1><span class="sub">AI has assessed these devices. Pending ones need your expert decision before routing.</span></div></header>' +
        '<div class="tabs" role="tablist">' + TABS.map(function (t) {
          return '<a class="tab" role="tab" href="#/admin/reviews?tab=' + t[0] + '" aria-selected="' + (t === tab) + '" style="text-decoration:none">' + t[1] + ' <span class="n">' + all.filter(t[2]).length + '</span></a>';
        }).join('') + '</div>' +
        '<section class="panel">' + devicesTable(list, 'Nothing here yet') + '</section>';
      return UI.adminShell(tab[0] === 'all' ? 'all' : 'pending', ctx.admin, content);
    },
    mount: function (ctx, root) { bindShell(root); }
  };
})();
