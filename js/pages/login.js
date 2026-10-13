/* ============================================================
   BizDocs AI — Login page (professional split layout)
   ============================================================ */

var PageLogin = (function () {

  var _pwVisible = false;

  function render() {
    document.getElementById('app').innerHTML = '<div id="page-root"></div>';
    document.getElementById('page-root').innerHTML = _html();
    _bind();
  }

  function _html() {
    return '<div class="auth-split">' +

      /* ======== LEFT PANEL ======== */
      '<div class="auth-split__left">' +
        '<div class="auth-split__left-inner">' +

          /* Brand */
          '<div class="auth-split__brand">' +
            '<img src="assets/logo.svg" width="44" height="44" alt="BizDocs AI"/>' +
            '<div>' +
              '<div class="auth-split__brand-name">BizDocs AI</div>' +
              '<div class="auth-split__brand-tag">Smart Documents. Faster Business.</div>' +
            '</div>' +
          '</div>' +

          /* Hero headline */
          '<div class="auth-split__headline">' +
            'Powering small<br>businesses with<br>' +
            '<span class="auth-split__headline-accent">smart document tools.</span>' +
          '</div>' +

          /* Feature list */
          '<div class="auth-split__features">' +
            _feature(_iDoc(),     'Professional Documents',  'Quotations, invoices and letters in seconds.') +
            _feature(_iCalc(),    'Auto GST Calculations',   'Subtotals, tax and totals — always accurate.') +
            _feature(_iPdf(),     'One-click PDF Export',    'Branded A4 output ready to send.') +
            _feature(_iOffline(), 'Works Offline',           'Full demo without any internet connection.') +
          '</div>' +

        '</div>' +
      '</div>' +

      /* ======== RIGHT PANEL ======== */
      '<div class="auth-split__right">' +

        /* Dot grid decoration */
        '<div class="auth-split__dots" aria-hidden="true">' + _dotGrid() + '</div>' +

        '<div class="auth-split__form-wrap">' +

          '<h2 class="auth-split__form-title">Sign In</h2>' +
          '<p class="auth-split__form-sub">Enter your details to access BizDocs AI</p>' +

          /* Demo hint */
          '<div class="auth__demo-hint">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
              '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="flex-shrink:0">' +
                '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>' +
              '</svg>' +
              '<strong>Demo account</strong>' +
            '</div>' +
            '<div style="padding-left:22px;font-size:12px;line-height:1.9">' +
              'Email &nbsp;&nbsp; : demo@bizdocs.ai<br>' +
              'Password : demo123' +
            '</div>' +
          '</div>' +

          /* Email field */
          '<div class="form-group">' +
            '<label class="form-label required" for="login-email">Email</label>' +
            '<div class="input-icon-wrap">' +
              '<span class="input-icon input-icon--left">' + _iMail() + '</span>' +
              '<input id="login-email" type="email" class="form-control input-with-icon-left" ' +
                'value="demo@bizdocs.ai" placeholder="Enter your email address" autocomplete="username"/>' +
            '</div>' +
            '<div class="form-error" id="err-email"></div>' +
          '</div>' +

          /* Password field */
          '<div class="form-group">' +
            '<label class="form-label required" for="login-password">Password</label>' +
            '<div class="input-icon-wrap">' +
              '<span class="input-icon input-icon--left">' + _iLock() + '</span>' +
              '<input id="login-password" type="password" class="form-control input-with-icon-left input-with-icon-right" ' +
                'value="demo123" placeholder="Enter your password" autocomplete="current-password"/>' +
              '<button type="button" class="input-icon input-icon--right input-icon--btn" id="toggle-pw" title="Show/hide password">' +
                _iEyeOff() +
              '</button>' +
            '</div>' +
            '<div class="form-error" id="err-password"></div>' +
          '</div>' +

          '<div class="form-error" id="err-general" style="margin-bottom:10px"></div>' +

          /* Submit */
          '<button class="btn btn-primary auth-split__submit" id="login-btn">' +
            _iArrow() + ' Sign In' +
          '</button>' +

          '<p class="auth-split__disclaimer">' +
            'Demo login only &mdash; not for production use.' +
          '</p>' +

        '</div>' +
      '</div>' +

    '</div>';
  }

  /* ---- Dot grid SVG ---- */
  function _dotGrid() {
    var dots = '';
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 10; c++) {
        dots += '<circle cx="' + (c * 22 + 11) + '" cy="' + (r * 22 + 11) + '" r="1.8" fill="#CBD5E1" opacity=".6"/>';
      }
    }
    return '<svg viewBox="0 0 220 176" xmlns="http://www.w3.org/2000/svg" ' +
           'style="width:220px;height:176px">' + dots + '</svg>';
  }

  /* ---- Feature row ---- */
  function _feature(icon, title, sub) {
    return '<div class="auth-split__feature">' +
      '<div class="auth-split__feature-icon">' + icon + '</div>' +
      '<div>' +
        '<div class="auth-split__feature-title">' + title + '</div>' +
        '<div class="auth-split__feature-sub">' + sub + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- Bind events ---- */
  function _bind() {
    document.getElementById('login-btn').addEventListener('click', _submit);
    document.getElementById('login-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') _submit();
    });
    document.getElementById('toggle-pw').addEventListener('click', function () {
      _pwVisible = !_pwVisible;
      var input = document.getElementById('login-password');
      var btn   = document.getElementById('toggle-pw');
      input.type    = _pwVisible ? 'text' : 'password';
      btn.innerHTML = _pwVisible ? _iEyeOn() : _iEyeOff();
    });
  }

  function _submit() {
    var email    = (document.getElementById('login-email').value    || '').trim();
    var password = (document.getElementById('login-password').value || '').trim();

    // Clear errors
    ['err-email','err-password','err-general'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.remove('show'); }
    });
    ['login-email','login-password'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('error');
    });

    var valid = true;
    if (!email) {
      _fieldErr('login-email', 'err-email', 'Email is required.');
      valid = false;
    }
    if (!password) {
      _fieldErr('login-password', 'err-password', 'Password is required.');
      valid = false;
    }
    if (!valid) return;

    if (BizStorage.login(email, password)) {
      BizRouter.navigate('/dashboard');
    } else {
      var errG = document.getElementById('err-general');
      errG.textContent = 'Invalid email or password. Use the demo credentials above.';
      errG.classList.add('show');
    }
  }

  function _fieldErr(inputId, errId, msg) {
    var input = document.getElementById(inputId);
    var err   = document.getElementById(errId);
    if (input) input.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('show'); }
  }

  /* ---- Icons ---- */
  function _iMail()    { return '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/></svg>'; }
  function _iLock()    { return '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>'; }
  function _iEyeOff()  { return '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/></svg>'; }
  function _iEyeOn()   { return '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>'; }
  function _iDoc()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>'; }
  function _iCalc()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>'; }
  function _iPdf()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 2H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14a2 2 0 002 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>'; }
  function _iOffline() { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95A5.469 5.469 0 0112 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11A2.98 2.98 0 0122 15c0 1.65-1.35 3-3 3z"/></svg>'; }
  function _iArrow()   { return '<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>'; }

  return { render };
})();