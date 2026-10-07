/* Screens 07–08 — AI Analysis (loading) and AI Result */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  function ownDevice(ctx) {
    const d = S.getDevice(ctx.params.id);
    return d && d.userId === ctx.user.id ? d : null;
  }

  /* ---------- 07 AI Analysis ---------- */
  Athar.pages.assess = {
    route: '#/assess/:id', role: 'user', title: 'Analyzing', noAutoRefresh: true,
    render: function (ctx) {
      const d = ownDevice(ctx);
      if (!d) return '<div class="screen"><div class="content">' + UI.empty('Device not found', '', '<a class="btn btn-primary btn-sm" href="#/devices">My Devices</a>') + '</div></div>';
      return '<div class="screen">' +
        U.leafSprig('bottom:-60px;right:-70px;opacity:.14;transform:rotate(150deg)', 220, 250) +
        '<div class="content" style="align-items:stretch;gap:28px;position:relative">' +
          '<div class="topbar"><a href="#/register/' + d.id + '/photo" style="height:44px;display:flex;align-items:center;font-size:14px;font-weight:500;text-decoration:none" id="cancel-link">Cancel</a>' +
          '<span class="pill info">' + icon('sparkle', 14, 1.8) + 'Athar AI</span></div>' +
          '<div class="ring-wrap">' +
            '<svg class="ring" width="220" height="220" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="96" fill="none" stroke="#E3ECE0" stroke-width="10"/>' +
            '<circle id="ring" cx="110" cy="110" r="96" fill="none" stroke="#075B45" stroke-width="10" stroke-linecap="round" stroke-dasharray="603" stroke-dashoffset="560" transform="rotate(-90 110 110)" style="transition:stroke-dashoffset .9s ease"/></svg>' +
            '<svg class="orbit" width="220" height="220" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="10" r="5" fill="#8BC34A"/></svg>' +
            '<div class="ring-core"><span style="color:var(--secondary);animation:breathe 2.4s ease-in-out infinite">' + icon('leaf', 44, 1.5) + '</span><span class="pct" id="pct">5%</span></div>' +
          '</div>' +
          '<div style="text-align:center;display:flex;flex-direction:column;gap:6px"><h1 class="h1" style="font-size:22px" id="heading" aria-live="polite">Analyzing your device...</h1><p class="sub">' + esc(M.deviceName(d)) + ' · photo and condition answers</p></div>' +
          '<ol class="steps" id="steps">' + Athar.ai.STEPS.map(function (s) { return '<li><span class="s-ico"></span><span>' + s + '</span></li>'; }).join('') + '</ol>' +
        '</div>' +
        '<div class="footer-actions" id="assess-actions"><p class="sub" style="height:52px;display:flex;align-items:center;justify-content:center;font-size:13px">This usually takes a few seconds</p></div></div>';
    },
    mount: function (ctx, root) {
      const d = ownDevice(ctx);
      if (!d) return;
      const items = root.querySelectorAll('#steps li');
      const pctEl = root.querySelector('#pct'), ring = root.querySelector('#ring'), heading = root.querySelector('#heading');
      const pcts = [12, 45, 78, 100];
      let alive = true;
      Athar.pages.assess.unmount = function () { alive = false; };

      function showStep(i) {
        if (!alive) return;
        items.forEach(function (li, k) {
          li.className = k < i ? 'done' : k === i ? 'active' : '';
          li.querySelector('.s-ico').innerHTML = k < i ? icon('check', 14, 3) : '';
        });
        pctEl.textContent = pcts[Math.min(i, 3)] + '%';
        ring.setAttribute('stroke-dashoffset', String(Math.round(603 * (1 - pcts[Math.min(i, 3)] / 100))));
        if (i >= items.length) heading.textContent = 'Assessment complete';
      }
      function done() {
        root.querySelector('#cancel-link').style.visibility = 'hidden';
        root.querySelector('#assess-actions').innerHTML = '<a class="btn btn-primary btn-block" href="#/result/' + d.id + '">View Result' + icon('arrow', 18, 2) + '</a>';
      }

      // Already assessed (e.g. page reopened) → just show the finished state.
      if (d.assessment) { showStep(items.length); done(); return; }
      if (d.status !== 'assessing') S.setStatus(d.id, 'assessing', ctx.user.id);

      Athar.ai.assess(d, showStep).then(function (result) {
        S.updateDevice(d.id, { assessment: result, aiCondition: result.condition, aiRecommendation: result.recommendation });
        if (alive) done();
      }).catch(function (ex) {
        if (!alive) return;
        heading.textContent = 'Assessment failed';
        root.querySelector('#assess-actions').innerHTML = '<p class="form-error">' + esc(ex.message) + '</p><a class="btn btn-primary btn-block" href="#/assess/' + d.id + '" onclick="location.reload()">Try again</a>';
      });
    }
  };

  /* ---------- 08 AI Result ---------- */
  Athar.pages.result = {
    route: '#/result/:id', role: 'user', title: 'AI result',
    render: function (ctx) {
      const d = ownDevice(ctx);
      if (!d || !d.assessment) return '<div class="screen"><div class="content">' + UI.topBar('#/devices') + UI.empty('No assessment yet', 'Run the AI assessment first.', d ? '<a class="btn btn-primary btn-sm" href="#/register/' + d.id + '/photo">Continue</a>' : '') + '</div></div>';
      const a = d.assessment, reuse = a.recommendation === 'Reuse';
      const submitted = d.status !== 'assessing';
      const bars = { Good: 3, Fair: 2, Poor: 1 }[a.condition] || 0;
      const condColor = { Good: 'var(--ok-fg)', Fair: 'var(--warn-fg)', Poor: 'var(--danger-fg)' }[a.condition];
      const t = M.typeInfo(d.type);

      return '<div class="screen"><div class="content" style="gap:16px">' +
        UI.topBar(submitted ? '#/device/' + d.id : '#/devices', '', '<span class="pill info">' + icon('sparkle', 14, 1.8) + 'AI assessment · not final</span>') +
        '<h1 class="h1">Your device has been assessed</h1>' +
        '<section class="card" style="display:flex;gap:16px;align-items:center">' +
          '<span class="icon-tile" style="width:92px;height:76px">' + (d.image ? '<img src="' + d.image + '" alt="">' : icon(t.icon, 36, 1.4)) + '</span>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:8px">' +
            '<span style="display:flex;flex-direction:column;gap:2px"><span class="caption">' + t.label + '</span><span style="font-size:16px;font-weight:600">' + esc(M.deviceName(d)) + '</span></span>' +
            '<span style="display:flex;justify-content:space-between;font-size:12px"><span class="caption">Condition</span><span style="font-weight:600;color:' + condColor + '">' + a.condition + '</span></span>' +
            '<span class="meter" aria-hidden="true">' + [1, 2, 3, 4].map(function (i) { return '<span class="' + (i <= bars ? 'on' : '') + '"></span>'; }).join('') + '</span>' +
          '</div>' +
        '</section>' +
        '<section class="rec-card' + (reuse ? '' : ' dispose') + '" aria-label="AI recommendation">' +
          U.leafSprig('right:-40px;top:-20px;opacity:.16', 170, 190, ['#8BC34A', '#8BC34A', '#FFFFFF']) +
          '<span class="eyebrow" style="position:relative;display:inline-flex;align-items:center;gap:6px;color:' + (reuse ? '#CFE7D8' : '#F6DCD7') + '">' + icon('sparkle', 14, 1.8) + 'AI Recommendation</span>' +
          '<div style="position:relative;display:flex;align-items:center;gap:14px">' +
            '<span style="width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;color:' + (reuse ? '#C9E6A8' : '#FBD9D3') + '">' + icon(reuse ? 'recycle' : 'factory', 28, 1.6) + '</span>' +
            '<span style="display:flex;flex-direction:column;gap:4px"><span class="big">' + a.recommendation.toUpperCase() + '</span><span class="soft">' + (reuse ? 'This device may still be suitable for reuse.' : 'This device is best sent for certified recycling.') + '</span></span>' +
          '</div>' +
          '<div class="soft" style="position:relative;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,.16);font-size:12px">' +
            '<span>AI confidence</span><span style="display:flex;align-items:center;gap:8px"><span style="width:80px;height:5px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden;display:block"><span style="display:block;height:5px;background:#8BC34A;width:' + Math.round(a.confidence * 100) + '%"></span></span><b style="color:#fff">' + Math.round(a.confidence * 100) + '%</b></span>' +
          '</div>' +
        '</section>' +
        '<section class="card" style="display:flex;align-items:center;gap:14px">' +
          '<span class="icon-tile" style="background:#E9F4E1;color:var(--secondary);width:48px;height:48px">' + icon('leaf', 24, 1.6) + '</span>' +
          '<span style="display:flex;flex-direction:column;gap:2px"><span class="caption">Estimated Impact</span><span style="font-size:22px;font-weight:600">' + U.kg(a.co2Estimate) + ' <span style="font-size:14px;font-weight:500">CO₂e</span></span><span class="caption" style="color:var(--text-3)">Potential carbon emissions avoided</span></span>' +
        '</section>' +
        '<section class="card" style="display:flex;flex-direction:column;gap:10px"><span class="caption">What the AI considered</span>' +
          '<div class="chips">' + a.reasons.map(function (r) { return '<span class="badge badge--neutral" style="height:28px;font-size:12px">' + esc(r) + '</span>'; }).join('') + '</div>' +
          '<span class="caption" style="font-size:11px">Model: ' + esc(a.model) + '</span>' +
        '</section>' +
        UI.notice('This is an AI recommendation. An IT specialist will verify it before the final decision is made.', '', 'shield') +
        '</div>' +
        '<div class="footer-actions">' +
          (submitted
            ? '<a class="btn btn-primary btn-block" href="#/device/' + d.id + '">View Device Status</a>'
            : '<button class="btn btn-primary btn-block" type="button" data-action="submit">Submit for IT Verification</button>' +
              '<a class="btn btn-ghost btn-block" href="#/register/' + d.id + '/details" data-action="edit">Edit details</a>') +
        '</div></div>';
    },
    mount: function (ctx, root) {
      const btn = root.querySelector('[data-action="submit"]');
      if (btn) btn.addEventListener('click', function () {
        S.setStatus(ctx.params.id, 'pending_it', ctx.user.id);
        U.toast('Submitted for IT verification');
        Athar.router.go('#/device/' + ctx.params.id);
      });
      const edit = root.querySelector('[data-action="edit"]');
      if (edit) edit.addEventListener('click', function (e) {
        e.preventDefault();
        S.setStatus(ctx.params.id, 'draft', ctx.user.id, 'Edited before submitting');
        Athar.router.go('#/register/' + ctx.params.id + '/details');
      });
    }
  };
})();
