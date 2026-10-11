/* ============================================================
   BizDocs AI — Invoices page
   List, create, edit, duplicate, delete, convert from quotation
   ============================================================ */

var PageInvoices = (function () {

  /* ============================================================
     ENTRY POINT
     ============================================================ */
  function render() {
    var hash = window.location.hash || '';
    if (hash.includes('/invoices/new'))    return _renderForm(null, null);
    if (hash.includes('/invoices/from/')) {
      var qId = hash.split('/invoices/from/')[1];
      return _renderForm(null, qId);
    }
    if (hash.includes('/invoices/edit/')) {
      var id = hash.split('/invoices/edit/')[1];
      return _renderForm(id, null);
    }
    _renderList();
  }

  /* ============================================================
     LIST VIEW
     ============================================================ */
  function _renderList() {
    var docs     = BizStorage.getDocuments().filter(function (d) { return d.type === 'invoice'; });
    var settings = BizStorage.getSettings();

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Invoices', 'Track and manage invoice payments') +
        '<main class="page" id="page-root">' +
          _listHtml(docs, settings) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindListEvents(docs, settings);
  }

  function _listHtml(docs, settings) {
    var sym = settings.currency_symbol || '₹';

    /* Summary cards */
    var paid    = docs.filter(function (d) { return d.payment_status === 'paid'; });
    var overdue = docs.filter(function (d) { return BizMoney.isOverdue(d); });
    var pending = docs.filter(function (d) { return d.payment_status !== 'paid' && !BizMoney.isOverdue(d); });

    var paidVal    = paid.reduce(function (s, d)    { return s + (d.total_p || 0); }, 0);
    var overdueVal = overdue.reduce(function (s, d) { return s + (d.total_p || 0); }, 0);
    var pendingVal = pending.reduce(function (s, d) { return s + (d.total_p || 0); }, 0);

    return '<div class="page__header">' +
        '<div>' +
          '<h1 class="page__title">Invoices</h1>' +
          '<p class="page__subtitle">' + docs.length + ' invoice' + (docs.length !== 1 ? 's' : '') + '</p>' +
        '</div>' +
        '<div style="display:flex;gap:var(--sp-3)">' +
          '<button class="btn btn-secondary" id="btn-from-quot">' + _iConvert() + ' From Quotation</button>' +
          '<button class="btn btn-primary"   id="btn-new-inv">'   + _iPlus()   + ' New Invoice</button>' +
        '</div>' +
      '</div>' +

      /* Summary strip */
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5)">' +
        _summaryCard('Paid',    paid.length,    BizMoney.format(paidVal,    sym), 'green',  '#059669') +
        _summaryCard('Pending', pending.length, BizMoney.format(pendingVal, sym), 'amber',  '#B45309') +
        _summaryCard('Overdue', overdue.length, BizMoney.format(overdueVal, sym), 'red',    '#DC2626') +
      '</div>' +

      /* Filter tabs */
      '<div class="inv-tabs" id="inv-tabs">' +
        '<button class="inv-tab active" data-filter="all">All</button>' +
        '<button class="inv-tab" data-filter="paid">Paid</button>' +
        '<button class="inv-tab" data-filter="pending">Pending</button>' +
        '<button class="inv-tab" data-filter="overdue">Overdue</button>' +
      '</div>' +

      '<div class="toolbar" style="margin-top:var(--sp-3)">' +
        '<div class="toolbar__search">' +
          _iSearch() +
          '<input type="search" id="inv-search" placeholder="Search by reference or customer…" autocomplete="off"/>' +
        '</div>' +
      '</div>' +

      '<div id="inv-list-wrap">' + _invTable(docs, sym) + '</div>';
  }

  function _summaryCard(label, count, value, colour, textColour) {
    return '<div class="stat-card">' +
      '<div>' +
        '<div style="font-size:22px;font-weight:800;color:' + textColour + '">' + count + '</div>' +
        '<div style="font-size:12px;color:var(--clr-text-muted);font-weight:500">' + label + ' Invoices</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--clr-text);margin-top:4px">' + value + '</div>' +
      '</div>' +
      '<div class="stat-card__icon icon-' + colour + '">' + _iInvoiceIcon() + '</div>' +
    '</div>';
  }

  function _invTable(docs, sym) {
    if (!docs.length) {
      return '<div class="card"><div class="empty-state">' +
        _iEmptyInv() +
        '<h3>No invoices yet</h3>' +
        '<p>Create your first invoice or convert a quotation.</p>' +
        '<button class="btn btn-primary" style="margin-top:var(--sp-4)" id="btn-empty-new">New Invoice</button>' +
      '</div></div>';
    }

    var rows = docs
      .slice().sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })
      .map(function (d) {
        var customer = BizStorage.getCustomerById(d.customer_id);
        var cname    = customer ? (customer.company || customer.name) : '—';
        var cls      = _statusClass(d);
        var lbl      = _statusLabel(d);
        var isOverdue= cls === 'overdue';

        return '<tr>' +
          '<td><span style="font-weight:600">' + _esc(d.reference_no) + '</span></td>' +
          '<td>' + _esc(cname) + '</td>' +
          '<td class="td-muted">' + _fmtDate(d.issue_date) + '</td>' +
          '<td class="td-muted' + (isOverdue ? '" style="color:var(--clr-danger);font-weight:600' : '') + '">' +
            _fmtDate(d.due_date) + '</td>' +
          '<td style="text-align:right;font-weight:600">' + BizMoney.format(d.total_p || 0, sym) + '</td>' +
          '<td>' +
            '<span class="badge badge-' + cls + '">' + lbl + '</span>' +
          '</td>' +
          '<td class="td-actions">' +
            '<button class="btn btn-ghost btn-icon btn-sm inv-status" data-id="' + d.id + '" title="Toggle status">' + _iStatus() + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm inv-print"  data-id="' + d.id + '" title="Print/PDF">'   + _iPrint()  + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm inv-dup"    data-id="' + d.id + '" title="Duplicate">'   + _iDup()    + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm inv-edit"   data-id="' + d.id + '" title="Edit">'        + _iEdit()   + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm inv-delete" data-id="' + d.id + '" title="Delete" style="color:var(--clr-danger)">' + _iDelete() + '</button>' +
          '</td>' +
        '</tr>';
      }).join('');

    return '<div class="table-wrap"><table>' +
      '<thead><tr>' +
        '<th>Reference</th><th>Customer</th><th>Issue Date</th>' +
        '<th>Due Date</th><th style="text-align:right">Amount</th>' +
        '<th>Status</th><th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';
  }

  function _bindListEvents(docs, settings) {
    var sym = settings.currency_symbol || '₹';

    /* New invoice */
    document.getElementById('btn-new-inv').addEventListener('click', function () {
      BizRouter.navigate('/invoices/new');
    });

    /* Convert from quotation */
    document.getElementById('btn-from-quot').addEventListener('click', function () {
      _showConvertModal();
    });

    /* Empty state button */
    var btnEmpty = document.getElementById('btn-empty-new');
    if (btnEmpty) btnEmpty.addEventListener('click', function () { BizRouter.navigate('/invoices/new'); });

    /* Filter tabs */
    document.querySelectorAll('.inv-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.inv-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var filter = tab.getAttribute('data-filter');
        var all    = BizStorage.getDocuments().filter(function (d) { return d.type === 'invoice'; });
        var filtered = _filterDocs(all, filter);
        var q = (document.getElementById('inv-search') || {}).value || '';
        if (q) filtered = _searchDocs(filtered, q.toLowerCase());
        document.getElementById('inv-list-wrap').innerHTML = _invTable(filtered, sym);
        _bindTableBtns();
      });
    });

    /* Search */
    var search = document.getElementById('inv-search');
    if (search) {
      search.addEventListener('input', function () {
        var q      = this.value.trim().toLowerCase();
        var filter = (document.querySelector('.inv-tab.active') || {}).getAttribute('data-filter') || 'all';
        var all    = BizStorage.getDocuments().filter(function (d) { return d.type === 'invoice'; });
        var filtered = _filterDocs(_searchDocs(all, q), filter);
        document.getElementById('inv-list-wrap').innerHTML = _invTable(filtered, sym);
        _bindTableBtns();
      });
    }

    _bindTableBtns();
  }

  function _filterDocs(docs, filter) {
    if (filter === 'paid')    return docs.filter(function (d) { return d.payment_status === 'paid'; });
    if (filter === 'overdue') return docs.filter(function (d) { return BizMoney.isOverdue(d); });
    if (filter === 'pending') return docs.filter(function (d) { return d.payment_status !== 'paid' && !BizMoney.isOverdue(d); });
    return docs;
  }

  function _searchDocs(docs, q) {
    if (!q) return docs;
    return docs.filter(function (d) {
      var c = BizStorage.getCustomerById(d.customer_id);
      return (d.reference_no || '').toLowerCase().includes(q) ||
             (c ? (c.company || c.name || '').toLowerCase().includes(q) : false);
    });
  }

  function _bindTableBtns() {
    /* Edit */
    document.querySelectorAll('.inv-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BizRouter.navigate('/invoices/edit/' + btn.getAttribute('data-id'));
      });
    });

    /* Print */
    document.querySelectorAll('.inv-print').forEach(function (btn) {
      btn.addEventListener('click', function () { _printDoc(btn.getAttribute('data-id')); });
    });

    /* Duplicate */
    document.querySelectorAll('.inv-dup').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var copy = BizStorage.duplicateDocument(btn.getAttribute('data-id'));
        if (copy) {
          BizToast.show('Invoice duplicated: ' + copy.reference_no, 'success');
          _renderList();
        }
      });
    });

    /* Quick status toggle */
    document.querySelectorAll('.inv-status').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _quickStatusToggle(btn.getAttribute('data-id'));
      });
    });

    /* Delete */
    document.querySelectorAll('.inv-delete').forEach(function (btn) {
      btn.addEventListener('click', function () { _confirmDelete(btn.getAttribute('data-id')); });
    });
  }

  /* ---- Quick status toggle ---- */
  function _quickStatusToggle(id) {
    var doc = BizStorage.getDocumentById(id);
    if (!doc) return;
    var next = doc.payment_status === 'paid' ? 'pending' : 'paid';
    BizStorage.saveDocument({ id: id, payment_status: next });
    BizToast.show('Status updated to ' + next + '.', 'success');
    _renderList();
  }

  /* ============================================================
     CONVERT FROM QUOTATION MODAL
     ============================================================ */
  function _showConvertModal() {
    var quotations = BizStorage.getDocuments().filter(function (d) { return d.type === 'quotation'; });

    if (!quotations.length) {
      BizToast.show('No quotations available to convert.', 'warning');
      return;
    }

    var rows = quotations.map(function (q) {
      var customer = BizStorage.getCustomerById(q.customer_id);
      var cname    = customer ? (customer.company || customer.name) : '—';
      var settings = BizStorage.getSettings();
      var sym      = settings.currency_symbol || '₹';

      return '<tr style="cursor:pointer" class="quot-row" data-id="' + q.id + '">' +
        '<td><span style="font-weight:600">' + _esc(q.reference_no) + '</span></td>' +
        '<td>' + _esc(cname) + '</td>' +
        '<td class="td-muted">' + _fmtDate(q.issue_date) + '</td>' +
        '<td style="text-align:right;font-weight:600">' + BizMoney.format(q.total_p || 0, sym) + '</td>' +
        '<td>' +
          '<button class="btn btn-primary btn-sm convert-btn" data-id="' + q.id + '">' +
            _iConvert() + ' Convert' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.id  = 'convert-wrap';
    wrap.innerHTML =
      '<div class="modal-overlay open" id="convert-modal">' +
        '<div class="modal" style="max-width:620px">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Convert Quotation to Invoice</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-convert">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p style="font-size:13px;color:var(--clr-text-muted);margin-bottom:var(--sp-4)">' +
              'Select a quotation to convert. The original quotation will not be changed.' +
            '</p>' +
            '<div class="table-wrap">' +
              '<table><thead><tr>' +
                '<th>Reference</th><th>Customer</th><th>Date</th>' +
                '<th style="text-align:right">Amount</th><th></th>' +
              '</tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary" id="close-convert-2">Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    function _close() {
      var w = document.getElementById('convert-wrap');
      if (w) w.parentNode.removeChild(w);
    }

    document.getElementById('close-convert').addEventListener('click',   _close);
    document.getElementById('close-convert-2').addEventListener('click', _close);
    document.getElementById('convert-modal').addEventListener('click', function (e) {
      if (e.target === this) _close();
    });

    document.querySelectorAll('.convert-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _close();
        BizRouter.navigate('/invoices/from/' + btn.getAttribute('data-id'));
      });
    });
  }

  /* ============================================================
     CREATE / EDIT FORM
     ============================================================ */
  function _renderForm(editId, fromQuotId) {
    var existing  = editId    ? BizStorage.getDocumentById(editId)    : null;
    var sourceQ   = fromQuotId? BizStorage.getDocumentById(fromQuotId): null;
    var settings  = BizStorage.getSettings();
    var customers = BizStorage.getCustomers();

    /* Pre-fill from quotation if converting */
    var prefill = existing || sourceQ || {};
    var items   = (prefill.items && prefill.items.length)
      ? prefill.items
      : [_blankItem(settings.default_gst_bp || 1800)];

    var title = existing  ? 'Edit Invoice'
              : sourceQ   ? 'Invoice from ' + sourceQ.reference_no
              : 'New Invoice';

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render(title, existing ? 'Update invoice details' : 'Create a professional invoice') +
        '<main class="page" id="page-root" style="max-width:100%">' +
          '<div class="quot-layout">' +
            '<div class="quot-form-col">' +
              _formHtml(prefill, customers, settings, items, !!sourceQ) +
            '</div>' +
            '<div class="quot-preview-col">' +
              '<div class="quot-preview-sticky">' +
                '<div class="quot-preview-header">' +
                  '<span style="font-weight:700;font-size:14px">Live A4 Preview</span>' +
                  '<button class="btn btn-primary btn-sm" id="btn-print-preview">' + _iPrint() + ' Print / PDF</button>' +
                '</div>' +
                '<div class="quot-preview-wrap">' +
                  '<div id="inv-preview" class="print-area">' +
                    _buildPreview(prefill, customers, settings, items) +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindFormEvents(existing, settings, !!sourceQ);
  }

  function _blankItem(defaultGst) {
    return {
      description: '', quantity_milli: 1000,
      unit_price_p: 0, discount_type: 'percent',
      discount_value: 0, tax_rate_bp: defaultGst || 1800,
    };
  }

  /* ---- Form HTML ---- */
  function _formHtml(prefill, customers, settings, items, isConversion) {
    var v       = prefill || {};
    var today   = BizStorage._today();
    var dueDate = v.due_date || _addDays(today, 15);

    var customerOptions = customers.map(function (c) {
      var sel = (v.customer_id === c.id) ? ' selected' : '';
      return '<option value="' + c.id + '"' + sel + '>' + _esc(c.company || c.name) + '</option>';
    }).join('');

    var statusOptions = ['pending','paid'].map(function (s) {
      var lbl = s.charAt(0).toUpperCase() + s.slice(1);
      var sel = (v.payment_status === s || (!v.payment_status && s === 'pending')) ? ' selected' : '';
      return '<option value="' + s + '"' + sel + '>' + lbl + '</option>';
    }).join('');

    return (isConversion
      ? '<div class="card" style="margin-bottom:var(--sp-4);border-left:4px solid var(--clr-success)">' +
          '<div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="color:var(--clr-success)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
            '<span style="font-size:13px;font-weight:600;color:var(--clr-success)">Converted from quotation — original is unchanged.</span>' +
          '</div>' +
        '</div>'
      : '') +

    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Invoice Details</div></div>' +

      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label required" for="i-customer">Customer</label>' +
          '<select id="i-customer" class="form-control">' +
            '<option value="">— Select customer —</option>' +
            customerOptions +
          '</select>' +
          '<div class="form-error" id="err-i-customer"></div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="i-ref">Invoice No.</label>' +
          '<input id="i-ref" type="text" class="form-control" value="' + _esc(v.reference_no || '') + '" placeholder="Auto-generated if blank"/>' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label required" for="i-date">Issue Date</label>' +
          '<input id="i-date" type="date" class="form-control" value="' + (v.issue_date || today) + '"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="i-due">Due Date</label>' +
          '<input id="i-due" type="date" class="form-control" value="' + dueDate + '"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="i-status">Payment Status</label>' +
          '<select id="i-status" class="form-control">' + statusOptions + '</select>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* Line items — same as quotation */
    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header">' +
        '<div class="card-title">Items / Services</div>' +
        '<button class="btn btn-secondary btn-sm" id="btn-add-item">' + _iPlus() + ' Add Item</button>' +
      '</div>' +
      '<div id="items-container">' +
        items.map(function (item, idx) { return _itemRowHtml(item, idx); }).join('') +
      '</div>' +
    '</div>' +

    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Totals</div></div>' +
      '<div id="totals-summary" style="max-width:340px;margin-left:auto">' +
        _totalsHtml({ subtotal_p:0, total_discount_p:0, total_tax_p:0, grand_total_p:0 }, settings.currency_symbol||'₹') +
      '</div>' +
    '</div>' +

    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Notes & Terms</div></div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label" for="i-notes">Notes</label>' +
          '<textarea id="i-notes" class="form-control" rows="3" placeholder="Payment instructions…">' + _esc(v.notes || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="i-terms">Terms</label>' +
          '<textarea id="i-terms" class="form-control" rows="3" placeholder="Late payment terms…">' + _esc(v.terms || '') + '</textarea>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-8)">' +
      '<button class="btn btn-primary"   id="btn-save-inv">' + _iSave() + ' Save Invoice</button>' +
      '<button class="btn btn-secondary" id="btn-cancel-inv">Cancel</button>' +
    '</div>';
  }

  /* ---- Item row (same structure as quotations) ---- */
  function _itemRowHtml(item, idx) {
    var discOptions = ['percent','fixed'].map(function (t) {
      return '<option value="' + t + '"' + (item.discount_type===t?' selected':'') + '>' +
        (t==='percent'?'% Disc':'₹ Disc') + '</option>';
    }).join('');
    var gstOptions = [0,500,1200,1800,2800].map(function (bp) {
      return '<option value="' + bp + '"' + (item.tax_rate_bp===bp?' selected':'') + '>' +
        (bp/100) + '%</option>';
    }).join('');

    return '<div class="item-row" data-idx="' + idx + '">' +
      '<div class="item-row__main">' +
        '<div class="form-group" style="flex:3">' +
          (idx===0?'<label class="form-label">Description</label>':'') +
          '<input type="text" class="form-control item-desc" placeholder="Item or service description" value="' + _esc(item.description||'') + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx===0?'<label class="form-label">Qty</label>':'') +
          '<input type="number" class="form-control item-qty" min="0" step="0.001" value="' + ((item.quantity_milli||1000)/1000) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1.5;min-width:110px">' +
          (idx===0?'<label class="form-label">Unit Price (₹)</label>':'') +
          '<input type="number" class="form-control item-price" min="0" step="0.01" value="' + ((item.unit_price_p||0)/100) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx===0?'<label class="form-label">Disc Type</label>':'') +
          '<select class="form-control item-disc-type">' + discOptions + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx===0?'<label class="form-label">Disc Val</label>':'') +
          '<input type="number" class="form-control item-disc-val" min="0" step="0.01" value="' + (item.discount_value||0) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx===0?'<label class="form-label">GST</label>':'') +
          '<select class="form-control item-gst">' + gstOptions + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:90px">' +
          (idx===0?'<label class="form-label">Line Total</label>':'') +
          '<div class="item-total" style="padding:var(--sp-2) var(--sp-3);font-weight:700;font-size:13px;' +
               'color:var(--clr-primary);background:var(--clr-bg);border-radius:var(--r-md);' +
               'border:1px solid var(--clr-border);text-align:right">₹0.00</div>' +
        '</div>' +
        '<div style="' + (idx===0?'padding-top:24px':'') + '">' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-remove-item" style="color:var(--clr-danger)">' + _iDelete() + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _totalsHtml(calc, sym) {
    sym = sym || '₹';
    return [['Subtotal', BizMoney.format(calc.subtotal_p,sym)],
            ['Discount','- '+BizMoney.format(calc.total_discount_p,sym)],
            ['GST',      BizMoney.format(calc.total_tax_p,sym)]
    ].map(function(r){
      return '<div style="display:flex;justify-content:space-between;padding:var(--sp-2) 0;' +
             'border-bottom:1px solid var(--clr-border);font-size:13px;color:var(--clr-text-muted)">' +
        '<span>'+r[0]+'</span><span>'+r[1]+'</span></div>';
    }).join('') +
    '<div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;' +
         'font-size:16px;font-weight:800;color:var(--clr-text);margin-top:var(--sp-1)">' +
      '<span>Grand Total</span>' +
      '<span style="color:var(--clr-primary)">' + BizMoney.format(calc.grand_total_p,sym) + '</span>' +
    '</div>';
  }

  /* ============================================================
     LIVE A4 INVOICE PREVIEW
     ============================================================ */
  function _buildPreview(doc, customers, settings, items) {
    var custId   = _selVal('i-customer') || (doc && doc.customer_id) || '';
    var customer = custId ? BizStorage.getCustomerById(custId) : null;
    var refNo    = _val('i-ref')    || (doc && doc.reference_no) || 'INV-XXXX';
    var issueDate= _val('i-date')   || (doc && doc.issue_date)   || BizStorage._today();
    var dueDate  = _val('i-due')    || (doc && doc.due_date)     || '';
    var status   = _selVal('i-status') || (doc && doc.payment_status) || 'pending';
    var notes    = _val('i-notes')  || (doc && doc.notes)  || '';
    var terms    = _val('i-terms')  || (doc && doc.terms)  || '';
    var calc     = BizMoney.calcDocument(items);
    var sym      = settings.currency_symbol || '₹';
    var s        = settings;

    var statusColour = status === 'paid' ? '#059669' : (BizMoney.isOverdue({payment_status:status,due_date:dueDate}) ? '#DC2626' : '#B45309');
    var statusLabel  = status === 'paid' ? 'PAID'    : (BizMoney.isOverdue({payment_status:status,due_date:dueDate}) ? 'OVERDUE' : 'PENDING');

    var itemRows = items.map(function (item, i) {
      var line   = calc.lines[i] || { line_total_p: 0 };
      var qty    = ((item.quantity_milli||0)/1000).toFixed(item.quantity_milli%1000===0?0:3);
      var discStr= item.discount_value
        ? (item.discount_type==='percent' ? item.discount_value+'%' : BizMoney.format(item.discount_value,sym))
        : '—';
      return '<tr style="border-bottom:1px solid #E2E8F0">' +
        '<td style="padding:8px 6px;font-size:11.5px">' + _esc(item.description||'') + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + qty + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right">' + BizMoney.format(item.unit_price_p||0,sym) + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + discStr + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + ((item.tax_rate_bp||0)/100).toFixed(0) + '%</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right;font-weight:600">' + BizMoney.format(line.line_total_p,sym) + '</td>' +
      '</tr>';
    }).join('');

    return '<div style="background:white;padding:32px 36px;font-family:Inter,sans-serif;font-size:12px;color:#0B163F;min-height:297mm;box-sizing:border-box">' +

      /* Header */
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #2563EB">' +
        '<div>' +
          '<div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">BizDocs AI</div>' +
          '<div style="font-size:11px;color:#64748B;font-weight:500">' + _esc(s.business_name||'') + '</div>' +
          (s.address ? '<div style="font-size:10.5px;color:#94A3B8;margin-top:2px">' + _esc(s.address) + '</div>' : '') +
          (s.gst_number ? '<div style="font-size:10.5px;color:#94A3B8">GST: ' + _esc(s.gst_number) + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:20px;font-weight:800;color:#2563EB;letter-spacing:-0.5px">INVOICE</div>' +
          '<div style="font-size:13px;font-weight:700;color:#0B163F;margin-top:4px">' + _esc(refNo) + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;margin-top:4px">Date: ' + _fmtDate(issueDate) + '</div>' +
          (dueDate ? '<div style="font-size:10.5px;color:#64748B">Due: ' + _fmtDate(dueDate) + '</div>' : '') +
          '<div style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;' +
               'background:' + statusColour + ';color:white;font-size:10px;font-weight:700;letter-spacing:1px">' +
            statusLabel +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Bill to */
      '<div style="margin-bottom:24px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:8px">Bill To</div>' +
        '<div style="background:#F8FAFC;border-radius:8px;padding:14px 16px;border-left:3px solid #2563EB">' +
          (customer
            ? '<div style="font-weight:700;font-size:13px">' + _esc(customer.name) + '</div>' +
              (customer.company ? '<div style="color:#64748B;font-size:11.5px">' + _esc(customer.company) + '</div>' : '') +
              (customer.address ? '<div style="color:#94A3B8;font-size:11px;margin-top:2px">' + _esc(customer.address) + '</div>' : '') +
              (customer.email   ? '<div style="color:#64748B;font-size:11px">' + _esc(customer.email) + '</div>' : '') +
              (customer.gst_number ? '<div style="color:#94A3B8;font-size:10.5px">GST: ' + _esc(customer.gst_number) + '</div>' : '')
            : '<div style="color:#94A3B8;font-size:12px">No customer selected</div>') +
        '</div>' +
      '</div>' +

      /* Items */
      '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<thead><tr style="background:linear-gradient(135deg,#2563EB,#7C3AED)">' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:left">Description</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">Qty</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Rate</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:60px">Disc</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">GST</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Amount</th>' +
        '</tr></thead>' +
        '<tbody>' + (itemRows||'<tr><td colspan="6" style="padding:16px;text-align:center;color:#94A3B8">No items</td></tr>') + '</tbody>' +
      '</table>' +

      /* Totals */
      '<div style="display:flex;justify-content:flex-end;margin-bottom:24px">' +
        '<div style="width:240px">' + _previewTotals(calc,sym) + '</div>' +
      '</div>' +

      /* Notes/Terms */
      (notes||terms
        ? '<div style="border-top:1px solid #E2E8F0;padding-top:16px;margin-bottom:16px">' +
            (notes?'<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px">Notes</div><div style="font-size:11px;color:#475569;line-height:1.6">'+_esc(notes)+'</div></div>':'') +
            (terms?'<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px">Terms</div><div style="font-size:11px;color:#475569;line-height:1.6">'+_esc(terms)+'</div></div>':'') +
          '</div>'
        : '') +

      /* Footer */
      '<div style="border-top:2px solid #E2E8F0;padding-top:14px;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-size:10px;color:#94A3B8">' + (s.email?_esc(s.email)+'  ':'') + (s.phone?'| '+_esc(s.phone):'') + '</div>' +
        '<div style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">BizDocs AI — Smart Documents. Faster Business.</div>' +
      '</div>' +

    '</div>';
  }

  function _previewTotals(calc, sym) {
    return [['Subtotal',BizMoney.format(calc.subtotal_p,sym),false],
            ['Discount','- '+BizMoney.format(calc.total_discount_p,sym),false],
            ['GST',BizMoney.format(calc.total_tax_p,sym),false],
            ['Grand Total',BizMoney.format(calc.grand_total_p,sym),true]
    ].map(function(r){
      return '<div style="display:flex;justify-content:space-between;padding:'+(r[2]?'10px 12px':'6px 12px')+';' +
        'background:'+(r[2]?'linear-gradient(135deg,#2563EB,#7C3AED)':'transparent')+';' +
        'border-radius:'+(r[2]?'6px':'0')+';margin-top:'+(r[2]?'6px':'0')+'">' +
        '<span style="font-size:'+(r[2]?'12px':'11px')+';font-weight:'+(r[2]?'700':'500')+';color:'+(r[2]?'white':'#64748B')+'">'+r[0]+'</span>' +
        '<span style="font-size:'+(r[2]?'13px':'11px')+';font-weight:'+(r[2]?'800':'600')+';color:'+(r[2]?'white':'#0B163F')+'">'+r[1]+'</span>' +
      '</div>';
    }).join('');
  }

  /* ============================================================
     FORM EVENTS
     ============================================================ */
  function _bindFormEvents(existing, settings) {
    document.getElementById('btn-add-item').addEventListener('click', function () {
      var container = document.getElementById('items-container');
      var idx       = container.querySelectorAll('.item-row').length;
      var div       = document.createElement('div');
      div.innerHTML = _itemRowHtml(_blankItem(settings.default_gst_bp||1800), idx);
      container.appendChild(div.firstChild);
      _bindItemEvents(settings);
      _recalcAll(settings);
    });

    document.getElementById('btn-print-preview').addEventListener('click', function () {
      _triggerPrint(existing ? existing.id : null, settings);
    });

    document.getElementById('btn-save-inv').addEventListener('click', function () {
      _saveInvoice(existing, settings);
    });

    document.getElementById('btn-cancel-inv').addEventListener('click', function () {
      BizRouter.navigate('/invoices');
    });

    _bindItemEvents(settings);
    _recalcAll(settings);
  }

  function _bindItemEvents(settings) {
    document.querySelectorAll('.btn-remove-item').forEach(function (btn) {
      btn.onclick = function () {
        var row = btn.closest('.item-row');
        if (document.querySelectorAll('.item-row').length <= 1) {
          BizToast.show('At least one item is required.', 'warning'); return;
        }
        row.parentNode.removeChild(row);
        _recalcAll(settings);
      };
    });
    document.querySelectorAll('.item-desc,.item-qty,.item-price,.item-disc-type,.item-disc-val,.item-gst').forEach(function (inp) {
      inp.oninput = inp.onchange = function () { _recalcAll(settings); };
    });
    ['i-customer','i-ref','i-date','i-due','i-status','i-notes','i-terms'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.oninput = el.onchange = function () { _refreshPreview(settings); };
    });
  }

  function _readItems() {
    var rows = document.querySelectorAll('.item-row');
    var items = [];
    rows.forEach(function (row) {
      var qty      = parseFloat(row.querySelector('.item-qty').value)       || 0;
      var price    = parseFloat(row.querySelector('.item-price').value)     || 0;
      var discVal  = parseFloat(row.querySelector('.item-disc-val').value)  || 0;
      var discType = row.querySelector('.item-disc-type').value;
      var gstBp    = parseInt(row.querySelector('.item-gst').value)         || 0;
      items.push({
        description:    row.querySelector('.item-desc').value.trim(),
        quantity_milli: Math.round(qty   * 1000),
        unit_price_p:   Math.round(price * 100),
        discount_type:  discType,
        discount_value: discType==='fixed' ? Math.round(discVal*100) : discVal,
        tax_rate_bp:    gstBp,
      });
    });
    return items;
  }

  function _recalcAll(settings) {
    var items = _readItems();
    var calc  = BizMoney.calcDocument(items);
    var sym   = settings.currency_symbol || '₹';
    document.querySelectorAll('.item-row').forEach(function (row, i) {
      var el = row.querySelector('.item-total');
      if (el && calc.lines[i]) el.textContent = BizMoney.format(calc.lines[i].line_total_p, sym);
    });
    var tot = document.getElementById('totals-summary');
    if (tot) tot.innerHTML = _totalsHtml(calc, sym);
    _refreshPreview(settings);
  }

  function _refreshPreview(settings) {
    var items    = _readItems();
    var customers= BizStorage.getCustomers();
    var preview  = document.getElementById('inv-preview');
    if (preview) preview.innerHTML = _buildPreview(null, customers, settings, items);
  }

  function _saveInvoice(existing, settings) {
    var customerId = _selVal('i-customer');
    var issueDate  = _val('i-date');
    if (!customerId) {
      var e = document.getElementById('err-i-customer');
      if (e) { e.textContent='Please select a customer.'; e.classList.add('show'); }
      return;
    }
    if (!issueDate) { BizToast.show('Issue date is required.','warning'); return; }

    var items = _readItems();
    var calc  = BizMoney.calcDocument(items);

    var data = {
      type:           'invoice',
      customer_id:    customerId,
      issue_date:     issueDate,
      due_date:       _val('i-due')    || '',
      payment_status: _selVal('i-status') || 'pending',
      notes:          _val('i-notes') || '',
      terms:          _val('i-terms') || '',
      items:          items,
      subtotal_p:     calc.subtotal_p,
      discount_p:     calc.total_discount_p,
      tax_p:          calc.total_tax_p,
      total_p:        calc.grand_total_p,
    };
    var refOverride = _val('i-ref');
    if (refOverride) data.reference_no = refOverride;
    if (existing) data.id = existing.id;

    var saved = BizStorage.saveDocument(data);
    if (!saved) { BizToast.show('Could not save. Please try again.','error'); return; }
    BizToast.show(existing ? 'Invoice updated!' : 'Invoice saved: ' + saved.reference_no, 'success');
    BizRouter.navigate('/invoices');
  }

  /* ============================================================
     PRINT / PDF
     ============================================================ */
  function _printDoc(id) {
    var doc      = BizStorage.getDocumentById(id);
    var settings = BizStorage.getSettings();
    var customers= BizStorage.getCustomers();
    if (!doc) return;
    var w = window.open('','_blank');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>'+_esc(doc.reference_no)+'</title>' +
      '<style>body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}@page{size:A4 portrait;margin:14mm 16mm;}' +
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>' +
      _buildPreview(doc, customers, settings, doc.items||[]) +
      '<script>window.onload=function(){window.print();};<\/script></body></html>');
    w.document.close();
  }

  function _triggerPrint(docId, settings) {
    if (docId) { _printDoc(docId); return; }
    var items     = _readItems();
    var customers = BizStorage.getCustomers();
    var fakeDoc   = {
      reference_no:   _val('i-ref') || 'PREVIEW',
      issue_date:     _val('i-date'),
      due_date:       _val('i-due'),
      payment_status: _selVal('i-status') || 'pending',
      notes: _val('i-notes'), terms: _val('i-terms'),
      customer_id: _selVal('i-customer'),
      items: items,
    };
    var w = window.open('','_blank');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice Preview</title>' +
      '<style>body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}@page{size:A4 portrait;margin:14mm 16mm;}' +
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>' +
      _buildPreview(fakeDoc, customers, settings, items) +
      '<script>window.onload=function(){window.print();};<\/script></body></html>');
    w.document.close();
  }

  /* ============================================================
     DELETE CONFIRMATION
     ============================================================ */
  function _confirmDelete(id) {
    var doc  = BizStorage.getDocumentById(id);
    if (!doc) return;
    var wrap = document.createElement('div');
    wrap.id  = 'confirm-wrap';
    wrap.innerHTML =
      '<div class="modal-overlay open" id="confirm-modal">' +
        '<div class="modal" style="max-width:400px">' +
          '<div class="modal-header"><div class="modal-title">Delete Invoice</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-confirm">' + _iClose() + '</button></div>' +
          '<div class="modal-body"><p>Delete <strong>' + _esc(doc.reference_no) + '</strong>? This cannot be undone.</p></div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="cancel-del">Cancel</button>' +
            '<button class="btn btn-danger"    id="confirm-del">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    function _close() { var w=document.getElementById('confirm-wrap'); if(w) w.parentNode.removeChild(w); }
    document.getElementById('close-confirm').addEventListener('click', _close);
    document.getElementById('cancel-del').addEventListener('click',    _close);
    document.getElementById('confirm-del').addEventListener('click', function () {
      BizStorage.deleteDocument(id); _close();
      BizToast.show('Invoice deleted.', 'success');
      _renderList();
    });
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function _bindAvatar() {
    var btn=document.getElementById('avatar-btn'), menu=document.getElementById('avatar-menu');
    if (!btn||!menu) return;
    btn.addEventListener('click', function(e){ e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function(){ if(menu) menu.classList.remove('open'); });
  }
  function _statusClass(d) {
    if (d.payment_status==='paid') return 'paid';
    if (BizMoney.isOverdue(d))     return 'overdue';
    return 'pending';
  }
  function _statusLabel(d) {
    if (d.payment_status==='paid') return 'Paid';
    if (BizMoney.isOverdue(d))     return 'Overdue';
    return 'Pending';
  }
  function _val(id)    { var el=document.getElementById(id); return el?el.value.trim():''; }
  function _selVal(id) { var el=document.getElementById(id); return el?el.value:''; }
  function _esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _fmtDate(d) { if(!d) return '—'; var p=String(d).slice(0,10).split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d; }
  function _addDays(dateStr, days) {
    var d=new Date(dateStr); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10);
  }

  /* ---- Icons ---- */
  function _iPlus()       { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'; }
  function _iEdit()       { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'; }
  function _iDelete()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'; }
  function _iDup()        { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'; }
  function _iPrint()      { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>'; }
  function _iSave()       { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'; }
  function _iClose()      { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'; }
  function _iConvert()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>'; }
  function _iStatus()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>'; }
  function _iSearch()     { return '<svg class="toolbar__search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>'; }
  function _iInvoiceIcon(){ return '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>'; }
  function _iEmptyInv()   { return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>'; }

  return { render };
})();