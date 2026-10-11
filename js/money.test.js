/* ============================================================
   BizDocs AI — money.js tests
   Run with:  node --test js/money.test.js
   ============================================================ */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// BizMoney now exports itself for Node via module.exports
// BizStorage stub is still needed because isOverdue() calls BizStorage._today()
global.BizStorage = {
  _today: () => new Date().toISOString().slice(0, 10),
};

const M = require('./money.js');

/* ============================================================
   SECTION 1 — roundP
   ============================================================ */
describe('roundP — half-up rounding', () => {

  test('rounds .5 up', () => {
    assert.equal(M.roundP(1.5), 2);
  });

  test('rounds .4 down', () => {
    assert.equal(M.roundP(1.4), 1);
  });

  test('rounds .49 down', () => {
    assert.equal(M.roundP(1.49), 1);
  });

  test('integer stays integer', () => {
    assert.equal(M.roundP(100), 100);
  });

  test('zero stays zero', () => {
    assert.equal(M.roundP(0), 0);
  });

});

/* ============================================================
   SECTION 2 — calcLine single item
   ============================================================ */
describe('calcLine — single line item', () => {

  test('PPT scenario: Rs.40000 + 18% GST = Rs.47200', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   4000000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      4000000, 'gross Rs.40000');
    assert.equal(r.discount_p,   0,       'no discount');
    assert.equal(r.net_p,        4000000, 'net Rs.40000');
    assert.equal(r.tax_p,        720000,  'GST Rs.7200');
    assert.equal(r.line_total_p, 4720000, 'total Rs.47200');
  });

  test('Rs.15000 with 10% discount + 18% GST = Rs.15930', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   1500000,
      discount_type:  'percent',
      discount_value: 10,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      1500000, 'gross Rs.15000');
    assert.equal(r.discount_p,   150000,  'discount Rs.1500');
    assert.equal(r.net_p,        1350000, 'net Rs.13500');
    assert.equal(r.tax_p,        243000,  'GST Rs.2430');
    assert.equal(r.line_total_p, 1593000, 'total Rs.15930');
  });

  test('Rs.10000 with Rs.500 fixed discount + 18% GST = Rs.11210', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   1000000,
      discount_type:  'fixed',
      discount_value: 50000,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      1000000, 'gross Rs.10000');
    assert.equal(r.discount_p,   50000,   'discount Rs.500');
    assert.equal(r.net_p,        950000,  'net Rs.9500');
    assert.equal(r.tax_p,        171000,  'GST Rs.1710');
    assert.equal(r.line_total_p, 1121000, 'total Rs.11210');
  });

  test('0.5 unit x Rs.20000 = Rs.11800 total', () => {
    const r = M.calcLine({
      quantity_milli: 500,
      unit_price_p:   2000000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      1000000, 'gross Rs.10000');
    assert.equal(r.tax_p,        180000,  'GST Rs.1800');
    assert.equal(r.line_total_p, 1180000, 'total Rs.11800');
  });

  test('3 x Rs.333.33 — GST rounds correctly', () => {
    const r = M.calcLine({
      quantity_milli: 3000,
      unit_price_p:   33333,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      99999,  'gross 99999 paise');
    assert.equal(r.tax_p,        18000,  'GST rounds to 18000 paise');
    assert.equal(r.line_total_p, 117999, 'total 117999 paise');
  });

  test('zero GST rate — no tax added', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   500000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    0,
    });
    assert.equal(r.tax_p,        0,      'no tax');
    assert.equal(r.line_total_p, 500000, 'total equals net');
  });

  test('100% discount makes line total zero', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   500000,
      discount_type:  'percent',
      discount_value: 100,
      tax_rate_bp:    1800,
    });
    assert.equal(r.discount_p,   500000, 'full price discounted');
    assert.equal(r.net_p,        0,      'net is zero');
    assert.equal(r.tax_p,        0,      'tax on zero is zero');
    assert.equal(r.line_total_p, 0,      'total is zero');
  });

});

/* ============================================================
   SECTION 3 — Invalid inputs
   ============================================================ */
describe('calcLine — invalid inputs', () => {

  test('negative quantity treated as zero', () => {
    const r = M.calcLine({
      quantity_milli: -500,
      unit_price_p:   1000000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      0);
    assert.equal(r.line_total_p, 0);
  });

  test('negative price treated as zero', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   -500000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      0);
    assert.equal(r.line_total_p, 0);
  });

  test('discount over 100% clamped to 100%', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   1000000,
      discount_type:  'percent',
      discount_value: 150,
      tax_rate_bp:    1800,
    });
    assert.equal(r.discount_p,   1000000);
    assert.equal(r.net_p,        0);
    assert.equal(r.line_total_p, 0);
  });

  test('empty object does not throw', () => {
    assert.doesNotThrow(() => {
      const r = M.calcLine({});
      assert.equal(r.gross_p,      0);
      assert.equal(r.line_total_p, 0);
    });
  });

  test('NaN price treated as zero', () => {
    const r = M.calcLine({
      quantity_milli: 1000,
      unit_price_p:   'abc',
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    });
    assert.equal(r.gross_p,      0);
    assert.equal(r.line_total_p, 0);
  });

});

/* ============================================================
   SECTION 4 — calcDocument totals
   ============================================================ */
describe('calcDocument — document totals', () => {

  test('empty array returns all zeros', () => {
    const r = M.calcDocument([]);
    assert.equal(r.subtotal_p,       0);
    assert.equal(r.total_discount_p, 0);
    assert.equal(r.total_tax_p,      0);
    assert.equal(r.grand_total_p,    0);
    assert.deepEqual(r.lines,        []);
  });

  test('null returns all zeros without throwing', () => {
    assert.doesNotThrow(() => {
      const r = M.calcDocument(null);
      assert.equal(r.grand_total_p, 0);
    });
  });

  test('undefined returns all zeros without throwing', () => {
    assert.doesNotThrow(() => {
      const r = M.calcDocument(undefined);
      assert.equal(r.grand_total_p, 0);
    });
  });

  test('single item Rs.40000 + 18% GST — grand total Rs.47200', () => {
    const r = M.calcDocument([{
      quantity_milli: 1000,
      unit_price_p:   4000000,
      discount_type:  'percent',
      discount_value: 0,
      tax_rate_bp:    1800,
    }]);
    assert.equal(r.subtotal_p,       4000000);
    assert.equal(r.total_discount_p, 0);
    assert.equal(r.total_tax_p,      720000);
    assert.equal(r.grand_total_p,    4720000);
    assert.equal(r.lines.length,     1);
  });

  test('two items — grand total Rs.63130', () => {
    const r = M.calcDocument([
      {
        quantity_milli: 1000,
        unit_price_p:   4000000,
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    1800,
      },
      {
        quantity_milli: 1000,
        unit_price_p:   1500000,
        discount_type:  'percent',
        discount_value: 10,
        tax_rate_bp:    1800,
      },
    ]);
    assert.equal(r.subtotal_p,       5500000);
    assert.equal(r.total_discount_p, 150000);
    assert.equal(r.total_tax_p,      963000);
    assert.equal(r.grand_total_p,    6313000);
    assert.equal(r.lines.length,     2);
  });

  test('three items with mixed GST rates — grand total Rs.19400', () => {
    const r = M.calcDocument([
      {
        quantity_milli: 1000,
        unit_price_p:   1000000,
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    1800,
      },
      {
        quantity_milli: 1000,
        unit_price_p:   500000,
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    1200,
      },
      {
        quantity_milli: 1000,
        unit_price_p:   200000,
        discount_type:  'percent',
        discount_value: 0,
        tax_rate_bp:    0,
      },
    ]);
    assert.equal(r.subtotal_p,    1700000);
    assert.equal(r.total_tax_p,   240000);
    assert.equal(r.grand_total_p, 1940000);
  });

});

/* ============================================================
   SECTION 5 — format
   ============================================================ */
describe('format — paise to display string', () => {

  test('Rs.47200 formats correctly', () => {
    const r = M.format(4720000);
    assert.ok(r.includes('47,200') || r.includes('47200'));
    assert.ok(r.includes('₹'));
  });

  test('zero formats without throwing', () => {
    assert.doesNotThrow(() => {
      const r = M.format(0);
      assert.ok(typeof r === 'string');
    });
  });

  test('custom symbol works', () => {
    const r = M.format(100000, '$');
    assert.ok(r.includes('$'));
  });

});

/* ============================================================
   SECTION 6 — isOverdue
   ============================================================ */
describe('isOverdue — invoice overdue check', () => {

  test('paid invoice is never overdue', () => {
    assert.equal(M.isOverdue({ payment_status: 'paid', due_date: '2020-01-01' }), false);
  });

  test('pending with future due date is not overdue', () => {
    assert.equal(M.isOverdue({ payment_status: 'pending', due_date: '2099-12-31' }), false);
  });

  test('pending with past due date is overdue', () => {
    assert.equal(M.isOverdue({ payment_status: 'pending', due_date: '2020-01-01' }), true);
  });

  test('null returns false without throwing', () => {
    assert.equal(M.isOverdue(null),      false);
    assert.equal(M.isOverdue(undefined), false);
  });

  test('pending with no due date is not overdue', () => {
    assert.equal(M.isOverdue({ payment_status: 'pending', due_date: null }), false);
  });

});