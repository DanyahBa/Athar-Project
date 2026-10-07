/* Screens 04–06 — Register Device: type → details & condition → photo */
(function () {
  const U = Athar.util, UI = Athar.ui, M = Athar.model, S = Athar.store, icon = U.icon, esc = U.esc;

  // A device can be edited while it is a draft, or when IT sent it back.
  function editable(ctx) {
    const d = S.getDevice(ctx.params.id);
    if (!d || d.userId !== ctx.user.id) return null;
    return (d.status === 'draft' || d.status === 'returned') ? d : null;
  }
  function notFound() {
    return '<div class="screen"><div class="content">' + UI.topBar('#/devices') +
      UI.empty('This device can’t be edited', 'It may already be submitted for review.', '<a class="btn btn-primary btn-sm" href="#/devices">Go to My Devices</a>') + '</div></div>';
  }

  /* ---------- 04 Device type ---------- */
  Athar.pages.registerType = {
    route: '#/register', role: 'user', title: 'Register device',
    render: function (ctx) {
      const existing = ctx.query.id ? S.getDevice(ctx.query.id) : null;
      const picked = existing ? existing.type : (Athar.pages.registerType._picked || 'laptop');
      Athar.pages.registerType._picked = picked;
      return '<div class="screen"><div class="content" style="gap:24px">' +
        UI.topBar(existing ? '#/devices' : '#/home', UI.stepper(1)) +
        '<div style="display:flex;flex-direction:column;gap:6px"><h1 class="h1">What device are you donating?</h1><p class="sub">Select the device type.</p></div>' +
        '<div class="choice-grid" role="radiogroup" aria-label="Device type">' +
          M.DEVICE_TYPES.map(function (t) {
            return '<button type="button" class="choice' + (t.id === 'other' ? ' wide' : '') + '" role="radio" aria-checked="' + (t.id === picked) + '" data-type="' + t.id + '">' +
              '<span class="ic">' + icon(t.icon, 28, 1.5) + '</span>' +
              '<span style="display:flex;flex-direction:column;gap:2px"><span class="t">' + t.label + '</span><span class="d">' + t.hint + '</span></span>' +
              '<span class="check">' + icon('check', 13, 3) + '</span></button>';
          }).join('') +
        '</div></div>' +
        '<div class="footer-actions"><button class="btn btn-primary btn-block" type="button" data-action="continue">Continue' + icon('arrow', 18, 2) + '</button></div></div>';
    },
    mount: function (ctx, root) {
      root.querySelectorAll('[data-type]').forEach(function (b) {
        b.addEventListener('click', function () {
          Athar.pages.registerType._picked = b.dataset.type;
          root.querySelectorAll('[data-type]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        });
      });
      root.querySelector('[data-action="continue"]').addEventListener('click', function () {
        const type = Athar.pages.registerType._picked || 'laptop';
        let device = ctx.query.id ? S.getDevice(ctx.query.id) : null;
        if (device) S.updateDevice(device.id, { type: type });
        else device = S.createDevice(ctx.user.id, type);
        Athar.pages.registerType._picked = null;
        Athar.router.go('#/register/' + device.id + '/details');
      });
    }
  };

  /* ---------- 05 Device details + internal condition ---------- */
  Athar.pages.registerDetails = {
    route: '#/register/:id/details', role: 'user', title: 'Device details', noAutoRefresh: true,
    render: function (ctx) {
      const d = editable(ctx);
      if (!d) return notFound();
      const t = M.typeInfo(d.type);
      const year = new Date().getFullYear();
      let years = '<option value="">Select year</option>';
      for (let y = year; y >= year - 12; y--) years += '<option value="' + y + '"' + (d.year === y ? ' selected' : '') + '>' + y + (y === year ? ' (this year)' : '') + '</option>';
      years += '<option value="' + (year - 13) + '"' + (d.year && d.year <= year - 13 ? ' selected' : '') + '>' + (year - 13) + ' or older</option>';

      const questions = M.questionsFor(d.type).map(function (q) {
        const val = (d.conditionAnswers || {})[q.id];
        return '<div class="q-card" data-q="' + q.id + '"><span class="q" id="q-' + q.id + '">' + q.q + '</span>' +
          '<div class="seg" role="group" aria-labelledby="q-' + q.id + '">' + q.options.map(function (o) {
            return '<button type="button" data-value="' + o[0] + '" aria-pressed="' + (val === o[0]) + '">' + o[1] + '</button>';
          }).join('') + '</div></div>';
      }).join('');

      return '<div class="screen"><div class="content" style="gap:22px">' +
        UI.topBar('#/register?id=' + d.id, UI.stepper(2)) +
        (d.status === 'returned' && d.review ? UI.notice('<b>IT requested changes:</b> ' + esc(d.review.note || 'Please check the details and photo.'), 'warn') : '') +
        '<div style="display:flex;flex-direction:column;gap:6px"><h1 class="h1">Device details</h1><p class="sub">A few details help the AI assess your ' + t.label.toLowerCase() + ' accurately.</p></div>' +
        '<form class="form" id="details-form" novalidate>' +
          '<div class="grid-2">' +
            '<div class="field"><label class="label" for="f-brand">Brand</label><input class="input" id="f-brand" name="brand" value="' + esc(d.brand) + '" placeholder="e.g. Apple" required></div>' +
            '<div class="field"><label class="label" for="f-model">Model</label><input class="input" id="f-model" name="model" value="' + esc(d.model) + '" placeholder="e.g. MacBook Pro" required></div>' +
          '</div>' +
          '<div class="field"><label class="label" for="f-year">Year purchased</label><div class="select-wrap"><select class="input select" id="f-year" name="year" required>' + years + '</select>' + '<span style="color:var(--text-2)">' + icon('down', 18, 1.8).replace('<svg', '<svg style="position:absolute;right:16px;top:16px"') + '</span></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px"><h2 class="h2">Internal condition</h2><p class="caption">Quick questions the photo can’t answer.</p></div>' +
          questions +
          '<div id="details-error" role="alert"></div>' +
        '</form></div>' +
        '<div class="footer-actions"><button class="btn btn-primary btn-block" type="button" data-action="continue">Continue' + icon('arrow', 18, 2) + '</button></div></div>';
    },
    mount: function (ctx, root) {
      const d = editable(ctx);
      if (!d) return;
      const answers = Object.assign({}, d.conditionAnswers || {});
      root.querySelectorAll('[data-q]').forEach(function (card) {
        card.querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () {
            answers[card.dataset.q] = b.dataset.value;
            root.querySelector('#details-error').innerHTML = '';
            card.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          });
        });
      });
      root.querySelector('[data-action="continue"]').addEventListener('click', function () {
        const form = root.querySelector('#details-form');
        const brand = form.brand.value.trim(), model = form.model.value.trim(), year = parseInt(form.year.value, 10);
        const missing = M.questionsFor(d.type).filter(function (q) { return !answers[q.id]; });
        const err = root.querySelector('#details-error');
        if (!brand || !model || !year) { err.innerHTML = '<p class="form-error">Please add the brand, model and year.</p>'; return; }
        if (missing.length) { err.innerHTML = '<p class="form-error">Please answer: ' + esc(missing.map(function (q) { return q.q; }).join(' · ')) + '</p>'; return; }
        // Keep only answers for questions that apply to this device type.
        const clean = {};
        M.questionsFor(d.type).forEach(function (q) { clean[q.id] = answers[q.id]; });
        S.updateDevice(d.id, { brand: brand, model: model, year: year, conditionAnswers: clean });
        Athar.router.go('#/register/' + d.id + '/photo');
      });
    }
  };

  /* ---------- 06 Photo (camera / gallery) ---------- */
  Athar.pages.registerPhoto = {
    route: '#/register/:id/photo', role: 'user', title: 'Device photo', noAutoRefresh: true,
    render: function (ctx) {
      const d = editable(ctx);
      if (!d) return notFound();
      return '<div class="screen"><div class="content" style="gap:20px">' +
        UI.topBar('#/register/' + d.id + '/details', UI.stepper(3)) +
        '<div style="display:flex;flex-direction:column;gap:6px"><h1 class="h1">AI Device Assessment</h1><p class="sub">Take a photo of your device.</p></div>' +
        '<div class="viewfinder" id="vf">' +
          '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
          '<div id="vf-content"></div>' +
        '</div>' +
        '<ul class="chips" style="list-style:none;margin:0;padding:0" aria-label="Photo tips">' +
          ['Good lighting', 'Whole device visible', 'Show any damage'].map(function (t) { return '<li class="tip"><span style="color:var(--secondary)">' + icon('check', 14, 2.2) + '</span>' + t + '</li>'; }).join('') +
        '</ul>' +
        '<div id="photo-error" role="alert"></div>' +
        '<input type="file" id="in-camera" accept="image/*" capture="environment" hidden>' +
        '<input type="file" id="in-gallery" accept="image/*" hidden>' +
        '</div>' +
        '<div class="footer-actions" id="photo-actions"></div></div>';
    },
    mount: function (ctx, root) {
      const d = editable(ctx);
      if (!d) return;
      let image = d.image;
      const vf = root.querySelector('#vf-content'), actions = root.querySelector('#photo-actions'), err = root.querySelector('#photo-error');

      function paint() {
        vf.innerHTML = image
          ? '<img src="' + image + '" alt="Your device photo"><span class="vf-hint">' + icon('check', 14, 2.2) + 'Photo ready</span>'
          : '<span class="scanline"></span><svg width="200" height="140" viewBox="0 0 200 140" aria-hidden="true"><rect x="34" y="14" width="132" height="88" rx="8" fill="#fff" stroke="#075B45" stroke-width="2.5"/><rect x="44" y="24" width="112" height="68" rx="3" fill="#F2F7F0"/><path d="M16 112h168l-10 12H26z" fill="#fff" stroke="#075B45" stroke-width="2.5" stroke-linejoin="round"/><path d="M108 50c-14 2-20 12-18 26 12-1 20-10 18-26z" fill="#8BC34A" opacity=".7"/></svg>' +
            '<span class="vf-hint">' + icon('sparkle', 14, 1.8) + 'Center the whole device in the frame</span>';
        actions.innerHTML = image
          ? '<button class="btn btn-primary btn-block" type="button" data-action="assess">' + icon('sparkle', 18, 1.8) + 'Start AI Assessment</button>' +
            '<button class="btn btn-secondary btn-block" type="button" data-action="gallery">' + icon('image', 20, 1.6) + 'Choose a different photo</button>'
          : '<button class="btn btn-primary btn-block" type="button" data-action="camera">' + icon('camera', 20, 1.8) + 'Scan Device</button>' +
            '<button class="btn btn-secondary btn-block" type="button" data-action="gallery">' + icon('image', 20, 1.6) + 'Upload from Gallery</button>';
        bind();
      }
      function bind() {
        const cam = actions.querySelector('[data-action="camera"]'), gal = actions.querySelector('[data-action="gallery"]'), go = actions.querySelector('[data-action="assess"]');
        if (cam) cam.addEventListener('click', function () { root.querySelector('#in-camera').click(); });
        if (gal) gal.addEventListener('click', function () { root.querySelector('#in-gallery').click(); });
        if (go) go.addEventListener('click', function () {
          S.setStatus(d.id, 'assessing', ctx.user.id, '', { image: image, assessment: null, aiCondition: null, aiRecommendation: null });
          Athar.router.go('#/assess/' + d.id);
        });
      }
      function onFile(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        err.innerHTML = '';
        U.compressImage(file).then(function (dataUrl) {
          image = dataUrl;
          S.updateDevice(d.id, { image: dataUrl });
          paint();
        }).catch(function (ex) { err.innerHTML = '<p class="form-error">' + esc(ex.message) + '</p>'; });
        e.target.value = '';
      }
      root.querySelector('#in-camera').addEventListener('change', onFile);
      root.querySelector('#in-gallery').addEventListener('change', onFile);
      paint();
    }
  };
})();
