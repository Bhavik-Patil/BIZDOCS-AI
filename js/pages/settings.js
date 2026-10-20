/* ============================================================
   BizDocs AI — Settings page
   Business profile, GST defaults, currency, backup/restore
   ============================================================ */

var PageSettings = (function () {
  var _logo=null;

  function render() {
    var settings = BizStorage.getSettings();
    _logo=BizBrand.validLogo(settings.logo_data_url)?settings.logo_data_url:null;

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Settings', 'Business profile and document defaults') +
        '<main class="page" id="page-root">' +
          _pageHtml(settings) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindEvents();
  }

  /* ============================================================
     PAGE HTML
     ============================================================ */
  function _pageHtml(s) {
    return '<div style="max-width:760px">' +

      /* Business Profile */
      '<div class="card" style="margin-bottom:var(--sp-5)">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Business Profile</div>' +
            '<div class="card-subtitle">This information appears on all documents</div>' +
          '</div>' +
        '</div>' +

        '<div class="form-row">' +
          _field('s-bname',  'Business Name',  'text',  s.business_name || '', true,  'e.g. TechSpark Solutions') +
          _field('s-email',  'Business Email', 'email', s.email         || '', false, 'e.g. info@yourbusiness.com') +
        '</div>' +
        '<div class="form-row">' +
          _field('s-phone',  'Phone Number',   'tel',   s.phone         || '', false, 'e.g. +91 98765 43210') +
          _field('s-gst-no', 'GST Number',     'text',  s.gst_number    || '', false, 'e.g. 27AABCT1234L1Z5') +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="s-address">Business Address</label>' +
          '<textarea id="s-address" class="form-control" rows="3" placeholder="Full business address">' +
            _esc(s.address || '') +
          '</textarea>' +
        '</div>' +
      '</div>' +

      '<div class="card logo-upload-card" style="margin-bottom:var(--sp-5)"><div class="card-title">Company logo</div><div class="brand-upload"><div id="s-logo-preview">'+(BizBrand.validLogo(s.logo_data_url)?'<img src="'+s.logo_data_url+'" alt="Business logo"/>':'<span>Your logo</span>')+'</div><div><label class="form-label" for="s-logo">Upload logo</label><input id="s-logo" type="file" accept="image/png,image/jpeg,image/webp"/><p class="form-hint">PNG, JPG or WebP · up to 5 MB. Save Settings to apply it to every document.</p><button class="btn btn-secondary btn-sm" type="button" id="s-logo-remove">Remove logo</button></div></div></div>' +
      /* Document Defaults */
      '<div class="card" style="margin-bottom:var(--sp-5)">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Document Defaults</div>' +
            '<div class="card-subtitle">Pre-filled values when creating new documents</div>' +
          '</div>' +
        '</div>' +

        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="s-currency">Currency</label>' +
            '<select id="s-currency" class="form-control">' +
              _currencyOption('INR', '₹ Indian Rupee',     s.currency) +
              _currencyOption('USD', '$ US Dollar',        s.currency) +
              _currencyOption('EUR', '€ Euro',             s.currency) +
              _currencyOption('GBP', '£ British Pound',    s.currency) +
              _currencyOption('AED', 'AED UAE Dirham',     s.currency) +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="s-gst-pct">Default GST %</label>' +
            '<select id="s-gst-pct" class="form-control">' +
              _gstOption(0,    s.default_gst_bp) +
              _gstOption(500,  s.default_gst_bp) +
              _gstOption(800,  s.default_gst_bp) +
              _gstOption(1200, s.default_gst_bp) +
              _gstOption(1800, s.default_gst_bp) +
              _gstOption(2800, s.default_gst_bp) +
              (![0, 500, 800, 1200, 1800, 2800].includes(s.default_gst_bp) ? _gstOption(s.default_gst_bp, s.default_gst_bp) : '') +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="s-validity">Default Validity (days)</label>' +
            '<input id="s-validity" type="number" class="form-control" min="1" max="365" ' +
              'value="' + (s.default_validity_days || 30) + '" placeholder="30"/>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Data Management */
      '<div class="card" style="margin-bottom:var(--sp-5)">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">Data Management</div>' +
            '<div class="card-subtitle">Export your data or reset demo data</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:var(--sp-4)">' +

          '<div style="display:flex;align-items:center;justify-content:space-between;' +
               'padding:var(--sp-4);background:var(--clr-bg);border-radius:var(--r-md);' +
               'border:1px solid var(--clr-border)">' +
            '<div>' +
              '<div style="font-weight:600;font-size:13.5px">Export Backup</div>' +
              '<div style="font-size:12px;color:var(--clr-text-muted);margin-top:2px">' +
                'Download all your data as a JSON file' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-secondary" id="s-export">' + _iDownload() + ' Export</button>' +
          '</div>' +

          '<div style="display:flex;align-items:center;justify-content:space-between;' +
               'padding:var(--sp-4);background:#FFF7ED;border-radius:var(--r-md);' +
               'border:1px solid #FED7AA">' +
            '<div>' +
              '<div style="font-weight:600;font-size:13.5px;color:#C2410C">Reset Demo Data</div>' +
              '<div style="font-size:12px;color:#EA580C;margin-top:2px">' +
                'Clears all data and reloads sample records. Cannot be undone.' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-danger btn-sm" id="s-reset">Reset</button>' +
          '</div>' +

        '</div>' +
      '</div>' +

      /* Save button */
      '<div id="settings-form-error" class="form-error" style="margin-bottom:var(--sp-3)"></div>' +
      '<div style="display:flex;gap:var(--sp-3)">' +
        '<button class="btn btn-primary" id="s-save">' + _iSave() + ' Save Settings</button>' +
        '<button class="btn btn-secondary" id="s-cancel">Cancel</button>' +
      '</div>' +

    '</div>';
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function _field(id, label, type, value, required, placeholder) {
    return '<div class="form-group">' +
      '<label class="form-label' + (required ? ' required' : '') + '" for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" class="form-control" ' +
        'value="' + _esc(value) + '" placeholder="' + _esc(placeholder) + '"' +
        (required ? ' required' : '') + '/>' +
    '</div>';
  }

  function _currencyOption(code, label, current) {
    var sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED' };
    var sel = current === code ? ' selected' : '';
    return '<option value="' + code + '" data-sym="' + (sym[code]||code) + '"' + sel + '>' + label + '</option>';
  }

  function _gstOption(bp, currentBp) {
    var sel = currentBp === bp ? ' selected' : '';
    var pct = (Number(bp) || 0) / 100;
    var label = (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)) + '%';
    return '<option value="' + bp + '"' + sel + '>' + label + '</option>';
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function _bindEvents() {
    document.getElementById('s-logo').onchange = async function () {
      var save = document.getElementById('s-save');
      if (save) save.disabled = true;
      try {
        var image = await BizBrand.readImage(this.files[0], true);
        _logo = image.dataUrl;
        document.getElementById('s-logo-preview').innerHTML = '<img src="' + _logo + '" alt="Business logo"/>';
        var current = BizStorage.getSettings();
        current.logo_data_url = _logo;
        BizStorage.saveSettings(current);
        BizToast.show('Company logo uploaded and saved to documents!', 'success');
      } catch (error) {
        BizToast.show(error.message, 'warning');
      } finally {
        if (save) save.disabled = false;
        this.value = '';
      }
    };
    document.getElementById('s-logo-remove').onclick = function () {
      _logo = null;
      document.getElementById('s-logo-preview').textContent = 'Your logo';
      var current = BizStorage.getSettings();
      current.logo_data_url = null;
      BizStorage.saveSettings(current);
      BizToast.show('Company logo removed and saved.', 'info');
    };
    /* Save */
    document.getElementById('s-save').addEventListener('click', _save);

    /* Cancel */
    document.getElementById('s-cancel').addEventListener('click', function () {
      BizRouter.navigate('/dashboard');
    });

    /* Export backup */
    document.getElementById('s-export').addEventListener('click', function () {
      try {
        var json = BizStorage.exportBackup();
        var blob = new Blob([json], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = url;
        a.download = 'bizdocs-backup-' + BizStorage._today() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        BizToast.show('Backup exported!', 'success');
      } catch (e) {
        BizToast.show('Export failed.', 'error');
      }
    });

    /* Reset demo data */
    document.getElementById('s-reset').addEventListener('click', function () {
      if (!confirm('This will DELETE all your data and reload the demo. Are you sure?')) return;
      if (!confirm('Last chance — this cannot be undone. Proceed?')) return;

      /* Clear all storage keys */
      ['bd_settings','bd_customers','bd_documents','bd_counters','bd_seeded_v1'].forEach(function (key) {
        localStorage.removeItem(key);
      });

      BizSeed.run();
      BizToast.show('Demo data reloaded!', 'success');
      setTimeout(function () { BizRouter.navigate('/dashboard'); }, 800);
    });
  }

  function _save() {
    var bname   = (document.getElementById('s-bname').value   || '').trim();
    var email   = (document.getElementById('s-email').value   || '').trim();
    var phone   = (document.getElementById('s-phone').value   || '').trim();
    var gstNo   = (document.getElementById('s-gst-no').value  || '').trim();
    var address = (document.getElementById('s-address').value || '').trim();
    var validity= Number(document.getElementById('s-validity').value);

    /* Currency */
    var currSel  = document.getElementById('s-currency');
    var currency = currSel.value;
    var sym      = (currSel.selectedOptions[0] && currSel.selectedOptions[0].getAttribute('data-sym')) || '₹';

    /* GST */
    var gstBp = Number(document.getElementById('s-gst-pct').value);

    /* Validate */
    if (!bname) {
      var errEl = document.getElementById('settings-form-error');
      errEl.textContent = 'Business name is required.';
      errEl.classList.add('show');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { BizToast.show('Enter a valid business email.', 'warning'); return; }
    if (!Number.isInteger(validity) || validity < 1 || validity > 365) { BizToast.show('Validity must be a whole number between 1 and 365 days.', 'warning'); return; }
    var saved = BizStorage.saveSettings({
      business_name:         bname,
      email:                 email,
      phone:                 phone,
      gst_number:            gstNo,
      address:               address,
      currency:              currency,
      currency_symbol:       sym,
      default_gst_bp:        gstBp,
      default_validity_days: validity,
      logo_data_url:         _logo,
    });

    if (!saved) { BizToast.show('Could not save settings. Browser storage may be full.', 'error'); return; }
    BizToast.show('Settings saved!', 'success');

    var errEl = document.getElementById('settings-form-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
  }

  /* ============================================================
     SHARED HELPERS
     ============================================================ */
  function _bindAvatar() {
    var btn  = document.getElementById('avatar-btn');
    var menu = document.getElementById('avatar-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function () { if (menu) menu.classList.remove('open'); });
  }

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---- Icons ---- */
  function _iSave()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'; }
  function _iDownload(){ return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>'; }

  return { render };
})();
