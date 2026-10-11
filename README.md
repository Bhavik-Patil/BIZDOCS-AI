# BizDocs AI

## Smart Documents. Faster Business.

A professional business document automation platform for small businesses,
freelancers and startups. Built as an offline-ready college startup MVP.

---

## Quick Start (Windows)

### Requirements

- Any modern browser (Chrome or Edge recommended)
- No installation, no server, no internet required

### Steps

1. Extract the project ZIP (if applicable)
2. Open the `BizDocs-AI` folder
3. Double-click `index.html`
4. Chrome or Edge opens automatically

### Demo Login

| Field    | Value           |
| -------- | --------------- |
| Email    | demo@bizdocs.ai |
| Password | demo123         |

> This is a demo login only. Not for production use.

---

## Features

| Feature                      | Status     |
| ---------------------------- | ---------- |
| Demo login                   | ✅ Working |
| Dashboard with live stats    | ✅ Working |
| Customer management (CRUD)   | ✅ Working |
| Quotation creator            | ✅ Working |
| Auto GST + discount calc     | ✅ Working |
| Live A4 preview              | ✅ Working |
| Invoice management           | ✅ Working |
| Payment status tracking      | ✅ Working |
| Quotation → Invoice convert  | ✅ Working |
| Documents archive + search   | ✅ Working |
| Date range filter            | ✅ Working |
| Template-based AI Generator  | ✅ Working |
| PDF export (browser print)   | ✅ Working |
| Settings page                | ✅ Working |
| JSON backup export           | ✅ Working |
| Offline operation            | ✅ Working |
| Calculation tests (31 tests) | ✅ Passing |

---

## Project Structure

BizDocs-AI/
├── index.html — Single page app entry point
├── README.md — This file
├── css/
│ ├── main.css — Design tokens and variables
│ ├── layout.css — Sidebar, header, auth layout
│ ├── components.css — Buttons, cards, forms, tables
│ └── print.css — PDF print styles
├── js/
│ ├── app.js — Entry point and route registration
│ ├── router.js — Hash-based SPA router
│ ├── storage.js — localStorage data repository
│ ├── money.js — Financial calculations (paise)
│ ├── seed.js — Demo data loader
│ ├── money.test.js — Automated calculation tests
│ ├── components/
│ │ ├── sidebar.js — Navigation sidebar
│ │ ├── header.js — Top header bar
│ │ └── toast.js — Notification toasts
│ └── pages/
│ ├── login.js
│ ├── dashboard.js
│ ├── customers.js
│ ├── quotations.js
│ ├── invoices.js
│ ├── documents.js
│ ├── generator.js
│ └── settings.js
└── assets/
└── logo.svg — BizDocs AI brand logo

---

## Running the Calculation Tests

Requires Node.js (v18 or higher).

```powershell
cd path\to\BizDocs-AI
node --test js/money.test.js
```

Expected result: **31 tests, 31 pass, 0 fail**

---

## PDF Export Instructions

1. Open any quotation or invoice
2. Click **Print / PDF** button
3. Browser print dialog opens
4. Set **Destination** to "Save as PDF"
5. Set **Paper size** to A4
6. Set **Margins** to None or Minimum
7. Enable **Background graphics** (for colours)
8. Click Save

---

## Demo Credentials and Data

The following sample data is pre-loaded on first launch:

**Customers:** TechSpark Solutions (your business), ABC Enterprises,
Sharma & Co., Nexus Digital Agency, Desai Consultants, Patil Industries

**Documents:**

- QT-0001: ABC Enterprises — Website Development ₹47,200 (18% GST)
- QT-0002: Nexus Digital — Logo + Social Media ₹25,361
- INV-0001: Sharma & Co. — Software Setup ₹5,900 (Paid)
- INV-0002: ABC Enterprises — Milestone 1 ₹23,600 (Pending)
- INV-0003: Patil Industries — ERP Consulting ₹29,500 (Overdue)
- LTR-0001: Desai Consultants — Proposal Letter

---

## Known Limitations

| Limitation           | Notes                                           |
| -------------------- | ----------------------------------------------- |
| Demo login only      | Not production-grade authentication             |
| localStorage storage | Data tied to one browser profile                |
| PDF = browser print  | Not a true one-click download                   |
| No real AI           | Generator uses template matching, not an AI API |
| No multi-user        | Single demo account only                        |
| No server            | Data does not sync across devices               |

---

## Architecture Decisions

| Decision                        | Reason                                       |
| ------------------------------- | -------------------------------------------- |
| Vanilla JS, no framework        | Zero install, runs on any PC instantly       |
| localStorage                    | No server needed for demo                    |
| Integer paise for money         | Avoids floating-point rounding errors        |
| Single index.html + hash router | No broken paths when opened from file system |
| storage.js as data layer        | Easy to swap to Express + SQLite later       |

---

## Future Improvements (Phase 9+)

- Node.js + Express + SQLite backend
- Real authentication with hashed passwords
- True PDF generation (Puppeteer or WeasyPrint)
- Claude AI API integration for smart generation
- Multi-user support
- WhatsApp / email delivery
- Mobile app (PWA)

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Storage:** localStorage (browser)
- **Tests:** Node.js built-in test runner
- **PDF:** Browser Print API
- **Fonts:** Inter (Google Fonts)

---

_BizDocs AI — Smart Documents. Faster Business._
_Built as a college startup MVP — MSBTE Diploma Computer Engineering_
