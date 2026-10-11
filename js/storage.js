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

  function _today() { return new Date().toISOString().slice(0, 10); }

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
    _write(KEYS.settings, data);
  }

  /* ---- Session (demo auth) ---- */

  function login(email, password) {
    if (email === 'demo@bizdocs.ai' && password === 'demo123') {
      _write(KEYS.session, { email: email, name: 'Demo User', loggedIn: true });
      return true;
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
    counters[type] = n;
    _write(KEYS.counters, counters);
    var prefix = { quotation: 'QT', invoice: 'INV', letter: 'LTR', agreement: 'AGR', report: 'RPT', custom: 'DOC' };
    return (prefix[type] || 'DOC') + '-' + String(n).padStart(4, '0');
  }

  /* ---- Customers ---- */

  function getCustomers() {
    return _read(KEYS.customers) || [];
  }

  function getCustomerById(id) {
    return getCustomers().find(function (c) { return c.id === id; }) || null;
  }

  function saveCustomer(data) {
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
    _write(KEYS.customers, customers);
    return data;
  }

  function deleteCustomer(id) {
    var customers = getCustomers().filter(function (c) { return c.id !== id; });
    _write(KEYS.customers, customers);
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
    var docs = getDocuments();
    if (data.id) {
      var idx = docs.findIndex(function (d) { return d.id === data.id; });
      if (idx === -1) return null;
      docs[idx] = Object.assign({}, docs[idx], data, { updated_at: _now() });
    } else {
      var ref = _nextRef(data.type);
      data = Object.assign({ reference_no: ref }, data, {
        id: _newId(), created_at: _now(), updated_at: _now()
      });
      docs.push(data);
    }
    _write(KEYS.documents, docs);
    return data;
  }

  function deleteDocument(id) {
    var docs = getDocuments().filter(function (d) { return d.id !== id; });
    _write(KEYS.documents, docs);
  }

  function duplicateDocument(id) {
    var original = getDocumentById(id);
    if (!original) return null;
    var copy = Object.assign({}, original);
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    // New reference number for the copy
    copy.reference_no = _nextRef(copy.type);
    copy.issue_date = _today();
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

  /* ---- Public API ---- */
  return {
    getSettings, saveSettings,
    login, logout, getSession, isLoggedIn,
    getCustomers, getCustomerById, saveCustomer, deleteCustomer,
    getDocuments, getDocumentById, getDocumentsByCustomer,
    saveDocument, deleteDocument, duplicateDocument,
    getStats, getRecentDocuments,
    exportBackup,
    _today,  // used by other modules
  };
})();