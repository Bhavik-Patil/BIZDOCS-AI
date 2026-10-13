/* ============================================================
   BizDocs AI — Customers page
   Full CRUD: list, search, add, edit, delete with confirmation.
   Also shows each customer's document history.
   ============================================================ */

var PageCustomers = (function () {

  /* ---- Entry point ---- */
  function render() {
    // Check if URL has /new or /edit/:id
    var hash = window.location.hash || '';
    if (hash.includes('/customers/new'))  { return _renderForm(null); }
    if (hash.includes('/customers/edit/')) {
      var id = hash.split('/customers/edit/')[1];
      return _renderForm(id);
    }
    _renderList();
  }

  /* ================================================
     LIST VIEW
     ================================================ */
  function _renderList() {
    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render('Customers', 'Manage your customer records') +
        '<main class="page" id="page-root">' +
          _listHtml(BizStorage.getCustomers()) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindListEvents();
  }

  function _listHtml(customers) {
    return '<div class="page__header">' +
        '<div>' +
          '<h1 class="page__title">Customers</h1>' +
          '<p class="page__subtitle">' + customers.length + ' customer' + (customers.length !== 1 ? 's' : '') + ' total</p>' +
        '</div>' +
        '<button class="btn btn-primary" id="btn-add-customer">' +
          _iPlus() + ' Add Customer' +
        '</button>' +
      '</div>' +

      '<div class="toolbar">' +
        '<div class="toolbar__search">' +
          _iSearch() +
          '<input type="search" id="customer-search" placeholder="Search by name, company or email…" autocomplete="off"/>' +
        '</div>' +
      '</div>' +

      '<div id="customer-list-wrap">' +
        _customerTable(customers) +
      '</div>';
  }

  function _customerTable(customers) {
    if (!customers.length) {
      return '<div class="card"><div class="empty-state">' +
        _iUsersEmpty() +
        '<h3>No customers yet</h3>' +
        '<p>Add your first customer to get started.</p>' +
        '<button class="btn btn-primary" style="margin-top:var(--sp-4)" id="btn-empty-add">Add Customer</button>' +
      '</div></div>';
    }

    var rows = customers.map(function (c) {
      var docs     = BizStorage.getDocumentsByCustomer(c.id);
      var docCount = docs.length;
      var initials = _initials(c.name);

      return '<tr data-id="' + c.id + '">' +
        '<td>' +
          '<div style="display:flex;align-items:center;gap:var(--sp-3)">' +
            '<div style="width:36px;height:36px;border-radius:50%;background:var(--grad-primary);' +
                 'display:flex;align-items:center;justify-content:center;color:#fff;' +
                 'font-weight:700;font-size:13px;flex-shrink:0">' + initials + '</div>' +
            '<div>' +
              '<div style="font-weight:600;font-size:13.5px">' + _esc(c.name) + '</div>' +
              '<div style="font-size:12px;color:var(--clr-text-muted)">' + _esc(c.company || '') + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="td-muted">' + _esc(c.email || '—') + '</td>' +
        '<td class="td-muted">' + _esc(c.phone || '—') + '</td>' +
        '<td>' +
          '<span class="badge badge-quotation">' + docCount + ' doc' + (docCount !== 1 ? 's' : '') + '</span>' +
        '</td>' +
        '<td class="td-muted">' + _formatDate(c.created_at) + '</td>' +
        '<td class="td-actions">' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-view-customer" data-id="' + c.id + '" title="View documents">' + _iEye() + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-edit-customer" data-id="' + c.id + '" title="Edit">' + _iEdit() + '</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-delete-customer" data-id="' + c.id + '" title="Delete" style="color:var(--clr-danger)">' + _iDelete() + '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="table-wrap">' +
      '<table>' +
        '<thead><tr>' +
          '<th>Customer</th><th>Email</th><th>Phone</th>' +
          '<th>Documents</th><th>Added</th><th style="text-align:right">Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
  }

  /* ---- List events ---- */
  function _bindListEvents() {
    // Add button
    var btnAdd = document.getElementById('btn-add-customer');
    if (btnAdd) btnAdd.addEventListener('click', function () {
      BizRouter.navigate('/customers/new');
    });

    // Empty state add button
    var btnEmpty = document.getElementById('btn-empty-add');
    if (btnEmpty) btnEmpty.addEventListener('click', function () {
      BizRouter.navigate('/customers/new');
    });

    // Search
    var searchInput = document.getElementById('customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q         = this.value.trim().toLowerCase();
        var customers = BizStorage.getCustomers();
        var filtered  = q
          ? customers.filter(function (c) {
              return (c.name    || '').toLowerCase().includes(q) ||
                     (c.company || '').toLowerCase().includes(q) ||
                     (c.email   || '').toLowerCase().includes(q);
            })
          : customers;
        document.getElementById('customer-list-wrap').innerHTML = _customerTable(filtered);
        _bindTableButtons();
      });
    }

    _bindTableButtons();
  }

  function _bindTableButtons() {
    // View
    document.querySelectorAll('.btn-view-customer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _showCustomerModal(btn.getAttribute('data-id'));
      });
    });

    // Edit
    document.querySelectorAll('.btn-edit-customer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BizRouter.navigate('/customers/edit/' + btn.getAttribute('data-id'));
      });
    });

    // Delete
    document.querySelectorAll('.btn-delete-customer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _confirmDelete(btn.getAttribute('data-id'));
      });
    });
  }

  /* ================================================
     ADD / EDIT FORM
     ================================================ */
  function _renderForm(editId) {
    var customer = editId ? BizStorage.getCustomerById(editId) : null;
    var isEdit   = !!customer;
    var title    = isEdit ? 'Edit Customer' : 'Add Customer';
    var sub      = isEdit ? 'Update contact details' : 'Create a new customer record';

    document.getElementById('app').innerHTML =
      BizSidebar.render() +
      '<div class="main">' +
        BizHeader.render(title, sub) +
        '<main class="page" id="page-root">' +
          _formHtml(customer) +
        '</main>' +
      '</div>';

    _bindAvatar();
    _bindFormEvents(customer);
  }

  function _formHtml(c) {
    var v = c || {};
    return '<div style="max-width:700px">' +
      '<div class="card">' +
        '<div class="card-header">' +
          '<div class="card-title">Contact Information</div>' +
        '</div>' +

        '<div class="form-row">' +
          _field('cust-name',    'Full Name',    'text', v.name    || '', true,  'e.g. Rajesh Kumar') +
          _field('cust-company', 'Company',      'text', v.company || '', false, 'e.g. ABC Enterprises') +
        '</div>' +
        '<div class="form-row">' +
          _field('cust-email',   'Email',        'email', v.email  || '', false, 'e.g. rajesh@abc.com') +
          _field('cust-phone',   'Phone',        'tel',   v.phone  || '', false, 'e.g. +91 98765 43210') +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="cust-address">Address</label>' +
          '<textarea id="cust-address" class="form-control" rows="3" ' +
            'placeholder="Full business address">' + _esc(v.address || '') + '</textarea>' +
        '</div>' +
        '<div class="form-row">' +
          _field('cust-gst', 'GST Number', 'text', v.gst_number || '', false, 'e.g. 27AABCT1234L1Z5') +
        '</div>' +
        '<div id="form-error" class="form-error"></div>' +
      '</div>' +

      '<div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-5)">' +
        '<button class="btn btn-primary" id="btn-save-customer">' + _iSave() + ' Save Customer</button>' +
        '<button class="btn btn-secondary" id="btn-cancel-customer">Cancel</button>' +
      '</div>' +
    '</div>';
  }

  function _field(id, label, type, value, required, placeholder) {
    return '<div class="form-group">' +
      '<label class="form-label' + (required ? ' required' : '') + '" for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" class="form-control" ' +
        'value="' + _esc(value) + '" placeholder="' + _esc(placeholder) + '"' +
        (required ? ' required' : '') + '/>' +
      '<div class="form-error" id="err-' + id + '"></div>' +
    '</div>';
  }

  /* ---- Form events ---- */
  function _bindFormEvents(existing) {
    document.getElementById('btn-save-customer').addEventListener('click', function () {
      _submitForm(existing);
    });
    document.getElementById('btn-cancel-customer').addEventListener('click', function () {
      BizRouter.navigate('/customers');
    });
  }

  function _submitForm(existing) {
    // Collect values
    var name    = document.getElementById('cust-name').value.trim();
    var company = document.getElementById('cust-company').value.trim();
    var email   = document.getElementById('cust-email').value.trim();
    var phone   = document.getElementById('cust-phone').value.trim();
    var address = document.getElementById('cust-address').value.trim();
    var gst     = document.getElementById('cust-gst').value.trim();

    // Clear previous errors
    ['cust-name','cust-email'].forEach(function (id) {
      var el = document.getElementById('err-' + id);
      if (el) { el.textContent = ''; el.classList.remove('show'); }
    });
    var formErr = document.getElementById('form-error');
    formErr.textContent = '';
    formErr.classList.remove('show');

    // Validate
    var valid = true;
    if (!name) {
      _showFieldError('cust-name', 'Full name is required.');
      valid = false;
    }
    if (email && !_validEmail(email)) {
      _showFieldError('cust-email', 'Enter a valid email address.');
      valid = false;
    }
    if (!valid) return;

    // Save
    var data = {
      name:       name,
      company:    company,
      email:      email,
      phone:      phone,
      address:    address,
      gst_number: gst,
    };
    if (existing) data.id = existing.id;

    var saved = BizStorage.saveCustomer(data);
    if (!saved) {
      formErr.textContent = 'Could not save. Please try again.';
      formErr.classList.add('show');
      return;
    }

    BizToast.show(existing ? 'Customer updated.' : 'Customer added!', 'success');
    BizRouter.navigate('/customers');
  }

  function _showFieldError(fieldId, msg) {
    var input = document.getElementById(fieldId);
    var err   = document.getElementById('err-' + fieldId);
    if (input) input.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('show'); }
  }

  /* ================================================
     CUSTOMER DETAIL MODAL
     Shows customer info + their document history
     ================================================ */
  function _showCustomerModal(id) {
    var customer = BizStorage.getCustomerById(id);
    if (!customer) return;

    var docs     = BizStorage.getDocumentsByCustomer(id);
    var settings = BizStorage.getSettings();
    var sym      = settings.currency_symbol || '₹';

    var docRows = docs.length
      ? docs.map(function (d) {
          return '<tr>' +
            '<td><span style="font-weight:600">' + _esc(d.reference_no) + '</span></td>' +
            '<td><span class="badge badge-' + d.type + '">' + _cap(d.type) + '</span></td>' +
            '<td class="td-muted">' + _formatDate(d.issue_date) + '</td>' +
            '<td style="text-align:right;font-weight:600">' +
              (d.total_p ? BizMoney.format(d.total_p, sym) : '—') +
            '</td>' +
          '</tr>';
        }).join('')
      : '<tr><td colspan="4" style="text-align:center;color:var(--clr-text-muted);padding:var(--sp-6)">No documents yet</td></tr>';

    var modalHtml =
      '<div class="modal-overlay open" id="customer-modal">' +
        '<div class="modal" style="max-width:580px">' +
          '<div class="modal-header">' +
            '<div class="modal-title">' + _esc(customer.name) + '</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-modal">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">' +
              _infoRow('Company',    customer.company  || '—') +
              _infoRow('Email',      customer.email    || '—') +
              _infoRow('Phone',      customer.phone    || '—') +
              _infoRow('GST No.',    customer.gst_number || '—') +
              (customer.address ? _infoRow('Address', customer.address) : '') +
            '</div>' +

            '<div style="font-size:13px;font-weight:700;color:var(--clr-text);margin-bottom:var(--sp-3)">' +
              'Document History (' + docs.length + ')' +
            '</div>' +
            '<div class="table-wrap">' +
              '<table><thead><tr>' +
                '<th>Reference</th><th>Type</th><th>Date</th><th style="text-align:right">Amount</th>' +
              '</tr></thead>' +
              '<tbody>' + docRows + '</tbody></table>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="close-modal-2">Close</button>' +
            '<button class="btn btn-primary" id="edit-modal-customer">' +
              _iEdit() + ' Edit Customer' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Append modal to page (outside #app so it overlays correctly)
    var wrap = document.createElement('div');
    wrap.id  = 'modal-wrap';
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap);

    document.getElementById('edit-modal-customer').addEventListener('click',function(){_closeModal();BizRouter.navigate('/customers/edit/' + customer.id);});
    document.getElementById('close-modal').addEventListener('click',   _closeModal);
    document.getElementById('close-modal-2').addEventListener('click', _closeModal);
    document.getElementById('customer-modal').addEventListener('click', function (e) {
      if (e.target === this) _closeModal();
    });
  }

  function _infoRow(label, value) {
    return '<div>' +
      '<div style="font-size:11.5px;font-weight:600;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">' + label + '</div>' +
      '<div style="font-size:13.5px;color:var(--clr-text)">' + _esc(value) + '</div>' +
    '</div>';
  }

  function _closeModal() {
    var wrap = document.getElementById('modal-wrap');
    if (wrap) wrap.parentNode.removeChild(wrap);
  }

  /* ================================================
     DELETE CONFIRMATION
     ================================================ */
  function _confirmDelete(id) {
    var customer = BizStorage.getCustomerById(id);
    if (!customer) return;

    var docs = BizStorage.getDocumentsByCustomer(id);
    if (docs.length) { BizToast.show('This customer has saved documents. Keep the customer to preserve their document history.', 'warning'); return; }
    var warning = docs.length
      ? '<p style="color:var(--clr-warning);font-size:13px;margin-top:var(--sp-3)">' +
          '⚠ This customer has ' + docs.length + ' document' + (docs.length !== 1 ? 's' : '') +
          '. Their records will remain in the archive.' +
        '</p>'
      : '';

    var modalHtml =
      '<div class="modal-overlay open" id="confirm-modal">' +
        '<div class="modal" style="max-width:420px">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Delete Customer</div>' +
            '<button class="btn btn-ghost btn-icon" id="close-confirm">' + _iClose() + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p style="font-size:14px">Are you sure you want to delete <strong>' + _esc(customer.name) + '</strong>?</p>' +
            '<p style="font-size:13px;color:var(--clr-text-muted);margin-top:var(--sp-2)">This action cannot be undone.</p>' +
            warning +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="cancel-delete">Cancel</button>' +
            '<button class="btn btn-danger"    id="confirm-delete">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wrap    = document.createElement('div');
    wrap.id     = 'confirm-wrap';
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap);

    function _close() {
      var w = document.getElementById('confirm-wrap');
      if (w) w.parentNode.removeChild(w);
    }

    document.getElementById('close-confirm').addEventListener('click',  _close);
    document.getElementById('cancel-delete').addEventListener('click',  _close);
    document.getElementById('confirm-modal').addEventListener('click', function (e) {
      if (e.target === this) _close();
    });

    document.getElementById('confirm-delete').addEventListener('click', function () {
      if (!BizStorage.deleteCustomer(id)) { BizToast.show('Could not delete customer.', 'error'); return; }
      _close();
      BizToast.show('Customer deleted.', 'success');
      _renderList();
    });
  }

  /* ================================================
     SHARED HELPERS
     ================================================ */
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
    });
  }

  function _validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function _initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.charAt(0).toUpperCase();
  }
  function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _formatDate(d) {
    if (!d) return '—';
    var s = String(d).slice(0, 10);
    var p = s.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }

  /* ================================================
     INLINE SVG ICONS
     ================================================ */
  function _iPlus()      { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'; }
  function _iEdit()      { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'; }
  function _iDelete()    { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'; }
  function _iEye()       { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'; }
  function _iSave()      { return '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'; }
  function _iClose()     { return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'; }
  function _iSearch()    { return '<svg class="toolbar__search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>'; }
  function _iUsersEmpty(){ return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z"/></svg>'; }

  return { render };
})();