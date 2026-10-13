/* ============================================================
   BizDocs AI — Dashboard page
   Shows live stats from storage, quick actions, recent docs,
   and pending invoice summary.
   ============================================================ */

var PageDashboard = (function () {

  function render() {
    var stats    = BizStorage.getStats();
    var recent   = BizStorage.getRecentDocuments(8);
    var settings = BizStorage.getSettings();
    var sym      = settings.currency_symbol || '₹';

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Dashboard', 'Welcome back, ' + ((BizStorage.getSession() || {}).name || 'Demo User')) +
        '<main class="page" id="page-root">' +
          _statCards(stats, sym) +
          _quickActions() +
          _bottomRow(recent, stats, sym) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindQuickActions();
  }

  /* ---- Quick action buttons ---- */
  function _quickActions() {
    var actions = [
      { label: 'New Quotation',  sub: 'Create & send',       path: '/quotations/new', icon: _iReceipt(),  colour: 'blue'   },
      { label: 'New Invoice',    sub: 'Bill a customer',      path: '/invoices/new',   icon: _iInvoice(),  colour: 'purple' },
      { label: 'Add Customer',   sub: 'Save contact',         path: '/customers/new',  icon: _iUsers(),    colour: 'green'  },
      { label: 'Create Document',   sub: 'Draft from prompt',    path: '/generator',      icon: _iSparkle(),  colour: 'amber'  },
    ];

    return '<div class="grid-4" style="margin-bottom:var(--sp-6)">' +
      actions.map(function (a) {
        return '<button class="quick-action" data-path="' + a.path + '">' +
          '<div class="quick-action__icon icon-' + a.colour + '">' + a.icon + '</div>' +
          '<div>' +
            '<div class="quick-action__title">' + a.label + '</div>' +
            '<div class="quick-action__sub">'   + a.sub   + '</div>' +
          '</div>' +
        '</button>';
      }).join('') +
    '</div>';
  }

  /* ---- Stat cards ---- */
  function _statCards(s, sym) {
    return '<div class="grid-4" style="margin-bottom:var(--sp-6)">' +
      _statCard('Total Documents',  s.totalDocuments,                    'blue',   _iDoc()) +
      _statCard('Quotations',        s.totalQuotations,                   'purple', _iReceipt()) +
      _statCard('Invoices',          s.totalInvoices,                     'green',  _iInvoice()) +
      _statCard('Customers',         s.totalCustomers,                    'amber',  _iUsers()) +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-6)">' +
      _statCard('Pending Invoices',  s.pendingInvoices,                   'cyan',   _iClock()) +
      _statCard('Pending Value',     BizMoney.format(s.pendingValueP, sym), 'red',  _iMoney(), true) +
    '</div>';
  }

  function _statCard(label, value, colour, iconSvg, wide) {
    return '<div class="stat-card">' +
      '<div>' +
        '<div class="stat-card__value">' + _esc(String(value)) + '</div>' +
        '<div class="stat-card__label">' + label + '</div>' +
      '</div>' +
      '<div class="stat-card__icon icon-' + colour + '">' + iconSvg + '</div>' +
    '</div>';
  }

  /* ---- Bottom row: recent docs + pending invoices ---- */
  function _bottomRow(recent, stats, sym) {
    return '<div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--sp-5);align-items:start">' +
      _recentTable(recent, sym) +
      _pendingPanel(sym) +
    '</div>';
  }

  /* Recent documents table */
  function _recentTable(docs, sym) {
    if (!docs.length) {
      return '<div class="card"><div class="empty-state">' +
        _iEmptyDoc() +
        '<h3>No documents yet</h3>' +
        '<p>Create your first quotation to get started.</p>' +
        '<button class="btn btn-primary" style="margin-top:var(--sp-4)" onclick="BizRouter.navigate(\'/quotations/new\')">New Quotation</button>' +
      '</div></div>';
    }

    var rows = docs.map(function (d) {
      var customer = BizStorage.getCustomerById(d.customer_id);
      var cname    = customer ? (customer.company || customer.name) : '—';
      var typeBadge = '<span class="badge badge-' + d.type + '">' + _cap(d.type) + '</span>';
      var statusBadge = d.payment_status
        ? '<span class="badge badge-' + _payClass(d) + '">' + _payLabel(d) + '</span>'
        : '<span class="badge badge-draft">—</span>';

      return '<tr>' +
        '<td><span style="font-weight:600;font-size:13px">' + _esc(d.reference_no) + '</span></td>' +
        '<td>' + typeBadge + '</td>' +
        '<td>' + _esc(cname) + '</td>' +
        '<td class="td-muted">' + _formatDate(d.issue_date) + '</td>' +
        '<td style="text-align:right;font-weight:600">' +
          (d.total_p ? BizMoney.format(d.total_p, sym) : '—') +
        '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="td-actions">' +
          '<button class="btn btn-ghost btn-icon btn-sm" title="View" onclick="PageDashboard._viewDoc(\'' + d.id + '\')">' + _iEye() + '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">Recent Documents</div>' +
          '<div class="card-subtitle">Your latest activity</div>' +
        '</div>' +
        '<a href="#/documents" class="btn btn-secondary btn-sm">View all</a>' +
      '</div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr>' +
            '<th>Reference</th><th>Type</th><th>Customer</th>' +
            '<th>Date</th><th style="text-align:right">Amount</th>' +
            '<th>Status</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  }

  /* Pending invoices panel */
  function _pendingPanel(sym) {
    var allDocs  = BizStorage.getDocuments();
    var invoices = allDocs.filter(function (d) { return d.type === 'invoice'; });
    var pending  = invoices.filter(function (d) { return d.payment_status !== 'paid'; });

    if (!pending.length) {
      return '<div class="card">' +
        '<div class="card-header"><div class="card-title">Pending Invoices</div></div>' +
        '<div class="empty-state" style="padding:var(--sp-8) var(--sp-4)">' +
          '<p style="font-size:13px;color:var(--clr-success)">✓ All invoices are paid!</p>' +
        '</div>' +
      '</div>';
    }

    var items = pending.slice(0, 5).map(function (d) {
      var customer = BizStorage.getCustomerById(d.customer_id);
      var cname    = customer ? (customer.company || customer.name) : '—';
      var cls      = _payClass(d);
      return '<div style="display:flex;justify-content:space-between;align-items:center;' +
             'padding:var(--sp-3) 0;border-bottom:1px solid var(--clr-border)">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:600">' + _esc(d.reference_no) + '</div>' +
          '<div style="font-size:12px;color:var(--clr-text-muted)">' + _esc(cname) + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:13px;font-weight:700">' + BizMoney.format(d.total_p || 0, sym) + '</div>' +
          '<span class="badge badge-' + cls + '" style="margin-top:2px">' + _capFirst(cls) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    var moreCount = pending.length > 5 ? pending.length - 5 : 0;

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div class="card-title">Pending Invoices</div>' +
        '<span class="badge badge-pending">' + pending.length + '</span>' +
      '</div>' +
      items +
      (moreCount ? '<p style="font-size:12px;color:var(--clr-text-muted);margin-top:var(--sp-3);text-align:center">+' + moreCount + ' more</p>' : '') +
      '<a href="#/invoices" class="btn btn-secondary btn-sm" style="width:100%;margin-top:var(--sp-4);justify-content:center">View all invoices</a>' +
    '</div>';
  }

  /* ---- Bind events ---- */
  function _bindAvatar() {
    var btn  = document.getElementById('avatar-btn');
    var menu = document.getElementById('avatar-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      if (menu) menu.classList.remove('open');
    }, { once: false });
  }

  function _bindQuickActions() {
    var buttons = document.querySelectorAll('.quick-action[data-path]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        BizRouter.navigate(btn.getAttribute('data-path'));
      });
    });
  }

  /* ---- Public: view doc (called from inline onclick) ---- */
  function _viewDoc(id) {
    var doc = BizStorage.getDocumentById(id);
    if (!doc) return;
    var pathMap = { quotation: '/quotations', invoice: '/invoices', letter: '/documents',
                    agreement: '/documents',  report:  '/documents', custom: '/documents' };
    BizRouter.navigate(pathMap[doc.type] || '/documents');
  }

  /* ---- Helpers ---- */
  function _payClass(d) {
    if (d.payment_status === 'paid') return 'paid';
    if (BizMoney.isOverdue(d))       return 'overdue';
    return 'pending';
  }
  function _payLabel(d) {
    if (d.payment_status === 'paid') return 'Paid';
    if (BizMoney.isOverdue(d))       return 'Overdue';
    return 'Pending';
  }
  function _cap(s)      { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _esc(s)      { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _formatDate(d) {
    if (!d) return '—';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  /* ---- Inline SVG icons ---- */
  function _iDoc()     { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/></svg>'; }
  function _iReceipt() { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z"/></svg>'; }
  function _iInvoice() { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>'; }
  function _iUsers()   { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z"/></svg>'; }
  function _iSparkle() { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 2l.5 3.5L13.5 6l-3.5.5L9.5 10l-.5-3.5L5.5 6l3.5-.5L9.5 2zM3 12l.33 2.33L5.67 15l-2.34.33L3 18l-.33-2.67L.33 15l2.34-.33L3 12zm11 1l.25 1.75L16 15l-1.75.25L14 17l-.25-1.75L12 15l1.75-.25L14 13z"/></svg>'; }
  function _iClock()   { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>'; }
  function _iMoney()   { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>'; }
  function _iEye()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'; }
  function _iEmptyDoc(){ return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>'; }

  /* Public surface (needed for inline onclick) */
  return { render, _viewDoc };
})();