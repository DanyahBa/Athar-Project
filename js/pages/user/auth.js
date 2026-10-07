/* Screen 02 — Login / Sign up */
(function () {
  const U = Athar.util, icon = U.icon, esc = U.esc;

  Athar.pages.login = {
    route: '#/login', role: null, title: 'Sign in',
    render: function (ctx) {
      const signup = ctx.query.mode === 'signup';
      return '<div class="screen">' +
        U.leafSprig('top:-36px;left:-84px;opacity:.16;transform:rotate(-24deg)', 190, 220) +
        U.leafSprig('bottom:-50px;right:-70px;opacity:.14;transform:rotate(160deg)', 170, 200, ['#2E8B57', '#075B45', '#8BC34A']) +
        '<div class="content" style="padding-top:64px;position:relative">' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:18px">' +
            '<img src="assets/athar-mark.png" alt="أثر Athar" style="width:132px">' +
            '<div style="text-align:center;display:flex;flex-direction:column;gap:8px">' +
              '<h1 class="h1" style="font-size:26px">' + (signup ? 'Create your account' : 'Welcome to Athar') + '</h1>' +
              '<p class="sub" style="font-size:15px">Give your old device<br>a new impact.</p>' +
            '</div>' +
          '</div>' +
          '<form class="form" id="auth-form" novalidate>' +
            (signup ?
              '<div class="field"><label class="label" for="f-name">Full name</label><input class="input" id="f-name" name="name" autocomplete="name" required></div>' +
              '<div class="field"><label class="label" for="f-email">University email</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required></div>' +
              '<div class="field"><label class="label" for="f-uid">University ID <span class="opt">(optional)</span></label><input class="input" id="f-uid" name="universityId"></div>'
            :
              '<div class="field"><label class="label" for="f-login">Email / University ID</label>' +
              '<div class="input-wrap"><span style="color:var(--text-2)">' + icon('mail', 20, 1.6) + '</span><input id="f-login" name="login" autocomplete="username" value="2308249" required></div></div>') +
            '<div class="field"><label class="label" for="f-pass">Password</label>' +
              '<div class="input-wrap"><span style="color:var(--text-2)">' + icon('lock', 20, 1.6) + '</span><input id="f-pass" name="password" type="password" autocomplete="' + (signup ? 'new-password' : 'current-password') + '" value="' + (signup ? '' : 'athar123') + '" required>' +
              '<button type="button" class="icon-btn" style="border:0" data-action="toggle-pass" aria-label="Show password">' + icon('eye', 20, 1.6) + '</button></div></div>' +
            '<div id="auth-error" role="alert"></div>' +
            '<button class="btn btn-primary btn-block" type="submit">' + (signup ? 'Create Account' : 'Sign In') + '</button>' +
            (signup ? '' : '<p class="caption" style="text-align:center">Demo account: <b>2308249</b> / <b>athar123</b></p>') +
          '</form>' +
          '<div style="flex:1"></div>' +
          '<p class="sub" style="text-align:center">' + (signup ? 'Already have an account? <a href="#/login" style="font-weight:600;text-decoration:none">Sign in</a>' : 'Don’t have an account? <a href="#/login?mode=signup" style="font-weight:600;text-decoration:none">Sign up</a>') + '</p>' +
          '<p class="caption" style="text-align:center">IT staff? <a href="#/admin/login" style="font-weight:600;text-decoration:none">Open the IT portal</a></p>' +
        '</div></div>';
    },
    mount: function (ctx, root) {
      const signup = ctx.query.mode === 'signup';
      root.querySelector('[data-action="toggle-pass"]').addEventListener('click', function () {
        const p = root.querySelector('#f-pass');
        p.type = p.type === 'password' ? 'text' : 'password';
      });
      root.querySelector('#auth-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const f = new FormData(e.target);
        const err = root.querySelector('#auth-error');
        try {
          if (signup) {
            if (!f.get('name').trim() || !/\S+@\S+\.\S+/.test(f.get('email'))) throw new Error('Please enter your name and a valid email.');
            if (String(f.get('password')).length < 6) throw new Error('Password must be at least 6 characters.');
            const u = Athar.store.createUser({ name: f.get('name'), email: f.get('email'), universityId: f.get('universityId'), password: f.get('password') });
            Athar.store.setSession('user', u.id);
          } else {
            Athar.store.login(f.get('login'), f.get('password'), 'user');
          }
          Athar.router.go('#/home');
        } catch (ex) {
          err.innerHTML = '<p class="form-error">' + esc(ex.message) + '</p>';
        }
      });
    }
  };
})();
