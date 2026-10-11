/* ============================================================
   BizDocs AI — Seed data
   Runs once on first launch to populate the demo account.
   ============================================================ */

var BizSeed = (function () {

  var SEED_KEY = 'bd_seeded_v1';

  function run() {
    if (localStorage.getItem(SEED_KEY)) return;

    _seedSettings();
    var customers = _seedCustomers();
    _seedDocuments(customers);

    localStorage.setItem(SEED_KEY, '1');
    console.log('[BizDocs AI] Demo data loaded.');
  }

  function _seedSettings() {
    BizStorage.saveSettings({
      business_name:        'TechSpark Solutions',
      address:              '201, Sunrise Business Park, Pune – 411001, Maharashtra',
      phone:                '+91 98765 43210',
      email:                'info@techsparksolutions.in',
      gst_number:           '27AABCT1234L1Z5',
      currency:             'INR',
      currency_symbol:      '₹',
      default_gst_bp:       1800,
      default_validity_days: 30,
      logo_data_url:        null,
    });
  }

  function _seedCustomers() {
    var list = [
      {
        name: 'Rajesh Kumar',
        company: 'ABC Enterprises',
        email: 'rajesh@abcenterprises.com',
        phone: '+91 98765 11111',
        address: '45, Gandhi Nagar, Mumbai – 400001',
        gst_number: '27AABCA1234M1Z2',
      },
      {
        name: 'Priya Sharma',
        company: 'Sharma & Co.',
        email: 'priya@sharmaandco.in',
        phone: '+91 99887 22222',
        address: 'Shop 12, Laxmi Market, Nashik – 422001',
        gst_number: '',
      },
      {
        name: 'Vikram Mehta',
        company: 'Nexus Digital Agency',
        email: 'vikram@nexusdigital.in',
        phone: '+91 90001 33333',
        address: 'Level 3, Tech Hub, Bengaluru – 560001',
        gst_number: '29AABCN5678R1Z8',
      },
      {
        name: 'Anika Desai',
        company: 'Desai Consultants',
        email: 'anika@desaiconsultants.com',
        phone: '+91 91234 44444',
        address: '7, Commercial Zone, Ahmedabad – 380001',
        gst_number: '',
      },
      {
        name: 'Sanjay Patil',
        company: 'Patil Industries',
        email: 'sanjay@patilindustries.com',
        phone: '+91 95555 55555',
        address: '22, MIDC Area, Aurangabad – 431001',
        gst_number: '27AABCP4321K1Z3',
      },
    ];

    return list.map(function (c) { return BizStorage.saveCustomer(c); });
  }

  function _seedDocuments(customers) {
    var abc     = customers[0]; // ABC Enterprises
    var sharma  = customers[1];
    var nexus   = customers[2];
    var desai   = customers[3];
    var patil   = customers[4];

    // ---- Quotation 1: PPT demo scenario (₹40,000 + 18% GST = ₹47,200) ----
    BizStorage.saveDocument({
      type: 'quotation',
      customer_id: abc.id,
      issue_date:  '2026-10-01',
      valid_until: '2026-10-31',
      notes: 'Please confirm within the validity period.',
      terms: 'Payment due within 15 days of invoice. 50% advance required.',
      items: [
        {
          description:    'Website Development (Custom 5-page)',
          quantity_milli: 1000,           // 1.000 unit
          unit_price_p:   4000000,        // ₹40,000 in paise
          discount_type:  'percent',
          discount_value: 0,
          tax_rate_bp:    1800,           // 18% GST
        }
      ],
      subtotal_p: 4000000,
      discount_p: 0,
      tax_p:      720000,                 // ₹7,200
      total_p:    4720000,               // ₹47,200
    });

    // ---- Quotation 2 ----
    BizStorage.saveDocument({
      type: 'quotation',
      customer_id: nexus.id,
      issue_date:  '2026-09-25',
      valid_until: '2026-10-25',
      notes: '',
      terms: 'Payment on delivery.',
      items: [
        {
          description: 'Logo Design + Brand Identity',
          quantity_milli: 1000,
          unit_price_p: 1500000,          // ₹15,000
          discount_type: 'percent',
          discount_value: 10,             // 10% discount
          tax_rate_bp: 1800,
        },
        {
          description: 'Social Media Kit (20 templates)',
          quantity_milli: 1000,
          unit_price_p: 800000,           // ₹8,000
          discount_type: 'percent',
          discount_value: 0,
          tax_rate_bp: 1800,
        }
      ],
      subtotal_p: 2300000,
      discount_p: 150000,
      tax_p:      386100,
      total_p:    2536100,
    });

    // ---- Invoice 1 (PAID) ----
    BizStorage.saveDocument({
      type: 'invoice',
      customer_id: sharma.id,
      issue_date:  '2026-09-10',
      due_date:    '2026-09-25',
      payment_status: 'paid',
      notes: 'Thank you for your business.',
      terms: 'Payment received. No further action required.',
      items: [
        {
          description: 'Accounting Software Setup',
          quantity_milli: 1000,
          unit_price_p: 500000,           // ₹5,000
          discount_type: 'percent',
          discount_value: 0,
          tax_rate_bp: 1800,
        }
      ],
      subtotal_p: 500000,
      discount_p: 0,
      tax_p:      90000,
      total_p:    590000,
    });

    // ---- Invoice 2 (PENDING) ----
    BizStorage.saveDocument({
      type: 'invoice',
      customer_id: abc.id,
      issue_date:  '2026-10-01',
      due_date:    '2026-10-16',
      payment_status: 'pending',
      notes: '',
      terms: 'Payment due within 15 days.',
      items: [
        {
          description: 'Website Development – Milestone 1',
          quantity_milli: 1000,
          unit_price_p: 2000000,          // ₹20,000
          discount_type: 'percent',
          discount_value: 0,
          tax_rate_bp: 1800,
        }
      ],
      subtotal_p: 2000000,
      discount_p: 0,
      tax_p:      360000,
      total_p:    2360000,
    });

    // ---- Invoice 3 (OVERDUE) ----
    BizStorage.saveDocument({
      type: 'invoice',
      customer_id: patil.id,
      issue_date:  '2026-09-01',
      due_date:    '2026-09-15',
      payment_status: 'pending',          // overdue = pending + past due date
      notes: 'Please clear dues immediately.',
      terms: '',
      items: [
        {
          description: 'ERP Consulting (10 hours)',
          quantity_milli: 10000,          // 10.000 units
          unit_price_p: 250000,           // ₹2,500 per hour
          discount_type: 'percent',
          discount_value: 0,
          tax_rate_bp: 1800,
        }
      ],
      subtotal_p: 2500000,
      discount_p: 0,
      tax_p:      450000,
      total_p:    2950000,
    });

    // ---- Business Letter ----
    BizStorage.saveDocument({
      type: 'letter',
      customer_id: desai.id,
      issue_date: '2026-09-20',
      notes: '',
      terms: '',
      items: [],
      subtotal_p: 0, discount_p: 0, tax_p: 0, total_p: 0,
      body_json: {
        subject: 'Proposal for Annual Consulting Retainer',
        body: 'Dear Ms. Desai,\n\nWe are pleased to propose our annual consulting retainer services for Desai Consultants at a fixed monthly engagement.\n\nPlease find the details in the attached schedule.\n\nYours sincerely,\nTechSpark Solutions',
      }
    });
  }

  return { run: run };
})();