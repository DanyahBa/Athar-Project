/* IT / Admin — Review Device: AI result → expert decision → reuse/dispose → destination */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  // Saves the IT decision. Kept separate from the UI so it can move to a backend later.
  function saveDecision(device, admin, form) {
    const review = { reviewerId: admin.id, reviewerName: admin.name, action: form.decision === 'approve' ? 'approved' : 'returned', note: form.note.trim(), at: new Date().toISOString() };
    if (form.decision === 'reject') {
      return S.setStatus(device.id, 'returned', admin.id, review.note, { review: review });
    }
    const route = form.route; // 'reuse' | 'dispose'
    const destination = route === 'reuse' ? form.destination : 'certified_disposal';
    const co2 = Athar.impact.estimate(device.type, device.aiCondition, route);
    S.setStatus(device.id, 'approved', admin.id, review.note, { review: review });
    return S.setStatus(device.id, route, admin.id, M.DESTINATIONS[destination].label, { adminDecision: route, destination: destination, co2Saved: co2 });
  }

  Athar.pages.adminReview = {
    route: '#/admin/review/:id', role: 'admin', area: 'admin', title: 'Review device', noAutoRefresh: true,
    render: function (ctx) {
      const d = S.getDevice(ctx.params.id);
      if (!d) return UI.adminShell('pending', ctx.admin, UI.empty('Device not found', '', '<a class="btn btn-primary btn-sm" href="#/admin/reviews">Back to reviews</a>'));
      const a = d.assessment || {};
      const owner = S.getUser(d.userId) || { name: 'Unknown' };
      const t = M.typeInfo(d.type);
      const isPending = d.status === 'pending_it';
      const decided = d.status === 'reuse' || d.status === 'dispose';
      const H = Athar.adminHelpers;

      const answers = M.questionsFor(d.type).map(function (q) {
        const v = (d.conditionAnswers || {})[q.id];
        // First option = no problem, last option = most serious.
        const idx = q.options.findIndex(function (o) { return o[0] === v; });
        const bad = idx === q.options.length - 1 && q.options.length > 2, meh = idx > 0 && !bad;
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #EEF2EC;font-size:14px"><span style="color:var(--text-2)">' + q.q + '</span>' +
          '<span style="font-weight:500;white-space:nowrap;color:' + (bad ? 'var(--danger-fg)' : meh ? 'var(--warn-fg)' : 'var(--ok-fg)') + '">' + M.answerLabel(q.id, v) + '</span></div>';
      }).join('');

      const process = '<ol class="process" aria-label="Decision process">' +
        '<li class="done"><span class="n">' + icon('check', 12, 3) + '</span>AI Assessment</li><li class="bar done"></li>' +
        '<li class="' + (isPending ? 'now' : 'done') + '"><span class="n">' + (isPending ? '2' : icon('check', 12, 3)) + '</span>Expert Decision' + (isPending ? ' <span class="badge badge--neutral" style="height:22px">You</span>' : '') + '</li><li class="bar ' + (decided ? 'done' : '') + '"></li>' +
        '<li class="' + (decided ? 'done' : '') + '"><span class="n">' + (decided ? icon('check', 12, 3) : '3') + '</span>Reuse / Dispose</li></ol>';

      let decisionPanel;
      if (isPending) {
        const defRoute = a.recommendation === 'Dispose' ? 'dispose' : 'reuse';
        decisionPanel =
          '<section class="card decide" style="padding:20px;display:flex;flex-direction:column;gap:16px" id="decision">' +
            '<div style="display:flex;flex-direction:column;gap:4px"><h2 class="h2" style="display:flex;align-items:center;gap:8px"><span style="color:var(--primary)">' + icon('shield', 20, 1.8) + '</span>Expert Decision</h2><span class="caption" style="font-size:13px">Your decision is final and overrides the AI recommendation.</span></div>' +
            '<div class="decision-btns" role="group" aria-label="Decision">' +
              '<button type="button" class="dbtn approve" data-decision="approve" aria-pressed="true">' + icon('check', 18, 2) + 'Approve</button>' +
              '<button type="button" class="dbtn reject" data-decision="reject" aria-pressed="false">' + icon('refresh', 18, 1.8) + 'Reject / Request Review</button>' +
            '</div>' +
            '<div id="route-block" style="display:flex;flex-direction:column;gap:12px">' +
              '<span class="label">Final route <span class="opt">(AI suggested ' + esc(a.recommendation || '—') + ')</span></span>' +
              '<div class="decision-btns" role="group" aria-label="Route">' +
                '<button type="button" class="dbtn reuse" data-route="reuse" aria-pressed="' + (defRoute === 'reuse') + '">' + icon('recycle', 18, 1.7) + 'Reuse</button>' +
                '<button type="button" class="dbtn dispose" data-route="dispose" aria-pressed="' + (defRoute === 'dispose') + '">' + icon('factory', 18, 1.7) + 'Dispose</button>' +
              '</div>' +
              '<div id="dest-block" style="display:flex;flex-direction:column;gap:10px">' +
                '<span class="label">Destination</span>' +
                ['student', 'department', 'charity'].map(function (k) {
                  const x = M.DESTINATIONS[k];
                  return '<button type="button" class="option-row" role="radio" aria-checked="false" data-dest="' + k + '"><span class="ic">' + icon(x.icon, 22, 1.6) + '</span><span style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:500">' + x.label + '</span><span class="caption">' + x.hint + '</span></span><span class="radio"></span></button>';
                }).join('') +
              '</div>' +
              '<div id="dispose-block" style="display:none">' +
                '<div class="option-row" aria-checked="true" style="cursor:default"><span class="ic">' + icon('factory', 22, 1.6) + '</span><span style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:500">Certified E-Waste Disposal</span><span class="caption">Licensed recycler · materials recovered</span></span><span class="badge badge--reuse">' + icon('shield', 12, 2) + 'Certified</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="field"><label class="label" for="r-note">Verification note <span class="opt" id="note-opt">(optional, saved to the record)</span></label>' +
              '<textarea class="textarea" id="r-note" rows="3" placeholder="e.g. Inspected in person — dent is cosmetic."></textarea></div>' +
            '<div id="review-error" role="alert"></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
              '<span class="caption" style="font-size:13px" id="summary-line"></span>' +
              '<button type="button" class="btn btn-primary" data-action="confirm">Confirm Decision</button>' +
            '</div>' +
          '</section>';
      } else {
        const dest = d.destination ? M.DESTINATIONS[d.destination] : null;
        decisionPanel =
          '<section class="card" style="padding:20px;display:flex;flex-direction:column;gap:14px">' +
            '<h2 class="h2">Expert Decision</h2>' +
            '<dl class="kv"><dt>Status</dt><dd>' + UI.statusBadge(d.status) + '</dd>' +
            (d.review ? '<dt>Reviewed by</dt><dd>' + esc(d.review.reviewerName) + ' · ' + U.formatDate(d.review.at, true) + '</dd>' : '') +
            (dest ? '<dt>Destination</dt><dd>' + dest.label + '</dd>' : '') +
            (decided ? '<dt>CO₂e saved</dt><dd style="color:var(--ok-fg)">' + U.kg(d.co2Saved) + '</dd>' : '') +
            (d.review && d.review.note ? '<dt>Note</dt><dd>' + esc(d.review.note) + '</dd>' : '') + '</dl>' +
            (d.status === 'returned' ? UI.notice('Waiting for the donor to update and resubmit this device.', 'warn') : '') +
            '<a class="btn btn-secondary" href="#/admin/reviews">Back to reviews</a>' +
          '</section>';
      }

      const content =
        '<nav aria-label="Breadcrumb" style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2)"><a href="#/admin/reviews" style="text-decoration:none;font-weight:500">Pending Reviews</a>' + icon('chevron', 14, 2) + '<span>' + esc(d.id) + '</span></nav>' +
        '<header class="page-head" style="align-items:center"><div style="display:flex;align-items:center;gap:14px"><a class="icon-btn" href="#/admin/reviews" aria-label="Back to reviews">' + icon('back', 20, 1.8) + '</a>' +
          '<div style="display:flex;flex-direction:column;gap:2px"><h1>Review Device</h1><span class="sub">' + esc(M.deviceName(d)) + ' · submitted ' + U.formatDate(d.updatedAt, true) + '</span></div></div>' + UI.statusBadge(d.status) + '</header>' +
        process +
        '<div class="two-col">' +
          '<div>' +
            '<section class="card" style="display:flex;flex-direction:column;gap:12px"><div class="photo-box">' + (d.image ? '<img src="' + d.image + '" alt="Donor photo of the device">' : '<span style="display:flex;flex-direction:column;align-items:center;gap:8px">' + icon(t.icon, 64, 1.2) + '<span class="caption">No photo uploaded (demo record)</span></span>') + '</div></section>' +
            '<section class="card" style="padding:20px;display:flex;flex-direction:column;gap:14px"><h2 class="h2">Device information</h2>' +
              '<dl class="kv" style="font-size:14px"><dt>Donor</dt><dd>' + esc(owner.name) + '</dd><dt>Type</dt><dd>' + t.label + '</dd><dt>Brand / model</dt><dd>' + esc(M.deviceName(d)) + '</dd><dt>Year</dt><dd>' + (d.year || '—') + '</dd><dt>Tracking ID</dt><dd>' + esc(d.id) + '</dd></dl></section>' +
            '<section class="card" style="padding:20px;display:flex;flex-direction:column;gap:4px"><h2 class="h2" style="margin-bottom:8px">Internal condition (donor answers)</h2>' + answers + '</section>' +
          '</div>' +
          '<div>' +
            '<section class="panel" aria-label="AI assessment" style="border-color:var(--info-line)">' +
              '<div class="ai-head"><span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--info-fg)">' + icon('sparkle', 18, 1.8) + 'AI Assessment</span><span class="caption" style="color:#2A659E">Advisory only · ' + U.formatDate(a.at, true) + '</span></div>' +
              '<div class="panel-body">' +
                '<dl class="kv" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 20px;font-size:14px">' +
                  '<div><dt class="caption">Condition</dt><dd style="text-align:left">' + H.condText(a.condition) + '</dd></div>' +
                  '<div><dt class="caption">Recommended action</dt><dd style="text-align:left;margin-top:4px">' + UI.recBadge(a.recommendation) + '</dd></div>' +
                  '<div><dt class="caption">Estimated CO₂e</dt><dd style="text-align:left;font-weight:600">' + U.kg(a.co2Estimate) + '</dd></div>' +
                  '<div><dt class="caption">Model confidence</dt><dd style="text-align:left;font-weight:600">' + Math.round((a.confidence || 0) * 100) + '%</dd></div>' +
                '</dl>' +
                '<div style="display:flex;flex-direction:column;gap:8px"><span class="caption">What the AI considered</span><div class="chips">' + (a.reasons || []).map(function (r) { return '<span class="badge badge--neutral" style="height:28px;font-size:12px">' + esc(r) + '</span>'; }).join('') + '</div></div>' +
              '</div></section>' +
            decisionPanel +
          '</div>' +
        '</div>' +
        '<div id="modal-root"></div>';
      return UI.adminShell('pending', ctx.admin, content);
    },

    mount: function (ctx, root) {
      Athar.adminHelpers.bindShell(root);
      const d = S.getDevice(ctx.params.id);
      if (!d || d.status !== 'pending_it') return;
      const state = { decision: 'approve', route: (d.aiRecommendation === 'Dispose' ? 'dispose' : 'reuse'), destination: null };
      const $ = function (s) { return root.querySelector(s); };

      function paint() {
        root.querySelectorAll('[data-decision]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.decision === state.decision)); });
        root.querySelectorAll('[data-route]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.route === state.route)); });
        root.querySelectorAll('[data-dest]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.dest === state.destination)); });
        $('#route-block').style.display = state.decision === 'approve' ? 'flex' : 'none';
        $('#dest-block').style.display = state.route === 'reuse' ? 'flex' : 'none';
        $('#dispose-block').style.display = state.route === 'dispose' ? 'block' : 'none';
        $('#note-opt').textContent = state.decision === 'reject' ? '(required — tell the donor what to fix)' : '(optional, saved to the record)';
        const finalLabel = state.decision === 'reject' ? 'Review requested' : state.route === 'reuse' ? 'Reuse' + (state.destination ? ' → ' + M.DESTINATIONS[state.destination].label : '') : 'Dispose → Certified E-Waste Disposal';
        $('#summary-line').innerHTML = 'AI: <b style="color:var(--ok-fg)">' + esc(d.aiRecommendation || '—') + '</b> → Final: <b>' + esc(finalLabel) + '</b>';
        $('#review-error').innerHTML = '';
      }
      root.querySelectorAll('[data-decision]').forEach(function (b) { b.addEventListener('click', function () { state.decision = b.dataset.decision; paint(); }); });
      root.querySelectorAll('[data-route]').forEach(function (b) { b.addEventListener('click', function () { state.route = b.dataset.route; paint(); }); });
      root.querySelectorAll('[data-dest]').forEach(function (b) { b.addEventListener('click', function () { state.destination = b.dataset.dest; paint(); }); });

      $('[data-action="confirm"]').addEventListener('click', function () {
        const note = $('#r-note').value;
        if (state.decision === 'approve' && state.route === 'reuse' && !state.destination) { $('#review-error').innerHTML = '<p class="form-error">Choose a destination for the reused device.</p>'; return; }
        if (state.decision === 'reject' && !note.trim()) { $('#review-error').innerHTML = '<p class="form-error">Add a note so the donor knows what to fix.</p>'; return; }
        const label = state.decision === 'reject' ? 'Request review' : state.route === 'reuse' ? 'Reuse → ' + M.DESTINATIONS[state.destination].label : 'Dispose → Certified E-Waste Disposal';
        const co2 = state.decision === 'approve' ? Athar.impact.estimate(d.type, d.aiCondition, state.route) : null;
        $('#modal-root').innerHTML =
          '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">' +
            '<span class="icon-tile" style="background:var(--tint)">' + icon('shield', 24, 1.8) + '</span>' +
            '<div style="display:flex;flex-direction:column;gap:6px"><h2 id="m-title" style="font-size:20px;font-weight:600">Confirm final decision</h2><p class="sub">' + (state.decision === 'reject' ? 'The device goes back to the donor with your note.' : 'This replaces the AI recommendation as the verified decision. The donor’s dashboard updates immediately.') + '</p></div>' +
            '<dl class="kv" style="padding:14px;border-radius:12px;background:var(--bg)"><dt>AI recommendation</dt><dd>' + esc(d.aiRecommendation) + ' · ' + Math.round((d.assessment.confidence || 0) * 100) + '%</dd><dt>Expert decision</dt><dd style="color:var(--primary);font-weight:600">' + esc(label) + '</dd>' + (co2 != null ? '<dt>CO₂e saved</dt><dd>' + U.kg(co2) + '</dd>' : '') + '<dt>Verified by</dt><dd>' + esc(ctx.admin.name) + '</dd></dl>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button><button type="button" class="btn btn-primary" data-action="save">Confirm' + icon('arrow', 16, 2) + '</button></div>' +
          '</div></div>';
        $('[data-action="cancel"]').addEventListener('click', function () { $('#modal-root').innerHTML = ''; });
        $('[data-action="save"]').addEventListener('click', function () {
          saveDecision(d, ctx.admin, { decision: state.decision, route: state.route, destination: state.destination, note: note });
          U.toast(state.decision === 'reject' ? 'Sent back to the donor' : 'Decision saved · ' + label);
          Athar.router.go('#/admin');
        });
        $('[data-action="save"]').focus();
      });
      paint();
    }
  };
})();
