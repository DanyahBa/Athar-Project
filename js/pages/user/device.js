/* Screens 09–10 — Device status: Pending IT Verification / Final Decision / Review requested */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  function historyAt(d, status) {
    const h = (d.history || []).filter(function (x) { return x.status === status; }).pop();
    return h ? h.at : null;
  }

  // Vertical timeline used on the status screens.
  function timeline(d) {
    const a = d.assessment || {};
    const finalDone = d.status === 'reuse' || d.status === 'dispose';
    const verified = finalDone || d.status === 'returned';
    const rows = [
      { t: 'AI Assessment', d: 'Completed · ' + U.formatDate(a.at || historyAt(d, 'assessing'), true), state: 'done' },
      { t: 'Recommendation', d: 'AI suggests ' + (a.recommendation || '—') + ' · ' + (a.condition || '') + ' condition', state: 'done' },
      { t: 'IT Verification',
        d: d.status === 'pending_it' ? 'Pending · an IT specialist is reviewing'
          : d.status === 'returned' ? 'Review requested by IT · ' + U.formatDate(d.review && d.review.at, true)
          : 'Approved by ' + esc(d.review ? d.review.reviewerName : 'IT') + ' · ' + U.formatDate(d.review && d.review.at, true),
        state: d.status === 'pending_it' ? 'current' : d.status === 'returned' ? 'current' : 'done' },
      { t: 'Final Routing',
        d: finalDone ? (d.status === 'reuse' ? 'Reuse → ' + M.DESTINATIONS[d.destination].label : 'Certified E-Waste Disposal') : 'Waiting',
        state: finalDone ? 'done' : 'todo' }
    ];
    return '<ol class="timeline" aria-label="Progress">' + rows.map(function (r, i) {
      return '<li class="tl ' + r.state + '"><span class="rail"><span class="node">' + (r.state === 'done' ? icon('check', 12, 3) : '') + '</span>' + (i < rows.length - 1 ? '<span class="line"></span>' : '') + '</span>' +
        '<span class="body"><span class="t">' + r.t + '</span><span class="d">' + r.d + '</span></span></li>';
    }).join('') + '</ol>';
  }

  function deviceCard(d) {
    return '<section class="card" style="display:flex;align-items:center;gap:14px">' + UI.deviceThumb(d, true) +
      '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:500">' + esc(M.deviceName(d)) + '</span><span class="caption">' + esc(d.id) + ' · ' + M.typeInfo(d.type).label + '</span></span>' +
      UI.statusBadge(d.status) + '</section>';
  }

  Athar.pages.device = {
    route: '#/device/:id', role: 'user', title: 'Device status',
    render: function (ctx) {
      const d = S.getDevice(ctx.params.id);
      if (!d || d.userId !== ctx.user.id) return '<div class="screen"><div class="content">' + UI.topBar('#/devices') + UI.empty('Device not found', 'It may have been removed.', '<a class="btn btn-primary btn-sm" href="#/devices">My Devices</a>') + '</div></div>';
      if (d.status === 'draft' || d.status === 'assessing') { setTimeout(function () { Athar.router.go(UI.deviceHref(d)); }); return ''; }

      let body = '', actions = '';
      if (d.status === 'pending_it') {
        body =
          '<div style="display:flex;flex-direction:column;gap:6px"><h1 class="h1">Your device is under review</h1><p class="sub">' + esc(M.deviceName(d)) + ' · <b style="color:var(--text)">' + esc(d.id) + '</b></p></div>' +
          timeline(d) +
          UI.notice('An IT specialist will review the AI assessment before the final decision. This page updates automatically when it’s confirmed.', '', 'info');
        actions = '<a class="btn btn-primary btn-block" href="#/result/' + d.id + '">View AI Result</a><a class="btn btn-ghost btn-block" href="#/home">Back to Home</a>';
      } else if (d.status === 'returned') {
        body =
          '<div style="display:flex;flex-direction:column;gap:6px"><h1 class="h1">IT needs a bit more information</h1><p class="sub">' + esc(M.deviceName(d)) + ' · ' + esc(d.id) + '</p></div>' +
          UI.notice('<b>Note from ' + esc(d.review.reviewerName) + ':</b> ' + esc(d.review.note || 'Please check the details and photo, then resubmit.'), 'warn', 'info') +
          timeline(d);
        actions = '<a class="btn btn-primary btn-block" href="#/register/' + d.id + '/details">Update &amp; Resubmit</a><a class="btn btn-ghost btn-block" href="#/devices">My Devices</a>';
      } else {
        const reuse = d.status === 'reuse';
        const dest = M.DESTINATIONS[d.destination] || M.DESTINATIONS.certified_disposal;
        body =
          '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding-top:4px">' +
            (reuse
              ? '<svg width="84" height="84" viewBox="0 0 140 160" aria-hidden="true"><path d="M70 156C68 112 74 70 98 30" stroke="#2E8B57" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M98 30C118 18 136 4 136 4s4 42-28 54c-14 5-22-6-10-28Z" fill="#2E8B57"/><path d="M78 96C50 96 22 76 16 52c24-6 54 2 62 28 2 8 2 16 0 16Z" fill="#8BC34A"/></svg>'
              : '<span style="width:76px;height:76px;border-radius:50%;background:var(--danger-bg);color:var(--danger-fg);display:flex;align-items:center;justify-content:center">' + icon('recycle', 36, 1.5) + '</span>') +
            '<h1 class="h1" style="font-size:26px">' + (reuse ? 'Great news! 🌱' : 'Recycled responsibly') + '</h1>' +
            '<p class="sub">' + (reuse ? 'Your device is going to a new home.' : 'Its materials will be recovered by a certified recycler.') + '</p>' +
          '</div>' +
          deviceCard(d) +
          '<section class="card" style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow" style="color:var(--text-2)">' + (reuse ? 'Destination' : 'Routed to') + '</span>' +
            '<div style="display:flex;align-items:center;gap:14px"><span class="icon-tile" style="background:var(--primary);color:#fff">' + icon(dest.icon, 22, 1.6) + '</span>' +
            '<span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:500">' + dest.label + '</span><span class="caption">' + dest.hint + '</span></span></div>' +
            (d.review && d.review.note ? '<p class="caption" style="padding:10px 12px;border-radius:10px;background:var(--bg);color:var(--text-3)">“' + esc(d.review.note) + '” — ' + esc(d.review.reviewerName) + '</p>' : '') +
          '</section>' +
          '<section class="hero" style="flex-direction:row;align-items:center;justify-content:space-between;padding:16px;border-radius:18px">' +
            '<span style="display:flex;align-items:center;gap:12px"><span class="icon-tile" style="background:#fff;color:var(--secondary);width:40px;height:40px">' + icon('leaf', 20) + '</span>' +
            '<span style="display:flex;flex-direction:column;gap:2px"><span class="caption" style="color:var(--text-3)">CO₂e saved</span><span style="font-size:18px;font-weight:600;color:var(--primary)">' + U.kg(d.co2Saved) + ' CO₂e</span></span></span>' +
            '<span class="pill ok">' + icon('shield', 14, 1.8) + 'Verified by IT</span>' +
          '</section>' +
          timeline(d);
        actions = '<a class="btn btn-primary btn-block" href="#/impact">View Impact' + icon('arrow', 18, 2) + '</a><a class="btn btn-ghost btn-block" href="#/devices">My Devices</a>';
      }

      return '<div class="screen"><div class="content" style="gap:18px">' +
        UI.topBar('#/devices', '', d.status === 'pending_it' ? UI.statusBadge(d.status) : '<span class="pill ' + (d.status === 'returned' ? 'warn' : 'ok') + '">' + icon('shield', 14, 1.8) + (d.status === 'returned' ? 'Review requested' : 'Verified · ' + U.formatDate(d.review && d.review.at)) + '</span>') +
        body + '</div><div class="footer-actions">' + actions + '</div></div>';
    }
  };
})();
