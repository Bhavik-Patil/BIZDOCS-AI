/* ============================================================
   BizDocs AI — Quotations page
   List, create, edit, duplicate, delete, print
   ============================================================ */

var PageQuotations = (function () {

  /* ============================================================
     ENTRY POINT — reads hash to decide which view to show
     ============================================================ */
  function render() {
    var hash = window.location.hash || '';
    if (hash.includes('/quotations/new'))    return _renderForm(null);
    if (hash.includes('/quotations/edit/')) {
      var id = hash.split('/quotations/edit/')[1];
      return _renderForm(id);
    }
    _renderList();
  }

  /* ============================================================
     LIST VIEW
     ============================================================ */
  function _renderList() {
    var docs     = BizStorage.getDocuments().filter(function (d) { return d.type === 'quotation'; });
    var settings = BizStorage.getSettings();

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Quotations', 'Create and manage quotations') +
        '<main class="page" id="page-root">' +
          _listHtml(docs, settings) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindListEvents(docs, settings);
  }

  function _listHtml(docs, settings) {
    var sym = settings.currency_symbol || '₹';
    return '<div class="page__header">' +
        '<div>' +
          '<h1 class="page__title">Quotations</h1>' +
          '<p class="page__subtitle">' + docs.length + ' quotation' + (docs.length !== 1 ? 's' : '') + '</p>' +
        '</div>' +
        '<button class="btn btn-primary" id="btn-new-quot">' +
          _iPlus() + ' New Quotation' +
        '</button>' +
      '</div>' +

      '<div class="toolbar">' +
        '<div class="toolbar__search">' +
          _iSearch() +
          '<input type="search" id="quot-search" placeholder="Search by reference, customer…" autocomplete="off"/>' +
        '</div>' +
      '</div>' +

      '<div id="quot-list-wrap">' + _quotTable(docs, sym) + '</div>';
  }

  function _quotTable(docs, sym) {
    if (!docs.length) {
      return '<div class="card"><div class="empty-state">' +
        _iEmptyDoc() +
        '<h3>No quotations yet</h3>' +
        '<p>Create your first quotation to get started.</p>' +
        '<button class="btn btn-primary" style="margin-top:var(--sp-4)" id="btn-empty-new">New Quotation</button>' +
      '</div></div>';
    }

    var rows = docs
      .slice().sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })
      .map(function (d) {
        var customer = BizStorage.getCustomerById(d.customer_id);
        var cname    = customer ? (customer.company || customer.name) : '—';
        var expired  = d.valid_until && d.valid_until < BizStorage._today();
        var statusBadge = expired
          ? '<span class="badge badge-overdue">Expired</span>'
          : '<span class="badge badge-quotation">Active</span>';

        return '<tr>' +
          '<td><span style="font-weight:600">' + _esc(d.reference_no) + '</span></td>' +
          '<td>' + _esc(cname) + '</td>' +
          '<td class="td-muted">' + _fmtDate(d.issue_date) + '</td>' +
          '<td class="td-muted">' + _fmtDate(d.valid_until) + '</td>' +
          '<td style="text-align:right;font-weight:600">' + BizMoney.format(d.total_p || 0, sym) + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td class="td-actions">' +
            '<button class="btn btn-ghost btn-icon btn-sm q-print"  data-id="' + d.id + '" title="Print/PDF">'     + _iPrint()  + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm q-dup"    data-id="' + d.id + '" title="Duplicate">'     + _iDup()    + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm q-edit"   data-id="' + d.id + '" title="Edit">'          + _iEdit()   + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm q-delete" data-id="' + d.id + '" title="Delete" style="color:var(--clr-danger)">' + _iDelete() + '</button>' +
          '</td>' +
        '</tr>';
      }).join('');

    return '<div class="table-wrap"><table>' +
      '<thead><tr>' +
        '<th>Reference</th><th>Customer</th><th>Date</th>' +
        '<th>Valid Until</th><th style="text-align:right">Amount</th>' +
        '<th>Status</th><th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';
  }

  function _bindListEvents(docs, settings) {
    var sym = settings.currency_symbol || '₹';

    var btnNew = document.getElementById('btn-new-quot');
    if (btnNew) btnNew.addEventListener('click', function () { BizRouter.navigate('/quotations/new'); });

    var btnEmpty = document.getElementById('btn-empty-new');
    if (btnEmpty) btnEmpty.addEventListener('click', function () { BizRouter.navigate('/quotations/new'); });

    var search = document.getElementById('quot-search');
    if (search) {
      search.addEventListener('input', function () {
        var q   = this.value.trim().toLowerCase();
        var all = BizStorage.getDocuments().filter(function (d) { return d.type === 'quotation'; });
        var filtered = q ? all.filter(function (d) {
          var c = BizStorage.getCustomerById(d.customer_id);
          return (d.reference_no || '').toLowerCase().includes(q) ||
                 (c ? (c.company || c.name || '').toLowerCase().includes(q) : false);
        }) : all;
        document.getElementById('quot-list-wrap').innerHTML = _quotTable(filtered, sym);
        _bindTableBtns();
      });
    }
    _bindTableBtns();
  }

  function _bindTableBtns() {
    document.querySelectorAll('.q-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BizRouter.navigate('/quotations/edit/' + btn.getAttribute('data-id'));
      });
    });
    document.querySelectorAll('.q-print').forEach(function (btn) {
      btn.addEventListener('click', function () { _printDoc(btn.getAttribute('data-id')); });
    });
    document.querySelectorAll('.q-dup').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var copy = BizStorage.duplicateDocument(btn.getAttribute('data-id'));
        if (copy) {
          BizToast.show('Quotation duplicated: ' + copy.reference_no, 'success');
          _renderList();
        }
      });
    });
    document.querySelectorAll('.q-delete').forEach(function (btn) {
      btn.addEventListener('click', function () { _confirmDelete(btn.getAttribute('data-id')); });
    });
  }

  /* ============================================================
     CREATE / EDIT FORM
     ============================================================ */
  function _renderForm(editId) {
    var doc      = editId ? BizStorage.getDocumentById(editId) : null;
    var settings = BizStorage.getSettings();
    var customers= BizStorage.getCustomers();
    var isEdit   = !!doc;

    // Default items for new quotation
    var items = (doc && doc.items && doc.items.length)
      ? doc.items
      : [_blankItem(settings.default_gst_bp ?? 1800)];

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render(
          isEdit ? 'Edit Quotation' : 'New Quotation',
          isEdit ? 'Update quotation details' : 'Create a professional quotation'
        ) +
        '<main class="page" id="page-root" style="max-width:100%">' +
          '<div class="quot-layout">' +
            '<div class="quot-form-col">' +
              _formHtml(doc, customers, settings, items) +
            '</div>' +
            '<div class="quot-preview-col">' +
              '<div class="quot-preview-sticky">' +
                '<div class="quot-preview-header">' +
                  '<span style="font-weight:700;font-size:14px">Live A4 Preview</span>' +
                  '<button class="btn btn-primary btn-sm" id="btn-print-preview">' + _iPrint() + ' Print / PDF</button>' +
                '</div>' +
                '<div class="quot-preview-wrap">' +
                  '<div id="quot-preview" class="print-area">' +
                    _buildPreview(doc, customers, settings, items) +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindFormEvents(doc, settings);
  }

  function _blankItem(defaultGst) {
    return {
      description:    '',
      quantity_milli: 1000,
      unit_price_p:   0,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    defaultGst ?? 1800,
    };
  }

  /* ---- Form HTML ---- */
  function _formHtml(doc, customers, settings, items) {
    var v          = doc || {};
    var today      = BizStorage._today();
    var validUntil = v.valid_until || _addDays(today, settings.default_validity_days || 30);

    var customerOptions = customers.map(function (c) {
      var sel = (v.customer_id === c.id) ? ' selected' : '';
      return '<option value="' + c.id + '"' + sel + '>' + _esc(c.company || c.name) + '</option>';
    }).join('');

    return '<div class="card" style="margin-bottom:var(--sp-4)">' +

      /* Header */
      '<div class="card-header">' +
        '<div class="card-title">Quotation Details</div>' +
      '</div>' +

      /* Customer + ref row */
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label required" for="q-customer">Customer</label>' +
          '<select id="q-customer" class="form-control">' +
            '<option value="">— Select customer —</option>' +
            customerOptions +
          '</select>' +
          '<div class="form-error" id="err-q-customer"></div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="q-ref">Quotation No.</label>' +
          '<input id="q-ref" type="text" class="form-control" value="' + _esc(v.reference_no || '') + '" placeholder="Auto-generated if blank"/>' +
        '</div>' +
      '</div>' +

      '<div class="form-group"><label class="form-label" for="q-external">Customer Reference (optional)</label>' +
      '<input id="q-external" class="form-control" value="' + _esc(v.external_reference || '') + '" placeholder="e.g. Project brief / purchase order"/></div>' +

      /* Dates row */
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label required" for="q-date">Issue Date</label>' +
          '<input id="q-date" type="date" class="form-control" value="' + (v.issue_date || today) + '"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="q-valid">Valid Until</label>' +
          '<input id="q-valid" type="date" class="form-control" value="' + validUntil + '"/>' +
        '</div>' +
      '</div>' +

    '</div>' +

    /* Line items */
    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header">' +
        '<div class="card-title">Items / Services</div>' +
        '<button class="btn btn-secondary btn-sm" id="btn-add-item">' + _iPlus() + ' Add Item</button>' +
      '</div>' +
      '<div id="items-container">' +
        items.map(function (item, idx) { return _itemRowHtml(item, idx); }).join('') +
      '</div>' +
    '</div>' +

    /* Totals summary */
    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Totals</div></div>' +
      '<div id="totals-summary" style="max-width:340px;margin-left:auto">' +
        _totalsHtml({ subtotal_p: 0, total_discount_p: 0, total_tax_p: 0, grand_total_p: 0 }, settings.currency_symbol || '₹') +
      '</div>' +
    '</div>' +

    /* Notes and terms */
    '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Notes & Terms</div></div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label" for="q-notes">Notes</label>' +
          '<textarea id="q-notes" class="form-control" rows="3" placeholder="Additional notes for the customer…">' + _esc(v.notes || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="q-terms">Terms & Conditions</label>' +
          '<textarea id="q-terms" class="form-control" rows="3" placeholder="Payment terms, delivery conditions…">' + _esc(v.terms || '') + '</textarea>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* Action buttons */
    '<div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-8)">' +
      '<button class="btn btn-primary" id="btn-save-quot">' + _iSave() + ' Save Quotation</button>' +
      '<button class="btn btn-secondary" id="btn-cancel-quot">Cancel</button>' +
    '</div>';
  }

  /* ---- Single item row ---- */
  function _itemRowHtml(item, idx) {
    var discOptions = ['percent','fixed'].map(function (t) {
      return '<option value="' + t + '"' + (item.discount_type === t ? ' selected' : '') + '>' +
        (t === 'percent' ? '% Disc' : '₹ Disc') + '</option>';
    }).join('');

    var gstOptions = [0,500,1200,1800,2800].map(function (bp) {
      return '<option value="' + bp + '"' + (item.tax_rate_bp === bp ? ' selected' : '') + '>' +
        (bp/100) + '%</option>';
    }).join('');

    return '<div class="item-row" data-idx="' + idx + '">' +
      '<div class="item-row__main">' +
        '<div class="form-group" style="flex:3">' +
          (idx === 0 ? '<label class="form-label">Description</label>' : '') +
          '<input type="text" class="form-control item-desc" placeholder="Item or service description" value="' + _esc(item.description || '') + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx === 0 ? '<label class="form-label">Qty</label>' : '') +
          '<input type="number" class="form-control item-qty" placeholder="1" min="0" step="0.001" value="' + ((item.quantity_milli || 1000) / 1000) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1.5;min-width:110px">' +
          (idx === 0 ? '<label class="form-label">Unit Price (₹)</label>' : '') +
          '<input type="number" class="form-control item-price" placeholder="0.00" min="0" step="0.01" value="' + ((item.unit_price_p || 0) / 100) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx === 0 ? '<label class="form-label">Disc Type</label>' : '') +
          '<select class="form-control item-disc-type">' + discOptions + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx === 0 ? '<label class="form-label">Disc Val</label>' : '') +
          '<input type="number" class="form-control item-disc-val" placeholder="0" min="0" step="0.01" value="' + (item.discount_value || 0) + '"/>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:80px">' +
          (idx === 0 ? '<label class="form-label">GST</label>' : '') +
          '<select class="form-control item-gst">' + gstOptions + '</select>' +
        '</div>' +
        '<div class="form-group" style="flex:1;min-width:90px">' +
          (idx === 0 ? '<label class="form-label">Line Total</label>' : '') +
          '<div class="item-total" style="padding:var(--sp-2) var(--sp-3);font-weight:700;font-size:13px;color:var(--clr-primary);background:var(--clr-bg);border-radius:var(--r-md);border:1px solid var(--clr-border);text-align:right">₹0.00</div>' +
        '</div>' +
        '<div style="' + (idx === 0 ? 'padding-top:24px' : '') + '">' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-remove-item" style="color:var(--clr-danger)" title="Remove item">' + _iDelete() + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- Totals summary HTML ---- */
  function _totalsHtml(calc, sym) {
    sym = sym || '₹';
    var rows = [
      ['Subtotal',  BizMoney.format(calc.subtotal_p,       sym)],
      ['Discount',  '- ' + BizMoney.format(calc.total_discount_p, sym)],
      ['GST',       BizMoney.format(calc.total_tax_p,      sym)],
    ];
    return rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;padding:var(--sp-2) 0;' +
             'border-bottom:1px solid var(--clr-border);font-size:13px;color:var(--clr-text-muted)">' +
        '<span>' + r[0] + '</span><span>' + r[1] + '</span>' +
      '</div>';
    }).join('') +
    '<div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;' +
         'font-size:16px;font-weight:800;color:var(--clr-text);margin-top:var(--sp-1)">' +
      '<span>Grand Total</span>' +
      '<span style="color:var(--clr-primary)">' + BizMoney.format(calc.grand_total_p, sym) + '</span>' +
    '</div>';
  }

  /* ============================================================
     LIVE A4 PREVIEW BUILDER
     ============================================================ */
  function _buildPreview(doc, customers, settings, items) {
    var customer = doc ? BizStorage.getCustomerById(doc.customer_id) : null;

    // If building from the live form, read current values
    var refNo    = _val('q-ref')     || (doc && doc.reference_no) || 'QT-XXXX';
    var issueDate= _val('q-date')    || (doc && doc.issue_date)   || BizStorage._today();
    var validDate= _val('q-valid')   || (doc && doc.valid_until)  || '';
    var notes    = _val('q-notes')   || (doc && doc.notes)        || '';
    var terms    = _val('q-terms')   || (doc && doc.terms)        || '';
    var externalRef = _val('q-external') || (doc && doc.external_reference) || '';
    var custSel  = _selVal('q-customer');
    if (custSel) customer = BizStorage.getCustomerById(custSel);

    var calc = BizMoney.calcDocument(items);
    var sym  = settings.currency_symbol || '₹';
    var s    = settings;

    var itemRows = items.map(function (item, i) {
      var line   = calc.lines[i] || { gross_p: 0, discount_p: 0, line_total_p: 0 };
      var qtyStr = ((item.quantity_milli || 0) / 1000).toFixed(item.quantity_milli % 1000 === 0 ? 0 : 3);
      var rate   = BizMoney.format(item.unit_price_p || 0, sym);
      var total  = BizMoney.format(line.line_total_p, sym);
      var gstPct = ((item.tax_rate_bp || 0) / 100).toFixed(0) + '%';
      var discStr= item.discount_value
        ? (item.discount_type === 'percent'
            ? item.discount_value + '%'
            : BizMoney.format(item.discount_value, sym))
        : '—';

      return '<tr style="border-bottom:1px solid #E2E8F0">' +
        '<td style="padding:8px 6px;font-size:11.5px">' + _esc(item.description || '') + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + qtyStr + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right">' + rate + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + discStr + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + gstPct + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right;font-weight:600">' + total + '</td>' +
      '</tr>';
    }).join('');

    return '<div style="background:white;padding:32px 36px;font-family:Segoe UI,Arial,sans-serif;' +
           'font-size:12px;color:#0B163F;min-height:250mm;box-sizing:border-box">' +

      /* Header */
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;' +
           'margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #2563EB">' +
        '<div>' +
          BizBrand.header(s) +
          (s.address ? '<div style="font-size:10.5px;color:#94A3B8;margin-top:2px">' + _esc(s.address) + '</div>' : '') +
          (s.gst_number ? '<div style="font-size:10.5px;color:#94A3B8">GST: ' + _esc(s.gst_number) + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:20px;font-weight:800;color:#2563EB;letter-spacing:-0.5px">QUOTATION</div>' +
          '<div style="font-size:13px;font-weight:700;color:#0B163F;margin-top:4px">' + _esc(refNo) + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;margin-top:4px">Date: ' + _fmtDate(issueDate) + '</div>' +
          (externalRef ? '<div style="font-size:10.5px;color:#64748B;margin-top:4px">Reference: ' + _esc(externalRef) + '</div>' : '') +
          (validDate ? '<div style="font-size:10.5px;color:#64748B">Valid: ' + _fmtDate(validDate) + '</div>' : '') +
        '</div>' +
      '</div>' +

      /* Bill to */
      '<div style="margin-bottom:24px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;' +
             'color:#64748B;margin-bottom:8px">Bill To</div>' +
        '<div style="background:#F8FAFC;border-radius:8px;padding:14px 16px;' +
             'border-left:3px solid #2563EB">' +
          (customer
            ? '<div style="font-weight:700;font-size:13px">' + _esc(customer.name) + '</div>' +
              (customer.company ? '<div style="color:#64748B;font-size:11.5px">' + _esc(customer.company) + '</div>' : '') +
              (customer.address ? '<div style="color:#94A3B8;font-size:11px;margin-top:2px">' + _esc(customer.address) + '</div>' : '') +
              (customer.email   ? '<div style="color:#64748B;font-size:11px">' + _esc(customer.email) + '</div>' : '') +
              (customer.gst_number ? '<div style="color:#94A3B8;font-size:10.5px">GST: ' + _esc(customer.gst_number) + '</div>' : '')
            : '<div style="color:#94A3B8;font-size:12px">No customer selected</div>'
          ) +
        '</div>' +
      '</div>' +

      /* Items table */
      '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<thead>' +
          '<tr style="background:linear-gradient(135deg,#2563EB,#7C3AED)">' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:left">Description</th>' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">Qty</th>' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Rate</th>' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:60px">Disc</th>' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">GST</th>' +
            '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Amount</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + (itemRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#94A3B8">No items added yet</td></tr>') + '</tbody>' +
      '</table>' +

      /* Totals */
      '<div style="display:flex;justify-content:flex-end;margin-bottom:24px">' +
        '<div style="width:240px">' +
          _previewTotalsHtml(calc, sym) +
        '</div>' +
      '</div>' +

      /* Notes and terms */
      (notes || terms
        ? '<div style="border-top:1px solid #E2E8F0;padding-top:16px;margin-bottom:16px">' +
            (notes ? '<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px">Notes</div>' +
              '<div style="font-size:11px;color:#475569;line-height:1.6">' + _esc(notes) + '</div></div>' : '') +
            (terms ? '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px">Terms & Conditions</div>' +
              '<div style="font-size:11px;color:#475569;line-height:1.6">' + _esc(terms) + '</div></div>' : '') +
          '</div>'
        : '') +

      /* Footer */
      '<div style="border-top:2px solid #E2E8F0;padding-top:14px;display:flex;' +
           'justify-content:space-between;align-items:center">' +
        '<div style="font-size:10px;color:#94A3B8">' +
          (s.email  ? _esc(s.email)  + '  ' : '') +
          (s.phone  ? '| ' + _esc(s.phone) : '') +
        '</div>' +
        '<div style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#2563EB,#7C3AED);' +
             '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">' +
          'BizDocs AI — Smart Documents. Faster Business.' +
        '</div>' +
      '</div>' +

    '</div>';
  }

  function _previewTotalsHtml(calc, sym) {
    var rows = [
      ['Subtotal',     BizMoney.format(calc.subtotal_p,       sym), false],
      ['Discount',     '- ' + BizMoney.format(calc.total_discount_p, sym), false],
      ['GST',          BizMoney.format(calc.total_tax_p,      sym), false],
      ['Grand Total',  BizMoney.format(calc.grand_total_p,    sym), true],
    ];
    return rows.map(function (r) {
      var isBold = r[2];
      return '<div style="display:flex;justify-content:space-between;' +
             'padding:' + (isBold ? '10px 12px' : '6px 12px') + ';' +
             'background:' + (isBold ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : 'transparent') + ';' +
             'border-radius:' + (isBold ? '6px' : '0') + ';' +
             'margin-top:' + (isBold ? '6px' : '0') + '">' +
        '<span style="font-size:' + (isBold ? '12px' : '11px') + ';font-weight:' + (isBold ? '700' : '500') + ';' +
              'color:' + (isBold ? 'white' : '#64748B') + '">' + r[0] + '</span>' +
        '<span style="font-size:' + (isBold ? '13px' : '11px') + ';font-weight:' + (isBold ? '800' : '600') + ';' +
              'color:' + (isBold ? 'white' : '#0B163F') + '">' + r[1] + '</span>' +
      '</div>';
    }).join('');
  }

  /* ============================================================
     FORM EVENTS — live updates, save, cancel
     ============================================================ */
  function _bindFormEvents(existingDoc, settings) {
    var sym = settings.currency_symbol || '₹';

    /* Add item */
    document.getElementById('btn-add-item').addEventListener('click', function () {
      var container = document.getElementById('items-container');
      var idx       = container.querySelectorAll('.item-row').length;
      var div       = document.createElement('div');
      div.innerHTML = _itemRowHtml(_blankItem(settings.default_gst_bp ?? 1800), idx);
      container.appendChild(div.firstChild);
      _bindItemEvents(settings);
      _recalcAll(settings);
    });

    /* Print button */
    document.getElementById('btn-print-preview').addEventListener('click', function () {
      _triggerPrint(existingDoc ? existingDoc.id : null, settings);
    });

    /* Save */
    document.getElementById('btn-save-quot').addEventListener('click', function () {
      _saveQuotation(existingDoc, settings);
    });

    /* Cancel */
    document.getElementById('btn-cancel-quot').addEventListener('click', function () {
      BizRouter.navigate('/quotations');
    });

    _bindItemEvents(settings);
    _recalcAll(settings);
  }

  function _bindItemEvents(settings) {
    /* Remove item buttons */
    document.querySelectorAll('.btn-remove-item').forEach(function (btn) {
      btn.onclick = function () {
        var row = btn.closest('.item-row');
        if (!row) return;
        var allRows = document.querySelectorAll('.item-row');
        if (allRows.length <= 1) {
          BizToast.show('At least one item is required.', 'warning');
          return;
        }
        row.parentNode.removeChild(row);
        _recalcAll(settings);
      };
    });

    /* Live recalc on any input change */
    var inputs = document.querySelectorAll(
      '.item-desc,.item-qty,.item-price,.item-disc-type,.item-disc-val,.item-gst'
    );
    inputs.forEach(function (inp) {
      inp.oninput  = function () { _recalcAll(settings); };
      inp.onchange = function () { _recalcAll(settings); };
    });

    /* Preview refresh on header fields */
    ['q-customer','q-ref','q-external','q-date','q-valid','q-notes','q-terms'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.oninput  = function () { _refreshPreview(settings); };
        el.onchange = function () { _refreshPreview(settings); };
      }
    });
  }

  /* ---- Read items from DOM ---- */
  function _readItems() {
    var rows  = document.querySelectorAll('.item-row');
    var items = [];
    rows.forEach(function (row) {
      var qty   = Number(row.querySelector('.item-qty').value || NaN);
      var price = Number(row.querySelector('.item-price').value || NaN);
      var discVal = Number(row.querySelector('.item-disc-val').value || NaN);
      var discType= row.querySelector('.item-disc-type').value;
      var gstBp   = parseInt(row.querySelector('.item-gst').value)   || 0;

      items.push({
        description:    row.querySelector('.item-desc').value.trim(),
        quantity_milli: BizMoney.toMinor(row.querySelector('.item-qty').value, 3),
        unit_price_p:   BizMoney.toMinor(row.querySelector('.item-price').value, 2),
        discount_type:  discType,
        discount_value: discType === 'fixed' ? BizMoney.toMinor(row.querySelector('.item-disc-val').value, 2) : discVal,
        tax_rate_bp:    gstBp,
      });
    });
    return items;
  }

  /* ---- Recalculate totals and update UI ---- */
  function _recalcAll(settings) {
    var items = _readItems();
    var calc  = BizMoney.calcDocument(items);
    var sym   = settings.currency_symbol || '₹';

    /* Update line totals */
    var rows = document.querySelectorAll('.item-row');
    rows.forEach(function (row, i) {
      var totalEl = row.querySelector('.item-total');
      if (totalEl && calc.lines[i]) {
        totalEl.textContent = BizMoney.format(calc.lines[i].line_total_p, sym);
      }
    });

    /* Update totals summary */
    var totalsEl = document.getElementById('totals-summary');
    if (totalsEl) totalsEl.innerHTML = _totalsHtml(calc, sym);

    /* Refresh preview */
    _refreshPreview(settings);
  }

  function _refreshPreview(settings) {
    var items    = _readItems();
    var customers= BizStorage.getCustomers();
    var preview  = document.getElementById('quot-preview');
    if (preview) {
      preview.innerHTML = _buildPreview(null, customers, settings, items);
    }
  }

  /* ---- Save quotation ---- */
  function _saveQuotation(existing, settings) {
    var customerId = _selVal('q-customer');
    var issueDate  = _val('q-date');

    /* Validate */
    var valid = true;
    if (!customerId) {
      var errEl = document.getElementById('err-q-customer');
      if (errEl) { errEl.textContent = 'Please select a customer.'; errEl.classList.add('show'); }
      valid = false;
    }
    if (!issueDate) { BizToast.show('Issue date is required.', 'warning'); valid = false; }
    if (!valid) return;

    var deadline = _val('q-valid');
    if (!BizStorage.validDate(issueDate) || (deadline && (!BizStorage.validDate(deadline) || deadline < issueDate))) { BizToast.show('Enter valid dates. The end date must be on or after the issue date.', 'warning'); return; }
    var items = _readItems();
    var itemError = BizStorage.validateItems(items);
    if (itemError) { BizToast.show(itemError, 'warning'); return; }
    var calc  = BizMoney.calcDocument(items);

    var data = {
      type:        'quotation',
      customer_id: customerId,
      issue_date:  issueDate,
      valid_until: _val('q-valid') || '',
      external_reference: _val('q-external'),
      notes:       _val('q-notes') || '',
      terms:       _val('q-terms') || '',
      items:       items,
      subtotal_p:  calc.subtotal_p,
      discount_p:  calc.total_discount_p,
      tax_p:       calc.total_tax_p,
      total_p:     calc.grand_total_p,
    };

    var refOverride = _val('q-ref');
    if (refOverride) data.reference_no = refOverride;

    if (existing) data.id = existing.id;

    var saved = BizStorage.saveDocument(data);
    if (!saved) { BizToast.show('Could not save. Please try again.', 'error'); return; }

   BizToast.show(existing ? 'Quotation updated!' : 'Quotation saved: ' + saved.reference_no, 'success');
   BizRouter.navigate('/quotations');
  }

  /* ---- Print / PDF ---- */
  function _printDoc(id) {
    var doc      = BizStorage.getDocumentById(id);
    var settings = BizStorage.getSettings();
    var customers= BizStorage.getCustomers();
    if (!doc) return;

    var printWin = window.open('', '_blank');
    if (!printWin) { BizToast.show('Allow popups to open the PDF print preview.', 'warning'); return; }
    printWin.document.write(
      '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8"/>' +
      '<title>' + _esc(doc.reference_no) + ' — BizDocs AI</title>' +
      '<style>' +
        'body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}' +
        '@page{size:A4 portrait;margin:12mm;}table{width:100%;border-collapse:collapse;}tr{break-inside:avoid;}' +
        '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}' +
      '</style>' +
      '</head><body>' +
      _buildPreview(doc, customers, settings, doc.items || []) +
      '<script>window.onload=function(){window.print();};<\/script>' +
      '</body></html>'
    );
    printWin.document.close();
  }

  function _triggerPrint(docId, settings) {

    var items    = _readItems();
    var customers= BizStorage.getCustomers();
    var printWin = window.open('', '_blank');
    if (!printWin) { BizToast.show('Allow popups to open the PDF print preview.', 'warning'); return; }
    var fakeDoc  = {
      reference_no: _val('q-ref') || 'PREVIEW',
      issue_date:   _val('q-date'),
      valid_until:  _val('q-valid'),
      external_reference: _val('q-external'),
      notes:        _val('q-notes'),
      terms:        _val('q-terms'),
      customer_id:  _selVal('q-customer'),
      items:        items,
    };
    printWin.document.write(
      '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8"/><title>Quotation Preview</title>' +
      '<style>body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}' +
      '@page{size:A4 portrait;margin:12mm;}table{width:100%;border-collapse:collapse;}tr{break-inside:avoid;}' +
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>' +
      '</head><body>' +
      _buildPreview(fakeDoc, customers, settings, items) +
      '<script>window.onload=function(){window.print();};<\/script>' +
      '</body></html>'
    );
    printWin.document.close();
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
            '<div class="modal-title">Delete Quotation</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-confirm">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p>Delete <strong>' + _esc(doc.reference_no) + '</strong>? This cannot be undone.</p>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="cancel-del">Cancel</button>' +
            '<button class="btn btn-danger"    id="confirm-del">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    function _close() { var w = document.getElementById('confirm-wrap'); if (w) w.parentNode.removeChild(w); }
    document.getElementById('close-confirm').addEventListener('click', _close);
    document.getElementById('cancel-del').addEventListener('click',    _close);
    document.getElementById('confirm-del').addEventListener('click', function () {
      if (!BizStorage.deleteDocument(id)) { BizToast.show('Could not delete. Check browser storage; a quotation linked to an invoice must be retained.', 'error'); return; }
      _close();
      BizToast.show('Quotation deleted.', 'success');
      _renderList();
    });
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
  function _val(id)    { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function _selVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _fmtDate(d) { if (!d) return '—'; var p = String(d).slice(0,10).split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d; }
  function _addDays(dateStr, days) {
    var d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /* ---- Icons ---- */
  function _iPlus()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'; }
  function _iEdit()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'; }
  function _iDelete()  { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'; }
  function _iDup()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'; }
  function _iPrint()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>'; }
  function _iSave()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'; }
  function _iClose()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'; }
  function _iSearch()  { return '<svg class="toolbar__search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>'; }
  function _iEmptyDoc(){ return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>'; }

  return { _buildPreview, render };
})();