/* ============================================================
   BizDocs AI — Hash router
   
   Routes: #/login, #/dashboard, #/customers, #/quotations,
           #/invoices, #/documents, #/generator, #/settings
   ============================================================ */

var BizRouter = (function () {

  var routes = {};

  function register(path, handler) {
    routes[path] = handler;
  }

  function navigate(path) {
    window.location.hash = '#' + path;
  }

  function _currentPath() {
    var hash = window.location.hash || '#/login';
    return hash.replace('#', '') || '/login';
  }

    function dispatch() {
    var path = _currentPath();

    // Guard: redirect to login if not authenticated
    if (path !== '/login' && !BizStorage.isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (path === '/login' && BizStorage.isLoggedIn()) {
      navigate('/dashboard');
      return;
    }

    // Exact match first
    if (routes[path]) {
      routes[path]();
      return;
    }

    // Prefix match for sub-routes (e.g. /customers/new, /customers/edit/abc123)
    var prefixes = ['/customers', '/quotations', '/invoices', '/invoices/from', '/documents'];
    for (var i = 0; i < prefixes.length; i++) {
      if (path.startsWith(prefixes[i] + '/') || path === prefixes[i]) {
        if (routes[prefixes[i]]) {
          routes[prefixes[i]]();
          return;
        }
      }
    }

    // Fallback
    navigate(BizStorage.isLoggedIn() ? '/dashboard' : '/login');
  }

  function init() {
    window.addEventListener('hashchange', dispatch);
    dispatch(); // run on page load
  }

  return { register, navigate, dispatch, init };
})();