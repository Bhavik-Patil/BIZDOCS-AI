/* ============================================================
   BizDocs AI — Document Generator
   Offline template-based generation with prompt parsing.
   NOT a real AI — uses pattern matching and templates.
   A clean hook is left for future API integration.
   ============================================================ */

var PageGenerator = (function () {

  /* Current state */
  var _state = {
    docType:  'quotation',
    fields:   {},
    items:    [],
    generated: false,
  };

  /* ============================================================
     ENTRY POINT
     ============================================================ */
  function render() {
    _state = { docType: 'quotation', fields: {}, items: [], generated: false };

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Create Document', 'Create documents from a simple description') +
        '<main class="page" id="page-root">' +
          _pageHtml() +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindEvents();
    var editId = window.location.hash.split('/generator/edit/')[1];
    if (editId) _loadExisting(editId);
  }

  /* ============================================================
     PAGE LAYOUT
     ============================================================ */
  function _pageHtml() {
    return '<div class="gen-layout">' +
      '<div class="gen-left">' +
        _promptPanel() +
        _typeSelector() +
        '<div id="gen-fields-panel"></div>' +
      '</div>' +
      '<div class="gen-right">' +
        '<div class="quot-preview-sticky">' +
          '<div class="quot-preview-header">' +
            '<span style="font-weight:700;font-size:14px">Document Preview</span>' +
            '<div style="display:flex;gap:var(--sp-2)" id="preview-actions" style="display:none">' +
              '<button class="btn btn-secondary btn-sm" id="btn-gen-print" style="display:none">' + _iPrint() + ' Print</button>' +
              '<button class="btn btn-primary btn-sm"   id="btn-gen-save"  style="display:none">' + _iSave()  + ' Save</button>' +
            '</div>' +
          '</div>' +
          '<div class="quot-preview-wrap">' +
            '<div id="gen-preview">' + _emptyPreview() + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- Prompt panel ---- */
  function _promptPanel() {
    return '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">' + _iSparkle() + ' Smart Generator</div>' +
          '<div class="card-subtitle">Template-based — type a description and we fill the fields</div>' +
        '</div>' +
        '<select id="gen-provider" class="form-control" style="width:auto"><option value="offline">Offline templates</option><option value="gemini">Gemini AI (online)</option></select>' +
        '<span class="form-hint">Gemini sends your prompt to Google. Review generated details before saving.</span>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label" for="gen-prompt">Describe your document</label>' +
        '<textarea id="gen-prompt" class="form-control" rows="3" ' +
          'placeholder="e.g. Create a quotation for ABC Enterprises for website development Rs 40000 with 18% GST"></textarea>' +
        '<div class="form-hint">Try: "Invoice for Nexus Digital for logo design Rs 15000" or "Business letter to Sharma &amp; Co regarding project update"</div>' +
      '</div>' +

      '<div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">' +
        '<button class="btn btn-primary" id="btn-generate">' + _iSparkle() + ' Generate</button>' +
        '<button class="btn btn-secondary" id="btn-clear-prompt">Clear</button>' +
      '</div>' +

      /* Example prompts */
      '<div style="margin-top:var(--sp-4)">' +
        '<div style="font-size:12px;font-weight:600;color:var(--clr-text-muted);margin-bottom:var(--sp-2)">Try an example:</div>' +
        '<div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">' +
          _exampleChip('Quotation for ABC Enterprises for website development Rs 40000 with 18% GST') +
          _exampleChip('Invoice for Nexus Digital for logo design Rs 15000 pending') +
          _exampleChip('Business letter to Sharma Co regarding annual maintenance proposal') +
          _exampleChip('Agreement with Patil Industries for software services Rs 50000') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _exampleChip(text) {
    return '<button class="example-chip" data-prompt="' + _esc(text) + '">' + _esc(text) + '</button>';
  }

  /* ---- Document type selector ---- */
  function _typeSelector() {
    var types = [
      { id: 'quotation',  label: 'Quotation',       icon: _iReceipt() },
      { id: 'invoice',    label: 'Invoice',          icon: _iInvoice() },
      { id: 'letter',     label: 'Business Letter',  icon: _iLetter()  },
      { id: 'agreement',  label: 'Agreement',        icon: _iAgreement()},
      { id: 'report',     label: 'Report',           icon: _iReport()  },
      { id: 'custom',     label: 'Custom',           icon: _iCustom()  },
    ];

    return '<div class="card" style="margin-bottom:var(--sp-4)">' +
      '<div class="card-header"><div class="card-title">Document Type</div></div>' +
      '<div class="gen-type-grid">' +
        types.map(function (t) {
          var active = _state.docType === t.id ? ' active' : '';
          return '<button class="gen-type-btn' + active + '" data-type="' + t.id + '">' +
            '<div class="gen-type-icon">' + t.icon + '</div>' +
            '<div class="gen-type-label">' + t.label + '</div>' +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---- Empty preview ---- */
  function _emptyPreview() {
    return '<div style="background:white;min-height:400px;display:flex;flex-direction:column;' +
           'align-items:center;justify-content:center;border-radius:8px;padding:40px">' +
      '<div style="opacity:.2;margin-bottom:16px">' + _iDocBig() + '</div>' +
      '<div style="font-size:14px;font-weight:600;color:#94A3B8">Your document will appear here</div>' +
      '<div style="font-size:12px;color:#CBD5E1;margin-top:6px">Type a description and click Generate</div>' +
    '</div>';
  }

  /* ============================================================
     PROMPT PARSER
     Extracts document fields from natural language.
     This is regex + keyword matching — not AI.
     ============================================================ */
  function _parsePrompt(prompt) {
    var text    = prompt.toLowerCase();
    var result  = { docType: _state.docType, customer: null, description: '', amount: 0, gstBp: BizStorage.getSettings().default_gst_bp ?? 1800, subject: '' };

    /* Detect document type */
    if (text.includes('invoice'))                                    result.docType = 'invoice';
    else if (text.includes('quotation') || text.includes('quote'))  result.docType = 'quotation';
    else if (text.includes('letter'))                               result.docType = 'letter';
    else if (text.includes('agreement') || text.includes('contract')) result.docType = 'agreement';
    else if (text.includes('custom'))                               result.docType = 'custom';
    else if (text.includes('report'))                               result.docType = 'report';

    /* Extract customer name — looks for "for <name>" or "to <name>" */
    var custMatch = prompt.match(/(?:for|to|with)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+for|\s+regarding|\s+rs\.?|\s+₹|\s+invoice|\s+quotation|,|$)/i);
    if (custMatch) {
      result.customer = custMatch[1].trim();
    }

    /* Extract amount — looks for Rs/rs/₹ followed by number */
    var amountMatch = prompt.match(/(?:rs\.?|₹|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(/,/g, '')) || 0;
    }

    /* Extract GST % */
    var gstMatch = prompt.match(/(\d+)\s*%\s*(?:gst|tax)/i);
    if (gstMatch) {
      result.gstBp = parseInt(gstMatch[1]) * 100;
    }

    /* Extract description of service/product */
    var descMatch = prompt.match(/for\s+[A-Za-z\s&.]+?\s+for\s+([A-Za-z\s]+?)(?:\s+rs\.?|\s+₹|\s+[0-9]|,|$)/i);
    if (descMatch) {
      result.description = descMatch[1].trim();
    } else {
      /* Fallback: take words between "for" keyword and amount */
      var fallback = prompt.match(/for\s+(.+?)(?:\s+rs\.?|\s+₹|\s+[0-9]|,|$)/i);
      if (fallback && fallback[1].length > 3) {
        result.description = fallback[1].trim();
      }
    }

    /* Subject for letters */
    var subjMatch = prompt.match(/regarding\s+(.+?)(?:\.|,|$)/i);
    if (subjMatch) result.subject = subjMatch[1].trim();

    result.description = (result.description || '').replace(/\s+for$/i,'').trim();
    return result;
  }

  /* ============================================================
     FIELDS PANEL — editable form after generation
     ============================================================ */
  function _buildFieldsPanel(parsed) {
    var customers = BizStorage.getCustomers();
    var settings  = BizStorage.getSettings();

    /* Try to find matching customer */
    var matchedCustomer = null;
    if (parsed.customer) {
      var searchTerm = parsed.customer.toLowerCase();
      matchedCustomer = customers.find(function (c) {
        return (c.name    || '').toLowerCase().includes(searchTerm) ||
               (c.company || '').toLowerCase().includes(searchTerm);
      });
    }

    var customerOptions = customers.map(function (c) {
      var sel = (matchedCustomer && matchedCustomer.id === c.id) ? ' selected' : '';
      return '<option value="' + c.id + '"' + sel + '>' + _esc(c.company || c.name) + '</option>';
    }).join('');

    var today    = BizStorage._today();
    var validEnd = _addDays(today, settings.default_validity_days || 30);
    var dueDate  = _addDays(today, 15);

    var isFinancial = ['quotation','invoice'].includes(parsed.docType);
    var isLetter    = ['letter','agreement','report','custom'].includes(parsed.docType);

    return '<div class="card" style="margin-bottom:var(--sp-4);border-left:4px solid var(--clr-primary)">' +
      '<div class="card-header">' +
        '<div class="card-title">Generated Fields</div>' +
        '<span style="font-size:12px;color:var(--clr-success);font-weight:600">' +
          '✓ Fields extracted — review and adjust' +
        '</span>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label required" for="gf-customer">Customer</label>' +
          '<select id="gf-customer" class="form-control">' +
            '<option value="">— Select customer —</option>' +
            customerOptions +
          '</select>' +
          (parsed.customer && !matchedCustomer
            ? '<div class="form-hint" style="color:var(--clr-warning)">⚠ "' + _esc(parsed.customer) + '" not found — please select manually.</div>'
            : '') +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="gf-date">Issue Date</label>' +
          '<input id="gf-date" type="date" class="form-control" value="' + today + '"/>' +
        '</div>' +
      '</div>' +

      (parsed.docType === 'quotation'
        ? '<div class="form-group"><label class="form-label" for="gf-valid">Valid Until</label>' +
          '<input id="gf-valid" type="date" class="form-control" value="' + validEnd + '"/></div>'
        : '') +

      (parsed.docType === 'invoice'
        ? '<div class="form-row">' +
            '<div class="form-group"><label class="form-label" for="gf-due">Due Date</label>' +
            '<input id="gf-due" type="date" class="form-control" value="' + dueDate + '"/></div>' +
            '<div class="form-group"><label class="form-label" for="gf-status">Payment Status</label>' +
            '<select id="gf-status" class="form-control"><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>' +
          '</div>'
        : '') +

      (isFinancial
        ? '<div class="form-group"><label class="form-label">Item / Service</label>' +
          '<div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;align-items:flex-end">' +
            '<div style="flex:3;min-width:180px"><input id="gf-desc" type="text" class="form-control" ' +
              'value="' + _esc(_capitalize(parsed.description || '')) + '" placeholder="Description"/></div>' +
            '<div style="flex:1;min-width:90px"><label style="font-size:11.5px;font-weight:600;display:block;margin-bottom:4px">Amount (₹)</label>' +
            '<input id="gf-amount" type="number" class="form-control" value="' + (parsed.amount || '') + '" min="0" step="0.01" placeholder="0.00"/></div>' +
            '<div style="flex:1;min-width:80px"><label style="font-size:11.5px;font-weight:600;display:block;margin-bottom:4px">GST</label>' +
            '<select id="gf-gst" class="form-control">' +
              [0,500,1200,1800,2800].map(function (bp) {
                return '<option value="' + bp + '"' + (parsed.gstBp===bp?' selected':'') + '>' + (bp/100).toFixed(0) + '%</option>';
              }).join('') +
            '</select></div>' +
          '</div>' +
        '</div>'
        : '') +

      (isLetter
        ? '<div class="form-group"><label class="form-label" for="gf-subject">Subject</label>' +
          '<input id="gf-subject" type="text" class="form-control" ' +
            'value="' + _esc(_capitalize(parsed.subject || parsed.description || '')) + '" ' +
            'placeholder="Subject of the document"/></div>' +
          '<div class="form-group"><label class="form-label" for="gf-body">Content</label>' +
          '<textarea id="gf-body" class="form-control" rows="5" ' +
            'placeholder="Document content — edit as needed">' + _esc(_defaultBody(parsed)) + '</textarea></div>'
        : '') +

      '<div class="form-group"><label class="form-label" for="gf-notes">Notes</label>' +
      '<input id="gf-notes" type="text" class="form-control" placeholder="Additional notes (optional)"/></div>' +

      '<div id="gen-fields-error" class="form-error"></div>' +

    '</div>';
  }

  function _defaultBody(parsed) {
    var settings = BizStorage.getSettings();
    var bname    = settings.business_name || 'Our Company';
    var date     = BizStorage._today();
    var subj     = parsed.subject || parsed.description || 'the above subject';
    var custName = parsed.customer || 'Sir/Madam';

    if (parsed.docType === 'letter') {
      return 'Dear ' + custName + ',\n\nWe are writing to you regarding ' + subj + '.\n\n' +
        'Please find the details enclosed herewith. We would be happy to discuss this further at your convenience.\n\n' +
        'Kindly revert at your earliest.\n\nYours sincerely,\n' + bname;
    }
    if (parsed.docType === 'agreement') {
      return 'This Agreement is entered into as of ' + date + ' between ' + bname + ' ("Service Provider") and ' +
        (parsed.customer || 'the Client') + ' ("Client").\n\n' +
        '1. SCOPE OF WORK\nThe Service Provider agrees to deliver ' + (subj || 'the agreed services') + '.\n\n' +
        '2. PAYMENT TERMS\nPayment shall be made as per the agreed schedule.\n\n' +
        '3. CONFIDENTIALITY\nBoth parties agree to maintain confidentiality of shared information.\n\n' +
        'Signed:\n_________________            _________________\n' + bname + '                ' + (parsed.customer || 'Client');
    }
    if (parsed.docType === 'report') {
      return 'EXECUTIVE SUMMARY\n\nThis report covers ' + (subj || 'the project status') + '.\n\n' +
        'KEY FINDINGS\n1. \n2. \n3. \n\nRECOMMENDATIONS\n1. \n2. \n\nCONCLUSION\n\nPrepared by: ' + bname;
    }
    return 'Document content for ' + (subj || parsed.docType) + '.\n\nPrepared by: ' + bname;
  }

  /* ============================================================
     PREVIEW BUILDER
     ============================================================ */
  function _buildPreview() {
    var settings  = BizStorage.getSettings();
    var customers = BizStorage.getCustomers();
    var sym       = settings.currency_symbol || '₹';

    var custId   = _selVal('gf-customer');
    var customer = custId ? BizStorage.getCustomerById(custId) : null;
    var date     = _val('gf-date') || BizStorage._today();
    var notes    = _val('gf-notes') || '';

    var docType  = _state.docType;
    var isFinancial = ['quotation','invoice'].includes(docType);

    /* Build item for financial docs */
    var items = [];
    if (isFinancial) {
      var desc    = _val('gf-desc')   || '';
      var amount  = parseFloat(_val('gf-amount') || '0') || 0;
      var gstBp   = parseInt(_selVal('gf-gst') || '1800') || 0;
      items = [{
        description:    desc,
        quantity_milli: 1000,
        unit_price_p:   BizMoney.toMinor(_val('gf-amount'), 2),
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    gstBp,
      }];
    }

    var calc  = BizMoney.calcDocument(items);
    var refNo = 'PREVIEW';

    if (docType === 'quotation' || docType === 'invoice') {
      var fakeDoc = {
        reference_no:   refNo,
        issue_date:     date,
        valid_until:    _val('gf-valid') || '',
        due_date:       _val('gf-due')   || '',
        payment_status: _selVal('gf-status') || 'pending',
        customer_id:    custId,
        notes:          notes,
        terms:          '',
        items:          items,
      };

      if (docType === 'quotation') {
        /* Reuse quotation preview — temporarily set form values */
        return _quotPreviewHtml(fakeDoc, customer, settings, items, calc, sym);
      } else {
        return _invPreviewHtml(fakeDoc, customer, settings, items, calc, sym);
      }
    }

    /* Letter / agreement / report / custom */
    var subject = _val('gf-subject') || '';
    var body    = _val('gf-body')    || '';
    return _letterPreviewHtml(docType, subject, body, customer, settings, date, notes);
  }

  /* ---- Quotation preview ---- */
  function _quotPreviewHtml(doc, customer, settings, items, calc, sym) {
    var s = settings;
    var itemRows = items.map(function (item, i) {
      var line = calc.lines[i] || { line_total_p: 0 };
      return '<tr style="border-bottom:1px solid #E2E8F0">' +
        '<td style="padding:8px 6px;font-size:11.5px">' + _esc(item.description||'') + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">1</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right">' + BizMoney.format(item.unit_price_p||0,sym) + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">—</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + ((item.tax_rate_bp||0)/100).toFixed(0) + '%</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right;font-weight:600">' + BizMoney.format(line.line_total_p,sym) + '</td>' +
      '</tr>';
    }).join('');

    return _docShell(s, 'QUOTATION', doc, customer, itemRows, calc, sym, '#2563EB');
  }

  /* ---- Invoice preview ---- */
  function _invPreviewHtml(doc, customer, settings, items, calc, sym) {
    var s = settings;
    var status = doc.payment_status || 'pending';
    var statusColour = status==='paid' ? '#059669' : '#B45309';
    var statusLabel  = status==='paid' ? 'PAID' : 'PENDING';

    var itemRows = items.map(function (item, i) {
      var line = calc.lines[i] || { line_total_p: 0 };
      return '<tr style="border-bottom:1px solid #E2E8F0">' +
        '<td style="padding:8px 6px;font-size:11.5px">' + _esc(item.description||'') + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">1</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right">' + BizMoney.format(item.unit_price_p||0,sym) + '</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">—</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:center">' + ((item.tax_rate_bp||0)/100).toFixed(0) + '%</td>' +
        '<td style="padding:8px 6px;font-size:11.5px;text-align:right;font-weight:600">' + BizMoney.format(line.line_total_p,sym) + '</td>' +
      '</tr>';
    }).join('');

    return _docShell(s, 'INVOICE', doc, customer, itemRows, calc, sym, statusColour, statusLabel);
  }

  /* ---- Shared document shell ---- */
  function _docShell(s, title, doc, customer, itemRows, calc, sym, accentColor, statusLabel) {
    return '<div style="background:white;padding:32px 36px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#0B163F;min-height:250mm;box-sizing:border-box">' +

      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #2563EB">' +
        '<div>' +
          '<div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">BizDocs AI</div>' +
          '<div style="font-size:11px;color:#64748B;font-weight:500">' + _esc(s.business_name||'') + '</div>' +
          (s.address ? '<div style="font-size:10.5px;color:#94A3B8;margin-top:2px">' + _esc(s.address) + '</div>' : '') +
          (s.gst_number ? '<div style="font-size:10.5px;color:#94A3B8">GST: ' + _esc(s.gst_number) + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:20px;font-weight:800;color:#2563EB;letter-spacing:-0.5px">' + title + '</div>' +
          '<div style="font-size:13px;font-weight:700;color:#0B163F;margin-top:4px">' + _esc(doc.reference_no||'PREVIEW') + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;margin-top:4px">Date: ' + _fmtDate(doc.issue_date) + '</div>' +
          (doc.valid_until ? '<div style="font-size:10.5px;color:#64748B">Valid: ' + _fmtDate(doc.valid_until) + '</div>' : '') +
          (doc.due_date    ? '<div style="font-size:10.5px;color:#64748B">Due: '   + _fmtDate(doc.due_date)    + '</div>' : '') +
          (statusLabel     ? '<div style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;background:' + accentColor + ';color:white;font-size:10px;font-weight:700;letter-spacing:1px">' + statusLabel + '</div>' : '') +
        '</div>' +
      '</div>' +

      '<div style="margin-bottom:24px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:8px">Bill To</div>' +
        '<div style="background:#F8FAFC;border-radius:8px;padding:14px 16px;border-left:3px solid #2563EB">' +
          (customer
            ? '<div style="font-weight:700;font-size:13px">' + _esc(customer.name) + '</div>' +
              (customer.company ? '<div style="color:#64748B;font-size:11.5px">' + _esc(customer.company) + '</div>' : '') +
              (customer.address ? '<div style="color:#94A3B8;font-size:11px;margin-top:2px">' + _esc(customer.address) + '</div>' : '') +
              (customer.email   ? '<div style="color:#64748B;font-size:11px">' + _esc(customer.email) + '</div>' : '')
            : '<div style="color:#94A3B8;font-size:12px">No customer selected</div>') +
        '</div>' +
      '</div>' +

      '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        '<thead><tr style="background:linear-gradient(135deg,#2563EB,#7C3AED)">' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:left">Description</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">Qty</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Rate</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:60px">Disc</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:center;width:50px">GST</th>' +
          '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;color:white;text-align:right;width:90px">Amount</th>' +
        '</tr></thead>' +
        '<tbody>' + (itemRows || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#94A3B8">No items</td></tr>') + '</tbody>' +
      '</table>' +

      '<div style="display:flex;justify-content:flex-end;margin-bottom:24px">' +
        '<div style="width:240px">' +
          [['Subtotal',BizMoney.format(calc.subtotal_p,sym),false],
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
          }).join('') +
        '</div>' +
      '</div>' +

      (doc.notes ? '<div style="border-top:1px solid #E2E8F0;padding-top:14px;margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:4px">Notes</div><div style="font-size:11px;color:#475569">' + _esc(doc.notes) + '</div></div>' : '') +

      '<div style="border-top:2px solid #E2E8F0;padding-top:14px;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-size:10px;color:#94A3B8">' + (s.email?_esc(s.email):'') + (s.phone?' | '+_esc(s.phone):'') + '</div>' +
        '<div style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">BizDocs AI — Smart Documents. Faster Business.</div>' +
      '</div>' +

    '</div>';
  }

  /* ---- Letter / agreement / report preview ---- */
  function _letterPreviewHtml(docType, subject, body, customer, settings, date, notes) {
    var s     = settings;
    var title = { letter: 'BUSINESS LETTER', agreement: 'AGREEMENT', report: 'REPORT', custom: 'DOCUMENT' }[docType] || 'DOCUMENT';

    return '<div style="background:white;padding:32px 36px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#0B163F;min-height:250mm;box-sizing:border-box">' +

      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #2563EB">' +
        '<div>' +
          '<div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">BizDocs AI</div>' +
          '<div style="font-size:11px;color:#64748B">' + _esc(s.business_name||'') + '</div>' +
          (s.address ? '<div style="font-size:10.5px;color:#94A3B8">' + _esc(s.address) + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:16px;font-weight:800;color:#2563EB">' + title + '</div>' +
          '<div style="font-size:10.5px;color:#64748B;margin-top:4px">Date: ' + _fmtDate(date) + '</div>' +
        '</div>' +
      '</div>' +

      (customer
        ? '<div style="margin-bottom:20px">' +
            '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;margin-bottom:6px">To</div>' +
            '<div style="font-weight:700;font-size:13px">' + _esc(customer.name) + '</div>' +
            (customer.company ? '<div style="color:#64748B;font-size:11.5px">' + _esc(customer.company) + '</div>' : '') +
            (customer.address ? '<div style="color:#94A3B8;font-size:11px">' + _esc(customer.address) + '</div>' : '') +
          '</div>'
        : '') +

      (subject
        ? '<div style="margin-bottom:20px;padding:12px 16px;background:#EFF6FF;border-radius:8px;border-left:3px solid #2563EB">' +
            '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2563EB;margin-bottom:4px">Subject</div>' +
            '<div style="font-size:13px;font-weight:600">' + _esc(subject) + '</div>' +
          '</div>'
        : '') +

      '<div style="font-size:12px;line-height:1.9;color:#374151;white-space:pre-line;margin-bottom:24px">' +
        _esc(body || '') +
      '</div>' +

      (notes
        ? '<div style="border-top:1px solid #E2E8F0;padding-top:14px;margin-bottom:14px">' +
            '<div style="font-size:11px;color:#64748B">' + _esc(notes) + '</div>' +
          '</div>'
        : '') +

      '<div style="border-top:2px solid #E2E8F0;padding-top:14px;display:flex;justify-content:space-between">' +
        '<div style="font-size:10px;color:#94A3B8">' + (s.email?_esc(s.email):'') + '</div>' +
        '<div style="font-size:10px;font-weight:700;background:linear-gradient(135deg,#2563EB,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">BizDocs AI — Smart Documents. Faster Business.</div>' +
      '</div>' +

    '</div>';
  }

  /* ============================================================
     SAVE GENERATED DOCUMENT
     ============================================================ */
  function _saveGenerated() {
    var custId   = _selVal('gf-customer');
    var date     = _val('gf-date');
    var notes    = _val('gf-notes') || '';
    var docType  = _state.docType;
    var settings = BizStorage.getSettings();

    if (!custId) {
      var e = document.getElementById('gen-fields-error');
      if (e) { e.textContent = 'Please select a customer.'; e.classList.add('show'); }
      return;
    }

    if (!BizStorage.validDate(date)) { BizToast.show('Enter a valid issue date.', 'warning'); return; }
    var data = {
      type:        docType,
      customer_id: custId,
      issue_date:  date,
      notes:       notes,
      terms:       '',
      items:       [],
      subtotal_p:  0, discount_p: 0, tax_p: 0, total_p: 0,
    };

    var isFinancial = ['quotation','invoice'].includes(docType);

    if (isFinancial) {
      var desc   = _val('gf-desc')   || '';
      var amount = Number(_val('gf-amount') || NaN);
      var gstBp  = parseInt(_selVal('gf-gst') || '1800') || 0;

      data.items = [{
        description:    desc,
        quantity_milli: 1000,
        unit_price_p:   BizMoney.toMinor(_val('gf-amount'), 2),
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    gstBp,
      }];

      var calc     = BizMoney.calcDocument(data.items);
      data.subtotal_p = calc.subtotal_p;
      data.discount_p = calc.total_discount_p;
      data.tax_p      = calc.total_tax_p;
      data.total_p    = calc.grand_total_p;
    }

    if (docType === 'quotation') {
      data.valid_until = _val('gf-valid') || '';
    }
    if (docType === 'invoice') {
      data.due_date       = _val('gf-due')    || '';
      data.payment_status = _selVal('gf-status') || 'pending';
    }
    if (!isFinancial) {
      data.body_json = {
        subject: _val('gf-subject') || '',
        body:    _val('gf-body')    || '',
      };
    }

    var editId = window.location.hash.split('/generator/edit/')[1];
    if (editId) data.id = editId;
    if (isFinancial) { var error = BizStorage.validateItems(data.items); if (error) { BizToast.show(error,'warning'); return; } }
    if (!isFinancial && !data.body_json.body.trim()) { BizToast.show('Document content is required.', 'warning'); return; }
    var saved = BizStorage.saveDocument(data);
    if (!saved) { BizToast.show('Could not save.', 'error'); return; }

    BizToast.show('Document saved: ' + saved.reference_no, 'success');
    BizRouter.navigate('/documents');
  }

  /* ============================================================
     PRINT GENERATED DOCUMENT
     ============================================================ */
  function _printGenerated() {
    var preview = document.getElementById('gen-preview');
    if (!preview) return;
    var html = preview.innerHTML;
    var w    = window.open('', '_blank');
    if (!w) { BizToast.show('Allow popups to print this document.', 'warning'); return; }
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Generated Document</title>' +
      '<style>body{margin:0;padding:0;font-family:Inter,"Segoe UI",sans-serif;}' +
      '@page{size:A4 portrait;margin:12mm;}table{width:100%;border-collapse:collapse;}tr{break-inside:avoid;}' +
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>' +
      '</head><body>' + html +
      '<script>window.onload=function(){window.print();};<\/script></body></html>'
    );
    w.document.close();
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function _bindEvents() {

    /* Example chips */
    document.querySelectorAll('.example-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.getElementById('gen-prompt').value = chip.getAttribute('data-prompt');
      });
    });

    /* Type selector */
    document.querySelectorAll('.gen-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.gen-type-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        _state.docType = btn.getAttribute('data-type');
        if (_state.generated) _refreshFieldsAndPreview();
      });
    });

    /* Generate button */
    document.getElementById('btn-generate').addEventListener('click', async function () {
      var prompt = (document.getElementById('gen-prompt').value || '').trim();
      if (!prompt) {
        BizToast.show('Please enter a description first.', 'warning');
        return;
      }
      var parsed      = _parsePrompt(prompt);
      if (document.getElementById('gen-provider').value === 'gemini') {
        if (location.protocol === 'file:') { BizToast.show('Run npm start and open localhost:3000 to use Gemini.', 'warning'); return; }
        var generateButton = this;
        generateButton.disabled = true;
        try {
          var response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:prompt,docType:_state.docType}), signal:AbortSignal.timeout(50000) });
          var output = await response.json();
          if (!response.ok) throw new Error(output.error || 'Gemini generation failed.');
          parsed = output;
        } catch (error) { BizToast.show(error.message || 'Gemini unavailable. Choose Offline templates to continue.', 'error'); return; }
        finally { generateButton.disabled = false; }
      }
      _state.docType  = parsed.docType;
      _state.generated= true;

      /* Update type selector UI */
      document.querySelectorAll('.gen-type-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-type') === parsed.docType);
      });

      /* Show fields panel */
      document.getElementById('gen-fields-panel').innerHTML = _buildFieldsPanel(parsed);
      if (parsed.body && document.getElementById('gf-body')) document.getElementById('gf-body').value = parsed.body;

      /* Show preview */
      _refreshPreviewFromFields();

      /* Show action buttons */
      var printBtn = document.getElementById('btn-gen-print');
      var saveBtn  = document.getElementById('btn-gen-save');
      if (printBtn) printBtn.style.display = 'inline-flex';
      if (saveBtn)  saveBtn.style.display  = 'inline-flex';

      /* Bind field change events */
      _bindFieldEvents();

      BizToast.show('Document generated! Review and adjust the fields.', 'success');
    });

    /* Clear */
    document.getElementById('btn-clear-prompt').addEventListener('click', function () {
      document.getElementById('gen-prompt').value = '';
      document.getElementById('gen-fields-panel').innerHTML = '';
      document.getElementById('gen-preview').innerHTML = _emptyPreview();
      _state.generated = false;
      var printBtn = document.getElementById('btn-gen-print');
      var saveBtn  = document.getElementById('btn-gen-save');
      if (printBtn) printBtn.style.display = 'none';
      if (saveBtn)  saveBtn.style.display  = 'none';
    });

    /* Print and Save (hidden until generated) */
    document.getElementById('btn-gen-print').addEventListener('click', _printGenerated);
    document.getElementById('btn-gen-save').addEventListener('click',  _saveGenerated);
  }

  function _bindFieldEvents() {
    var fieldIds = ['gf-customer','gf-date','gf-valid','gf-due','gf-status',
                    'gf-desc','gf-amount','gf-gst','gf-subject','gf-body','gf-notes'];
    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.oninput  = _refreshPreviewFromFields;
        el.onchange = _refreshPreviewFromFields;
      }
    });
  }

  function _refreshPreviewFromFields() {
    var preview = document.getElementById('gen-preview');
    if (preview) preview.innerHTML = _buildPreview();
  }

  function _refreshFieldsAndPreview() {
    var prompt = (document.getElementById('gen-prompt').value || '').trim();
    var parsed = _parsePrompt(prompt);
    parsed.docType = _state.docType;
    document.getElementById('gen-fields-panel').innerHTML = _buildFieldsPanel(parsed);
    _refreshPreviewFromFields();
    _bindFieldEvents();
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

  function _val(id)    { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function _selVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _fmtDate(d) { if (!d) return '—'; var p = String(d).slice(0,10).split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d; }
  function _capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _addDays(dateStr, days) {
    var d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
  }

  /* ---- Icons ---- */
  function _iSparkle()  { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9.5 2l.5 3.5L13.5 6l-3.5.5L9.5 10l-.5-3.5L5.5 6l3.5-.5L9.5 2zM3 12l.33 2.33L5.67 15l-2.34.33L3 18l-.33-2.67L.33 15l2.34-.33L3 12zm11 1l.25 1.75L16 15l-1.75.25L14 17l-.25-1.75L12 15l1.75-.25L14 13z"/></svg>'; }
  function _iReceipt()  { return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z"/></svg>'; }
  function _iInvoice()  { return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>'; }
  function _iLetter()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'; }
  function _iAgreement(){ return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 17h8v2H8v-2zm0-4h8v2H8v-2zm0-4h4v2H8V9z"/></svg>'; }
  function _iReport()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>'; }
  function _iCustom()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'; }
  function _iSave()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'; }
  function _iPrint()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>'; }
  function _iDocBig()   { return '<svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>'; }

  function _loadExisting(id) {
    var doc = BizStorage.getDocumentById(id);
    if (!doc) { BizToast.show('Document not found.','warning'); BizRouter.navigate('/documents'); return; }
    if (doc.type === 'quotation' || doc.type === 'invoice') { BizRouter.navigate('/' + (doc.type === 'quotation' ? 'quotations' : 'invoices') + '/edit/' + id); return; }
    _state.docType = doc.type; _state.generated = true;
    document.getElementById('gen-fields-panel').innerHTML = _buildFieldsPanel({docType:doc.type,subject:doc.body_json.subject});
    var values = {'gf-customer':doc.customer_id,'gf-date':doc.issue_date,'gf-subject':doc.body_json.subject,'gf-body':doc.body_json.body,'gf-notes':doc.notes};
    Object.keys(values).forEach(function(key){var el=document.getElementById(key);if(el)el.value=values[key]||'';});
    document.querySelectorAll('.gen-type-btn').forEach(function(b){b.classList.toggle('active',b.dataset.type===doc.type);b.disabled=true;});
    document.getElementById('btn-generate').disabled=true;
    document.getElementById('btn-clear-prompt').disabled=true;
    document.getElementById('btn-gen-print').style.display='inline-flex';
    document.getElementById('btn-gen-save').style.display='inline-flex';
    document.getElementById('btn-gen-save').textContent='Save changes';
    _bindFieldEvents(); _refreshPreviewFromFields();
  }
  // Provider boundary: a future AI adapter can implement this same parsed-field contract.
  return { render, parsePrompt:_parsePrompt };

})();
