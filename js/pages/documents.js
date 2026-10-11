/* ============================================================
   BizDocs AI — Documents Archive page
   Unified view of all document types with search, filter,
   view, edit, duplicate, delete and export actions.
   ============================================================ */

var PageDocuments = (function () {

  var _currentFilter = 'all';
  var _currentSearch = '';

  function render() {
    _currentFilter = 'all';
    _currentSearch = '';
    _renderList();
  }

  /* ============================================================
     LIST VIEW
     ============================================================ */
  function _renderList() {
    var all      = BizStorage.getDocuments();
    var settings = BizStorage.getSettings();

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Documents', 'Archive of all your business documents') +
        '<main class="page" id="page-root">' +
          _pageHtml(all, settings) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindEvents(settings);
  }

  function _pageHtml(all, settings) {
    var sym = settings.currency_symbol || '₹';

    /* Type counts for filter tabs */
    var counts = { all: all.length };
    ['quotation','invoice','letter','agreement','report','custom'].forEach(function (t) {
      counts[t] = all.filter(function (d) { return d.type === t; }).length;
    });

    return '<div class="page__header">' +
        '<div>' +
          '<h1 class="page__title">Documents</h1>' +
          '<p class="page__subtitle">' + all.length + ' document' + (all.length !== 1 ? 's' : '') + ' total</p>' +
        '</div>' +
        '<div style="display:flex;gap:var(--sp-3)">' +
          '<button class="btn btn-secondary" id="btn-backup">' + _iDownload() + ' Export Backup</button>' +
          '<button class="btn btn-primary"   id="btn-new-doc">'  + _iPlus()    + ' New Document</button>' +
        '</div>' +
      '</div>' +

      /* Filter tabs */
      '<div class="inv-tabs" id="doc-tabs" style="margin-bottom:var(--sp-4)">' +
        _tab('all',       'All',        counts.all) +
        _tab('quotation', 'Quotations', counts.quotation) +
        _tab('invoice',   'Invoices',   counts.invoice) +
        _tab('letter',    'Letters',    counts.letter) +
        _tab('agreement', 'Agreements', counts.agreement) +
        _tab('report',    'Reports',    counts.report) +
        _tab('custom',    'Custom',     counts.custom) +
      '</div>' +

      /* Search + date filter */
      '<div class="toolbar">' +
        '<div class="toolbar__search">' +
          _iSearch() +
          '<input type="search" id="doc-search" placeholder="Search by reference, customer, type…" autocomplete="off" value=""/>' +
        '</div>' +
        '<div style="display:flex;gap:var(--sp-3);align-items:center">' +
          '<label style="font-size:12.5px;color:var(--clr-text-muted);white-space:nowrap">From</label>' +
          '<input type="date" id="doc-date-from" class="form-control" style="width:150px"/>' +
          '<label style="font-size:12.5px;color:var(--clr-text-muted);white-space:nowrap">To</label>' +
          '<input type="date" id="doc-date-to" class="form-control" style="width:150px"/>' +
          '<button class="btn btn-secondary btn-sm" id="btn-clear-date">Clear</button>' +
        '</div>' +
      '</div>' +

      '<div id="doc-list-wrap">' + _docTable(all, sym) + '</div>';
  }

  function _tab(value, label, count) {
    var active = value === 'all' ? ' active' : '';
    return '<button class="inv-tab' + active + '" data-filter="' + value + '">' +
      label + (count ? ' <span style="background:var(--clr-bg);border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px">' + count + '</span>' : '') +
    '</button>';
  }

  /* ============================================================
     DOCUMENT TABLE
     ============================================================ */
  function _docTable(docs, sym) {
    if (!docs.length) {
      return '<div class="card"><div class="empty-state">' +
        _iEmptyDoc() +
        '<h3>No documents found</h3>' +
        '<p>Try adjusting your search or filters.</p>' +
      '</div></div>';
    }

    var sorted = docs.slice().sort(function (a, b) {
      return b.created_at.localeCompare(a.created_at);
    });

    var rows = sorted.map(function (d) {
      var customer  = BizStorage.getCustomerById(d.customer_id);
      var cname     = customer ? (customer.company || customer.name) : '—';
      var typeBadge = '<span class="badge badge-' + d.type + '">' + _cap(d.type) + '</span>';
      var status    = '';
      if (d.payment_status) {
        var cls = d.payment_status === 'paid' ? 'paid'
                : BizMoney.isOverdue(d)       ? 'overdue'
                : 'pending';
        var lbl = cls.charAt(0).toUpperCase() + cls.slice(1);
        status  = '<span class="badge badge-' + cls + '">' + lbl + '</span>';
      }

      return '<tr>' +
        '<td>' +
          '<div style="font-weight:600;font-size:13px">' + _esc(d.reference_no) + '</div>' +
          '<div style="font-size:11.5px;color:var(--clr-text-muted);margin-top:2px">' + _fmtDate(d.created_at) + '</div>' +
        '</td>' +
        '<td>' + typeBadge + '</td>' +
        '<td>' +
          '<div style="font-size:13px">' + _esc(cname) + '</div>' +
          (customer && customer.email ? '<div style="font-size:11.5px;color:var(--clr-text-muted)">' + _esc(customer.email) + '</div>' : '') +
        '</td>' +
        '<td class="td-muted">' + _fmtDate(d.issue_date) + '</td>' +
        '<td style="text-align:right;font-weight:600">' +
          (d.total_p ? BizMoney.format(d.total_p, sym) : '—') +
        '</td>' +
        '<td>' + (status || '<span class="badge badge-draft">—</span>') + '</td>' +
        '<td class="td-actions">' +
          '<button class="btn btn-ghost btn-icon btn-sm doc-view"   data-id="' + d.id + '" title="View">'      + _iEye()    + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm doc-print"  data-id="' + d.id + '" title="Print/PDF">' + _iPrint()  + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm doc-dup"    data-id="' + d.id + '" title="Duplicate">' + _iDup()    + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm doc-edit"   data-id="' + d.id + '" title="Edit">'      + _iEdit()   + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm doc-delete" data-id="' + d.id + '" title="Delete" style="color:var(--clr-danger)">' + _iDelete() + '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="table-wrap"><table>' +
      '<thead><tr>' +
        '<th>Reference</th><th>Type</th><th>Customer</th>' +
        '<th>Date</th><th style="text-align:right">Amount</th>' +
        '<th>Status</th><th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function _bindEvents(settings) {
    var sym = settings.currency_symbol || '₹';

    /* New document */
    document.getElementById('btn-new-doc').addEventListener('click', function () {
      BizRouter.navigate('/generator');
    });

    /* Backup export */
    document.getElementById('btn-backup').addEventListener('click', function () {
      _exportBackup();
    });

    /* Filter tabs */
    document.querySelectorAll('#doc-tabs .inv-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('#doc-tabs .inv-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        _currentFilter = tab.getAttribute('data-filter');
        _refreshTable(sym);
      });
    });

    /* Search */
    document.getElementById('doc-search').addEventListener('input', function () {
      _currentSearch = this.value.trim().toLowerCase();
      _refreshTable(sym);
    });

    /* Date filters */
    document.getElementById('doc-date-from').addEventListener('change', function () { _refreshTable(sym); });
    document.getElementById('doc-date-to').addEventListener('change',   function () { _refreshTable(sym); });

    /* Clear date */
    document.getElementById('btn-clear-date').addEventListener('click', function () {
      document.getElementById('doc-date-from').value = '';
      document.getElementById('doc-date-to').value   = '';
      _refreshTable(sym);
    });

    _bindTableBtns(settings);
  }

  function _refreshTable(sym) {
    var all      = BizStorage.getDocuments();
    var dateFrom = (document.getElementById('doc-date-from') || {}).value || '';
    var dateTo   = (document.getElementById('doc-date-to')   || {}).value || '';

    var filtered = all.filter(function (d) {
      /* Type filter */
      if (_currentFilter !== 'all' && d.type !== _currentFilter) return false;

      /* Search */
      if (_currentSearch) {
        var customer = BizStorage.getCustomerById(d.customer_id);
        var cname    = customer ? (customer.company || customer.name || '') : '';
        var haystack = [
          d.reference_no || '',
          d.type         || '',
          cname,
        ].join(' ').toLowerCase();
        if (!haystack.includes(_currentSearch)) return false;
      }

      /* Date range */
      if (dateFrom && d.issue_date && d.issue_date < dateFrom) return false;
      if (dateTo   && d.issue_date && d.issue_date > dateTo)   return false;

      return true;
    });

    document.getElementById('doc-list-wrap').innerHTML = _docTable(filtered, sym);
    _bindTableBtns({ currency_symbol: sym });
  }

  function _bindTableBtns(settings) {
    var sym = (settings || {}).currency_symbol || '₹';

    /* View */
    document.querySelectorAll('.doc-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _showViewModal(btn.getAttribute('data-id'), sym);
      });
    });

    /* Print */
    document.querySelectorAll('.doc-print').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _printDoc(btn.getAttribute('data-id'));
      });
    });

    /* Duplicate */
    document.querySelectorAll('.doc-dup').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var copy = BizStorage.duplicateDocument(btn.getAttribute('data-id'));
        if (copy) {
          BizToast.show('Duplicated: ' + copy.reference_no, 'success');
          _renderList();
        }
      });
    });

    /* Edit — navigate to correct editor */
    document.querySelectorAll('.doc-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var doc = BizStorage.getDocumentById(btn.getAttribute('data-id'));
        if (!doc) return;
        if (doc.type === 'quotation') BizRouter.navigate('/quotations/edit/' + doc.id);
        else if (doc.type === 'invoice') BizRouter.navigate('/invoices/edit/' + doc.id);
        else BizRouter.navigate('/generator');
      });
    });

    /* Delete */
    document.querySelectorAll('.doc-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _confirmDelete(btn.getAttribute('data-id'));
      });
    });
  }

  /* ============================================================
     VIEW MODAL
     ============================================================ */
  function _showViewModal(id, sym) {
    var doc      = BizStorage.getDocumentById(id);
    if (!doc) return;
    var customer = BizStorage.getCustomerById(doc.customer_id);
    var cname    = customer ? (customer.company || customer.name) : '—';
    var settings = BizStorage.getSettings();
    sym          = settings.currency_symbol || sym || '₹';

    var itemRows = (doc.items || []).map(function (item) {
      var line = BizMoney.calcLine(item);
      return '<tr style="border-bottom:1px solid var(--clr-border)">' +
        '<td style="padding:var(--sp-2) var(--sp-3);font-size:13px">' + _esc(item.description || '') + '</td>' +
        '<td style="padding:var(--sp-2) var(--sp-3);font-size:13px;text-align:center">' + ((item.quantity_milli||0)/1000) + '</td>' +
        '<td style="padding:var(--sp-2) var(--sp-3);font-size:13px;text-align:right">' + BizMoney.format(item.unit_price_p||0,sym) + '</td>' +
        '<td style="padding:var(--sp-2) var(--sp-3);font-size:13px;text-align:right;font-weight:700;color:var(--clr-primary)">' + BizMoney.format(line.line_total_p,sym) + '</td>' +
      '</tr>';
    }).join('');

    var statusHtml = doc.payment_status
      ? '<span class="badge badge-' + (doc.payment_status === 'paid' ? 'paid' : BizMoney.isOverdue(doc) ? 'overdue' : 'pending') + '">' +
          (doc.payment_status === 'paid' ? 'Paid' : BizMoney.isOverdue(doc) ? 'Overdue' : 'Pending') +
        '</span>'
      : '';

    var wrap = document.createElement('div');
    wrap.id  = 'view-modal-wrap';
    wrap.innerHTML =
      '<div class="modal-overlay open" id="view-modal">' +
        '<div class="modal" style="max-width:640px">' +
          '<div class="modal-header">' +
            '<div>' +
              '<div class="modal-title">' + _esc(doc.reference_no) + '</div>' +
              '<div style="display:flex;gap:var(--sp-2);margin-top:4px">' +
                '<span class="badge badge-' + doc.type + '">' + _cap(doc.type) + '</span>' +
                statusHtml +
              '</div>' +
            '</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-view-modal">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">' +
              _infoRow('Customer',   cname) +
              _infoRow('Date',       _fmtDate(doc.issue_date)) +
              (doc.valid_until  ? _infoRow('Valid Until', _fmtDate(doc.valid_until)) : '') +
              (doc.due_date     ? _infoRow('Due Date',    _fmtDate(doc.due_date))    : '') +
            '</div>' +

            (doc.items && doc.items.length
              ? '<div class="table-wrap" style="margin-bottom:var(--sp-4)">' +
                  '<table><thead><tr>' +
                    '<th>Description</th><th style="text-align:center">Qty</th>' +
                    '<th style="text-align:right">Rate</th><th style="text-align:right">Total</th>' +
                  '</tr></thead>' +
                  '<tbody>' + itemRows + '</tbody>' +
                  '<tfoot>' +
                    '<tr style="background:var(--clr-bg)">' +
                      '<td colspan="3" style="padding:var(--sp-3);font-size:13px;font-weight:700;text-align:right">Grand Total</td>' +
                      '<td style="padding:var(--sp-3);font-size:14px;font-weight:800;text-align:right;color:var(--clr-primary)">' +
                        BizMoney.format(doc.total_p || 0, sym) +
                      '</td>' +
                    '</tr>' +
                  '</tfoot>' +
                '</table>' +
              '</div>'
              : '') +

            (doc.notes ? '<div style="margin-bottom:var(--sp-3)"><div style="font-size:11.5px;font-weight:700;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Notes</div><div style="font-size:13px">' + _esc(doc.notes) + '</div></div>' : '') +
            (doc.terms ? '<div><div style="font-size:11.5px;font-weight:700;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Terms</div><div style="font-size:13px">' + _esc(doc.terms) + '</div></div>' : '') +

          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="close-view-2">Close</button>' +
            '<button class="btn btn-secondary" id="modal-print-btn">' + _iPrint() + ' Print</button>' +
            (doc.type === 'quotation' || doc.type === 'invoice'
              ? '<button class="btn btn-primary" id="modal-edit-btn">' + _iEdit() + ' Edit</button>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);

    function _close() {
      var w = document.getElementById('view-modal-wrap');
      if (w) w.parentNode.removeChild(w);
    }

    document.getElementById('close-view-modal').addEventListener('click', _close);
    document.getElementById('close-view-2').addEventListener('click',     _close);
    document.getElementById('view-modal').addEventListener('click', function (e) {
      if (e.target === this) _close();
    });
    document.getElementById('modal-print-btn').addEventListener('click', function () {
      _close(); _printDoc(id);
    });
    var editBtn = document.getElementById('modal-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        _close();
        if (doc.type === 'quotation') BizRouter.navigate('/quotations/edit/' + doc.id);
        else BizRouter.navigate('/invoices/edit/' + doc.id);
      });
    }
  }

  function _infoRow(label, value) {
    return '<div>' +
      '<div style="font-size:11.5px;font-weight:600;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">' + label + '</div>' +
      '<div style="font-size:13.5px;color:var(--clr-text)">' + _esc(value) + '</div>' +
    '</div>';
  }

  /* ============================================================
     PRINT / PDF
     ============================================================ */
  function _printDoc(id) {
    var doc      = BizStorage.getDocumentById(id);
    var settings = BizStorage.getSettings();
    var customers= BizStorage.getCustomers();
    if (!doc) return;

    /* For quotations and invoices, reuse their preview builders */
    var previewHtml = '';
    if (doc.type === 'quotation') {
      previewHtml = PageQuotations._buildPreview
        ? PageQuotations._buildPreview(doc, customers, settings, doc.items || [])
        : _genericPreview(doc, settings, customers);
    } else if (doc.type === 'invoice') {
      previewHtml = PageInvoices._buildPreview
        ? PageInvoices._buildPreview(doc, customers, settings, doc.items || [])
        : _genericPreview(doc, settings, customers);
    } else {
      previewHtml = _genericPreview(doc, settings, customers);
    }

    var w = window.open('', '_blank');
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/>' +
      '<title>' + _esc(doc.reference_no) + '</title>' +
      '<style>body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}' +
      '@page{size:A4 portrait;margin:14mm 16mm;}' +
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>' +
      '</head><body>' + previewHtml +
      '<script>window.onload=function(){window.print();};<\/script>' +
      '</body></html>'
    );
    w.document.close();
  }

  function _genericPreview(doc, settings, customers) {
    var customer = BizStorage.getCustomerById(doc.customer_id);
    var sym      = settings.currency_symbol || '₹';
    var body     = (doc.body_json && doc.body_json.body) ? doc.body_json.body : '';
    var subject  = (doc.body_json && doc.body_json.subject) ? doc.body_json.subject : '';

    return '<div style="background:white;padding:32px 36px;font-family:Inter,sans-serif;font-size:12px;color:#0B163F;min-height:297mm;box-sizing:border-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #2563EB">' +
        '<div>' +
          '<div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">BizDocs AI</div>' +
          '<div style="font-size:11px;color:#64748B">' + _esc(settings.business_name || '') + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:18px;font-weight:800;color:#2563EB">' + _cap(doc.type) + '</div>' +
          '<div style="font-size:12px;font-weight:600;color:#0B163F;margin-top:4px">' + _esc(doc.reference_no) + '</div>' +
          '<div style="font-size:10.5px;color:#64748B">' + _fmtDate(doc.issue_date) + '</div>' +
        '</div>' +
      '</div>' +
      (customer ? '<div style="margin-bottom:20px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:8px">To</div>' +
        '<div style="font-weight:700">' + _esc(customer.name) + '</div>' +
        (customer.company ? '<div style="color:#64748B;font-size:11.5px">' + _esc(customer.company) + '</div>' : '') +
      '</div>' : '') +
      (subject ? '<div style="font-size:13px;font-weight:700;margin-bottom:16px;padding:10px 14px;background:#EFF6FF;border-radius:6px;border-left:3px solid #2563EB">Re: ' + _esc(subject) + '</div>' : '') +
      (body    ? '<div style="font-size:12px;line-height:1.8;white-space:pre-line">' + _esc(body) + '</div>' : '') +
      '<div style="border-top:2px solid #E2E8F0;padding-top:14px;margin-top:32px;text-align:center;font-size:10px;font-weight:700;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">BizDocs AI — Smart Documents. Faster Business.</div>' +
    '</div>';
  }

  /* ============================================================
     BACKUP EXPORT
     ============================================================ */
  function _exportBackup() {
    try {
      var json     = BizStorage.exportBackup();
      var blob     = new Blob([json], { type: 'application/json' });
      var url      = URL.createObjectURL(blob);
      var a        = document.createElement('a');
      a.href       = url;
      a.download   = 'bizdocs-backup-' + BizStorage._today() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      BizToast.show('Backup exported successfully!', 'success');
    } catch (e) {
      BizToast.show('Export failed. Try again.', 'error');
    }
  }

  /* ============================================================
     DELETE CONFIRMATION
     ============================================================ */
  function _confirmDelete(id) {
    var doc = BizStorage.getDocumentById(id);
    if (!doc) return;

    var wrap = document.createElement('div');
    wrap.id  = 'confirm-wrap';
    wrap.innerHTML =
      '<div class="modal-overlay open" id="confirm-modal">' +
        '<div class="modal" style="max-width:400px">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Delete Document</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-confirm">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p>Delete <strong>' + _esc(doc.reference_no) + '</strong>?</p>' +
            '<p style="font-size:12.5px;color:var(--clr-text-muted);margin-top:var(--sp-2)">This cannot be undone.</p>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="cancel-del">Cancel</button>' +
            '<button class="btn btn-danger"    id="confirm-del">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);

    function _close() {
      var w = document.getElementById('confirm-wrap');
      if (w) w.parentNode.removeChild(w);
    }

    document.getElementById('close-confirm').addEventListener('click', _close);
    document.getElementById('cancel-del').addEventListener('click',    _close);
    document.getElementById('confirm-del').addEventListener('click', function () {
      BizStorage.deleteDocument(id);
      _close();
      BizToast.show('Document deleted.', 'success');
      _renderList();
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function _bindAvatar() {
    var btn  = document.getElementById('avatar-btn');
    var menu = document.getElementById('avatar-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function () { if (menu) menu.classList.remove('open'); });
  }

  function _cap(s)     { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _fmtDate(d) { if (!d) return '—'; var p = String(d).slice(0,10).split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : d; }

  /* ---- Icons ---- */
  function _iPlus()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'; }
  function _iEdit()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'; }
  function _iDelete()  { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'; }
  function _iDup()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'; }
  function _iEye()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'; }
  function _iPrint()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>'; }
  function _iClose()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'; }
  function _iSearch()  { return '<svg class="toolbar__search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>'; }
  function _iDownload(){ return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>'; }
  function _iEmptyDoc(){ return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>'; }

  return { render };
})();