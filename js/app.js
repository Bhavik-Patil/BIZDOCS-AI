/* ============================================================
   BizDocs AI — Main application entry point
   ============================================================ */

// ── Demo mode: always show login on fresh page load ──────────
// Remove this line if you want "stay logged in" behaviour
BizStorage.logout();

/* Shared logout handler used by header component */
function _handleLogout() {
  if (confirm('Sign out of BizDocs AI?')) {
    BizStorage.logout();
    BizRouter.navigate('/login');
  }
}

/* Avatar menu toggle — shared by all pages */
function _bindAvatar() {
  var btn  = document.getElementById('avatar-btn');
  var menu = document.getElementById('avatar-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', function () {
    var m = document.getElementById('avatar-menu');
    if (m) m.classList.remove('open');
  });
}

/* Register all routes */
BizRouter.register('/login',      PageLogin.render);
BizRouter.register('/dashboard',  PageDashboard.render);
BizRouter.register('/customers',  PageCustomers.render);
BizRouter.register('/quotations', PageQuotations.render);
BizRouter.register('/invoices',   PageInvoices.render);
BizRouter.register('/documents',  PageDocuments.render);
BizRouter.register('/generator',  PageGenerator.render);
BizRouter.register('/settings',   PageSettings.render);

/* Run seed data — no-op after first run */
BizSeed.run();

/* Start router */
BizRouter.init();