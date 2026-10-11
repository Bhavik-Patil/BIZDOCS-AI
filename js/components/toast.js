/* ============================================================
   BizDocs AI — Toast notifications
   Usage: BizToast.show('Saved!', 'success')
          BizToast.show('Something went wrong.', 'error')
          BizToast.show('Check your input.', 'warning')
   ============================================================ */

var BizToast = (function () {

  function show(message, type, durationMs) {
    type       = type       || 'info';
    durationMs = durationMs || 3000;

    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style="flex-shrink:0">' +
        _icon(type) +
      '</svg>' +
      '<span>' + _escape(message) + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity 250ms ease, transform 250ms ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    }, durationMs);
  }

  function _icon(type) {
    if (type === 'success') {
      return '<path fill-rule="evenodd" d="M16.704 5.296a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 11.586l6.29-6.29a1 1 0 011.414 0z" clip-rule="evenodd"/>';
    }
    if (type === 'error') {
      return '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>';
    }
    return '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>';
  }

  function _escape(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { show };
})();