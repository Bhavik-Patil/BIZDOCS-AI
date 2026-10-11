/* ============================================================
   BizDocs AI — Money calculations
   
   Rules:
   - All amounts in PAISE (integer). ₹1 = 100 paise.
   - Tax rates in BASIS POINTS. 18% = 1800 bp.
   - Rounding: half-up on each line's discount and tax.
   - Never use floating-point for totals.
   ============================================================ */

var BizMoney = (function () {

  /* ---- Rounding ---- */
  // Half-up rounding for paise (avoids banker's rounding surprises)
  function roundP(n) {
    return Math.floor(n + 0.5);
  }

  /* ---- Format paise for display ---- */
  function format(paise, symbol) {
    symbol = symbol || '₹';
    var rupees = paise / 100;
    return symbol + rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /* ---- Single line calculation ---- */
  /*
    item = {
      quantity_milli: integer (qty × 1000, so 1 unit = 1000, 0.5 unit = 500),
      unit_price_p:   integer (price in paise),
      discount_type:  'percent' | 'fixed',
      discount_value: number   (0–100 for percent, paise amount for fixed),
      tax_rate_bp:    integer  (1800 = 18%),
    }
    Returns { gross_p, discount_p, net_p, tax_p, line_total_p }
  */
  function calcLine(item) {
    var qty_milli    = Math.max(0, parseInt(item.quantity_milli)  || 0);
    var price_p      = Math.max(0, parseInt(item.unit_price_p)    || 0);
    var tax_bp       = Math.max(0, parseInt(item.tax_rate_bp)     || 0);
    var disc_val     = parseFloat(item.discount_value)            || 0;
    var disc_type    = item.discount_type || 'percent';

    // Gross = qty × unit_price  (qty_milli / 1000 × price_p)
    var gross_p = roundP((qty_milli * price_p) / 1000);

    // Discount
    var discount_p = 0;
    if (disc_type === 'percent') {
      disc_val = Math.min(100, Math.max(0, disc_val));
      discount_p = roundP(gross_p * disc_val / 100);
    } else {
      // fixed discount in paise
      discount_p = Math.min(gross_p, Math.max(0, roundP(disc_val)));
    }

    var net_p = gross_p - discount_p;

    // Tax on net amount
    var tax_p = roundP(net_p * tax_bp / 10000);

    var line_total_p = net_p + tax_p;

    return { gross_p, discount_p, net_p, tax_p, line_total_p };
  }

  /* ---- Document totals from array of items ---- */
  /*
    Returns {
      subtotal_p,    // sum of gross_p (before discount, before tax)
      total_discount_p,
      total_tax_p,
      grand_total_p,
      lines,         // array of per-line results
    }
  */
  function calcDocument(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        subtotal_p: 0, total_discount_p: 0,
        total_tax_p: 0, grand_total_p: 0, lines: []
      };
    }

    var lines = items.map(calcLine);

    var subtotal_p       = lines.reduce(function (s, l) { return s + l.gross_p;    }, 0);
    var total_discount_p = lines.reduce(function (s, l) { return s + l.discount_p; }, 0);
    var total_tax_p      = lines.reduce(function (s, l) { return s + l.tax_p;      }, 0);
    var grand_total_p    = lines.reduce(function (s, l) { return s + l.line_total_p; }, 0);

    return { subtotal_p, total_discount_p, total_tax_p, grand_total_p, lines };
  }

  /* ---- Overdue check ---- */
  function isOverdue(invoice) {
    if (!invoice) return false;
    if (invoice.payment_status === 'paid') return false;
    if (!invoice.due_date) return false;
    return invoice.due_date < BizStorage._today();
  }

  /* ---- Public API ---- */
    return { roundP, format, calcLine, calcDocument, isOverdue };
})();

// Allow Node.js (test runner) to import this file directly
// In the browser this block is skipped because 'module' is undefined
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BizMoney;
}