/* ============================================================
   BizDocs AI — Header component
   ============================================================ */

var BizHeader = (function () {

  function render(title, subtitle) {
    var session = BizStorage.getSession() || {};
    var initials = (session.name || 'D').charAt(0).toUpperCase();

    return '<header class="header" id="main-header">' +
      '<div class="header__left">' +
        '<div class="header__title">' + _escape(title) + '</div>' +
        (subtitle ? '<div class="header__subtitle">' + _escape(subtitle) + '</div>' : '') +
      '</div>' +
      '<div class="header__right">' +
        '<div class="header__search">' +
          '<svg class="header__search-icon" viewBox="0 0 20 20" fill="currentColor">' +
            '<path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>' +
          '</svg>' +
          '<input type="search" id="global-search" placeholder="Search documents…" autocomplete="off"/>' +
        '</div>' +
        '<div class="header__avatar" id="avatar-btn" title="Account">' +
          initials +
        '</div>' +
        '<div class="header__avatar-menu" id="avatar-menu">' +
          '<button onclick="BizRouter.navigate(\'/settings\')">' +
            '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>' +
            'Settings' +
          '</button>' +
          '<button class="danger" onclick="_handleLogout()">' +
            '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.07a.75.75 0 10-1.004-1.12l-2.5 2.5a.75.75 0 000 1.08l2.5 2.5a.75.75 0 101.004-1.12L8.704 10.75H18.25A.75.75 0 0019 10z" clip-rule="evenodd"/></svg>' +
            'Log out' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</header>';
  }

  function _escape(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();