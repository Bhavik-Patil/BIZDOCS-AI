/* ============================================================
   BizDocs AI — Sidebar component
   ============================================================ */

var BizSidebar = (function () {

  var NAV_ITEMS = [
    { path: '/dashboard',  label: 'Dashboard',       icon: 'grid' },
    { path: '/generator',  label: 'AI Generator',    icon: 'sparkle' },
    { path: '/quotations', label: 'Quotations',      icon: 'receipt' },
    { path: '/invoices',   label: 'Invoices',        icon: 'currency' },
    { path: '/documents',  label: 'Documents',       icon: 'folder' },
    { path: '/customers',  label: 'Customers',       icon: 'users' },
    { path: '/settings',   label: 'Settings',        icon: 'cog' },
  ];

  var ICONS = {
    grid:     '<path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>',
    sparkle:  '<path d="M9.5 2l.5 3.5L13.5 6l-3.5.5L9.5 10l-.5-3.5L5.5 6l3.5-.5L9.5 2zM3 12l.33 2.33L5.67 15l-2.34.33L3 18l-.33-2.67L.33 15l2.34-.33L3 12zm11 1l.25 1.75L16 15l-1.75.25L14 17l-.25-1.75L12 15l1.75-.25L14 13z"/>',
    receipt:  '<path d="M4 2a2 2 0 00-2 2v16l3-2 3 2 3-2 3 2 3-2V4a2 2 0 00-2-2H4zm2 5h8v2H6V7zm0 4h8v2H6v-2zm0 4h5v2H6v-2z"/>',
    currency: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>',
    folder:   '<path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>',
    users:    '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    cog:      '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>',
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
          var active = currentPath === item.path ? ' active' : '';
          return '<a href="#' + item.path + '" class="sidebar__link' + active + '">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">' +
              ICONS[item.icon] +
            '</svg>' +
            item.label +
          '</a>';
        }).join('') +
      '</nav>' +
      '<div class="sidebar__footer">' +
        (settings.business_name || 'BizDocs AI') + ' &copy; ' + new Date().getFullYear() +
      '</div>' +
    '</aside>';
  }

  return { render };
})();