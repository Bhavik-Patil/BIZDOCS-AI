/* ============================================================
   BizDocs AI — Sidebar component
   ============================================================ */

var BizSidebar = (function () {

  var NAV_ITEMS = [
    { path: '/dashboard',  label: 'Dashboard',       icon: 'grid' },
    { path: '/generator',  label: 'Create Document',    icon: 'sparkle' },
    { path: '/documents',  label: 'Documents',       icon: 'folder' },
    { path: '/quotations', label: 'Quotations',      icon: 'receipt' },
    { path: '/invoices',   label: 'Invoices',        icon: 'currency' },
    { path: '/customers',  label: 'Customers',       icon: 'users' },
    { path: '/settings',   label: 'Settings',        icon: 'cog' },
  ];

  var ICONS = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    sparkle:'<path d="M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3zM20 3v4M18 5h4"/>',
    receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 7h6M9 11h6M9 15h4"/>',
    currency:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18M7 15h3M16 15h2"/>',
    folder:'<path d="M3 7V5a2 2 0 012-2h5l3 3h6a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0112 0v3M17 4a3 3 0 010 6M21 21v-3a6 6 0 00-4-5"/>',
    cog:'<circle cx="12" cy="12" r="3"/><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3z"/>'
  };

  function render() {
    var currentPath = window.location.hash.replace('#', '') || '/login';
    var settings    = BizStorage.getSettings();

    return '<aside class="sidebar" id="sidebar">' +
      '<div class="sidebar__brand">' +
        '<img src="assets/logo.svg" alt="BizDocs AI" class="sidebar__logo"/>' +
        '<div class="sidebar__brand-name">' +
          '<span>BizDocs AI</span>' +
          '<span>Smart Documents. Faster Business.</span>' +
        '</div>' +
      '</div>' +
      '<nav class="sidebar__nav">' +
        '<div class="sidebar__section-label">Main Menu</div>' +
        NAV_ITEMS.map(function (item) {
          var active = (currentPath === item.path || currentPath.startsWith(item.path + '/')) ? ' active' : '';
          return '<a href="#' + item.path + '" class="sidebar__link' + active + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">' +
              ICONS[item.icon] +
            '</svg>' +
            item.label +
          '</a>';
        }).join('') +
      '</nav>' +
      '<div class="sidebar__footer">' +
        String(settings.business_name || 'BizDocs AI').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + ' &copy; ' + new Date().getFullYear() +
      '</div>' +
    '</aside>';
  }

  return { render };
})();