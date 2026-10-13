/* ============================================================
   BizDocs AI — Storage (localStorage repository)
   
   Key decisions:
   - All money amounts stored in PAISE (integer). ₹1 = 100 paise.
   - Tax rates stored in BASIS POINTS (bp). 18% = 1800 bp.
   - Dates stored as ISO strings (YYYY-MM-DD).
   - IDs are generated with _newId() — time + random, no server needed.
   ============================================================ */

var BizStorage = (function () {

  var KEYS = {
    settings:  'bd_settings',
    customers: 'bd_customers',
    documents: 'bd_documents',
    counters:  'bd_counters',
    session:   'bd_session',
  };

  /* ---- Low-level helpers ---- */

  function _read(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('BizStorage write error:', e);
      return false;
    }
  }

  function _newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function _now() { return new Date().toISOString(); }

  function _today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }

  /* ---- Settings ---- */

  function getSettings() {
    return _read(KEYS.settings) || {
      business_name:        'My Business',
      address:              '',
      phone:                '',
      email:                '',
      gst_number:           '',
      currency:             'INR',
      currency_symbol:      '₹',
      default_gst_bp:       1800,
      default_validity_days: 30,
      logo_data_url:        null,
    };
  }

  function saveSettings(data) {
    if (!data || !String(data.business_name || '').trim()) return false;
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return false;
    if (!Number.isInteger(data.default_validity_days) || data.default_validity_days < 1 || data.default_validity_days > 365) return false;
    if (!Number.isInteger(data.default_gst_bp) || data.default_gst_bp < 0 || data.default_gst_bp > 10000) return false;
    if (!['INR','USD','EUR','GBP','AED'].includes(data.currency)) return false;
    return _write(KEYS.settings, data);
  }

  /* ---- Session (demo auth) ---- */

  function login(email, password) {
    if (email === 'demo@bizdocs.ai' && password === 'demo123') {
      return _write(KEYS.session, { email: email, name: 'Demo User', loggedIn: true });
    }
    return false;
  }

  function logout() { localStorage.removeItem(KEYS.session); }

  function getSession() { return _read(KEYS.session); }

  function isLoggedIn() {
    var s = getSession();
    return s && s.loggedIn === true;
  }

  /* ---- Reference-number counters ---- */

  function _nextRef(type) {
    var counters = _read(KEYS.counters) || {};
    var n = (counters[type] || 0) + 1;
    var prefix = { quotation: 'QT', invoice: 'INV', letter: 'LTR', agreement: 'AGR', report: 'RPT', custom: 'DOC' };
    var ref;
    do { ref = (prefix[type] || 'DOC') + '-' + String(n++).padStart(4, '0'); } while (getDocuments().some(function(d){return d.reference_no === ref;}));
    counters[type] = n - 1;
    if (!_write(KEYS.counters, counters)) return null;
    return ref;
  }

  /* ---- Customers ---- */

  function getCustomers() {
    return _read(KEYS.customers) || [];
  }

  function getCustomerById(id) {
    return getCustomers().find(function (c) { return c.id === id; }) || null;
  }

  function saveCustomer(data) {
    if (!data || !String(data.name || '').trim()) return null;
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return null;
    var customers = getCustomers();
    if (data.id) {
      // Update
      var idx = customers.findIndex(function (c) { return c.id === data.id; });
      if (idx === -1) return null;
      customers[idx] = Object.assign({}, customers[idx], data, { updated_at: _now() });
    } else {
      // Insert
      data = Object.assign({}, data, { id: _newId(), created_at: _now(), updated_at: _now() });
      customers.push(data);
    }
    return _write(KEYS.customers, customers) ? data : null;
  }

  function deleteCustomer(id) {
    if (getDocumentsByCustomer(id).length) return false;
    var customers = getCustomers().filter(function (c) { return c.id !== id; });
    return _write(KEYS.customers, customers);
  }

  /* ---- Documents (quotations, invoices, generated docs) ---- */

  function getDocuments() {
    return _read(KEYS.documents) || [];
  }

  function getDocumentById(id) {
    return getDocuments().find(function (d) { return d.id === id; }) || null;
  }

  function getDocumentsByCustomer(customerId) {
    return getDocuments().filter(function (d) { return d.customer_id === customerId; });
  }

  function saveDocument(data) {
    if (!data || !data.type && !data.id) return null;
    var docs = getDocuments();
    if (data.id) {
      var previous = getDocumentById(data.id);
      if (!previous) return null;
      data = Object.assign({}, previous, data);
    }
    if (!['quotation','invoice','letter','agreement','report','custom'].includes(data.type)) return null;
    if (!getCustomerById(data.customer_id) || !validDate(data.issue_date)) return null;
    if (data.type === 'quotation' || data.type === 'invoice') {
      if (validateItems(data.items)) return null;
      var deadline = data.type === 'quotation' ? data.valid_until : data.due_date;
      if (deadline && (!validDate(deadline) || deadline < data.issue_date)) return null;
      if (data.type === 'invoice' && !['paid','pending','overdue'].includes(data.payment_status)) return null;
      var totals = BizMoney.calcDocument(data.items);
      data = Object.assign({}, data, {subtotal_p:totals.subtotal_p, discount_p:totals.total_discount_p, tax_p:totals.total_tax_p, total_p:totals.grand_total_p});
    } else if (!data.body_json || !String(data.body_json.body || '').trim()) return null;
    if (data.source_quotation_id) {
      var source = getDocumentById(data.source_quotation_id);
      if (data.type !== 'invoice' || !source || source.type !== 'quotation' || source.customer_id !== data.customer_id) return null;
      var linked = docs.find(function(d) { return d.type === 'invoice' && d.source_quotation_id === data.source_quotation_id && d.id !== data.id; });
      if (linked) return linked;
    }
    if (data.reference_no && docs.some(function(d) { return d.id !== data.id && d.reference_no === data.reference_no; })) return null;
    if (data.id) {
      var idx = docs.findIndex(function (d) { return d.id === data.id; });
      if (idx === -1) return null;
      docs[idx] = Object.assign({}, docs[idx], data, { updated_at: _now() });
    } else {
      var ref = data.reference_no || _nextRef(data.type);
      if (!ref) return null;
      data = Object.assign({ reference_no: ref }, data, {
        id: _newId(), created_at: _now(), updated_at: _now()
      });
      docs.push(data);
    }
    return _write(KEYS.documents, docs) ? data : null;
  }

  function deleteDocument(id) {
    if (getDocuments().some(function(d){return d.source_quotation_id === id;})) return false;
    var docs = getDocuments().filter(function (d) { return d.id !== id; });
    return _write(KEYS.documents, docs);
  }

  function duplicateDocument(id) {
    var original = getDocumentById(id);
    if (!original) return null;
    var copy = Object.assign({}, original);
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    // New reference number for the copy
    delete copy.reference_no;
    delete copy.source_quotation_id;
    copy.issue_date = _today();
    ['valid_until','due_date'].forEach(function(key){if(copy[key]) { var days=Math.max(1,Math.round((new Date(original[key])-new Date(original.issue_date))/86400000));var next=new Date(copy.issue_date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+days);copy[key]=next.toISOString().slice(0,10); }});
    if (copy.payment_status) copy.payment_status = 'pending';
    return saveDocument(copy);
  }

  /* ---- Dashboard stats (derived from stored data) ---- */

  function getStats() {
    var docs = getDocuments();
    var customers = getCustomers();
    var quotations = docs.filter(function (d) { return d.type === 'quotation'; });
    var invoices   = docs.filter(function (d) { return d.type === 'invoice'; });

    var pendingInvoices = invoices.filter(function (d) {
      if (d.payment_status === 'paid') return false;
      return true;
    });

    var pendingValue = pendingInvoices.reduce(function (sum, d) {
      return sum + (d.total_p || 0);
    }, 0);

    return {
      totalDocuments: docs.length,
      totalQuotations: quotations.length,
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      pendingInvoices: pendingInvoices.length,
      pendingValueP: pendingValue,
    };
  }

  function getRecentDocuments(limit) {
    limit = limit || 8;
    return getDocuments()
      .slice()
      .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })
      .slice(0, limit);
  }

  /* ---- Export backup ---- */

  function exportBackup() {
    var data = {
      exported_at:  _now(),
      version:      '1.0',
      settings:     getSettings(),
      customers:    getCustomers(),
      documents:    getDocuments(),
      counters:     _read(KEYS.counters) || {},
    };
    return JSON.stringify(data, null, 2);
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    var date = new Date(value + 'T12:00:00Z');
    return !isNaN(date) && date.toISOString().slice(0,10) === value;
  }
  function validateItems(items) {
    if (!Array.isArray(items) || !items.length) return 'Add at least one item.';
    for (var item of items) {
      if (!item || !String(item.description || '').trim()) return 'Each item needs a description.';
      if (!Number.isSafeInteger(item.quantity_milli) || item.quantity_milli <= 0 || item.quantity_milli > 1000000000) return 'Quantity must be greater than zero and within range.';
      if (!Number.isSafeInteger(item.unit_price_p) || item.unit_price_p < 0 || item.unit_price_p > 100000000000) return 'Enter a valid non-negative rate.';
      if (!Number.isFinite(item.discount_value) || item.discount_value < 0 || !['percent','fixed'].includes(item.discount_type)) return 'Enter a valid discount.';
      if (item.discount_type === 'fixed' && !Number.isSafeInteger(item.discount_value)) return 'Fixed discounts must use whole minor units.';
      if (item.discount_type === 'percent' && item.discount_value > 100) return 'Percentage discount cannot exceed 100%.';
      if (!Number.isSafeInteger(item.tax_rate_bp) || item.tax_rate_bp < 0 || item.tax_rate_bp > 10000) return 'GST must be between 0% and 100%.';
      if (!Number.isSafeInteger(item.quantity_milli * item.unit_price_p)) return 'Item amount is too large.';
      if (item.discount_type === 'fixed' && item.discount_value > BizMoney.calcLine(Object.assign({},item,{discount_value:0})).gross_p) return 'Fixed discount cannot exceed the item amount.';
    }
    if (!Number.isSafeInteger(BizMoney.calcDocument(items).grand_total_p)) return 'Document amount is too large.';
    return '';
  }

  /* ---- Public API ---- */
  return {
    getSettings, saveSettings, validateItems, validDate,
    login, logout, getSession, isLoggedIn,
    getCustomers, getCustomerById, saveCustomer, deleteCustomer,
    getDocuments, getDocumentById, getDocumentsByCustomer,
    saveDocument, deleteDocument, duplicateDocument,
    getStats, getRecentDocuments,
    exportBackup,
    _today,  // used by other modules
  };
})();