# BizDocs AI — Smart Documents. Faster Business.

A college startup MVP for small businesses, freelancers, and local shops. Premium blue-purple SaaS interface, local data, intelligent document templates, and offline A4 PDF downloads.

## Start the demo

1. Extract the project folder on your laptop or another PC.
2. Double-click **index.html** to open it in Chrome or Edge. No database, installation, or internet connection is required.
3. Sign in with **demo@bizdocs.ai** / **demo123**.
4. Add a customer, or select a preloaded sample customer.
5. Open **Quotations → New Quotation**, select the customer, and enter your services, rates, discount, and GST. Add more rows with **Add Item**.
6. Check the live A4 preview, then click **Save Quotation**. Reopen it with **Edit**.
7. Click **Download PDF** for a direct A4 file download. **Print** opens the browser print dialog, where you can also select **Save as PDF**.
8. Open **Invoices → From Quotation** to convert it. Repeated conversion opens the existing invoice instead of creating another.

For consistent browser storage, you can also use the optional local server with Node.js 18 or later:

```powershell
cd D:\Project\BIZDOCS-AI
npm start
```

Open http://localhost:3000. No `npm install` is needed. The server listens only on this computer. If port 3000 is occupied, use `$env:PORT = '3001'` before `npm start`.

## Features

- Dashboard with four main statistics, realistic recent documents, quick actions, pending invoices, and document activity.
- Create Document: Quotation, Invoice, Business Letter, Agreement, Report, and Custom Document.
- Offline prompt parsing and editable, structured templates. Try: **Create a quotation for ABC Enterprises for website development for ₹40,000 plus 18% GST.**
- Multiple line items, fractional quantities, fixed or percentage discounts, GST, totals, notes, and terms.
- Save, reopen, edit, duplicate, print, and download documents.
- Invoice payment states: Paid, Pending, and Overdue; past-due unpaid invoices are also shown as overdue automatically.
- Documents archive with reference/customer/type search, type tabs, date filters, and confirmation dialogs before deletion.
- Customer contact management and document history. Customers referenced by saved documents cannot be deleted, protecting document history. A quotation linked to an invoice is also retained until its invoice is removed.
- Business profile, company logo upload, currency, default GST, and default quotation validity.
- Header document search, outstanding invoice notifications, profile menu, mobile navigation, validation messages, and empty states.
- JSON backup export from Documents or Settings.

## How the important parts work

`js/storage.js` is the localStorage repository. It validates saved records, recalculates financial totals, rejects duplicate references, and reports failed writes. Invoice conversion records a `source_quotation_id`; the repository enforces one invoice per source quotation.

`js/money.js` stores money in integer minor units (paise for INR), quantities in thousandths, and tax rates in basis points. Gross amounts, discounts, and taxes round half-up per line before summing totals. Numeric limits keep intermediate multiplication within JavaScript's safe integer range.

`js/pages/generator.js` offers offline prompt parsing and an optional Gemini provider through `gemini.js` on the local server. Both fill editable fields; offline generation uses templates, while Gemini calls Google's API. The core app requires no API key or paid service.

`js/pdf.js` renders a dedicated copy of the preview and builds A4 pages. Two MIT-licensed libraries are bundled in `js/vendor` for this feature: [html2canvas](https://html2canvas.hertzen.com/documentation) 1.4.1 and [jsPDF](https://github.com/parallax/jsPDF) 4.2.1. They are loaded locally; the app does not contact a CDN. Downloads preserve visible document styling and use page boundaries near table rows where possible.

`css/main.css`, `layout.css`, `components.css`, and `polish.css` form the shared design system. `assets/logo.svg` combines a document and sparkle. System fonts keep typography available offline.

## Run automated tests

```powershell
npm test
```

Tests cover financial calculations, rounding, invalid inputs, save/reopen, quota failure, reference numbering, conversion without duplicate invoices, customer history protection, document editing, demo seeding, and static-server request handling. The test runner uses only Node's built-in modules. Final verification: **69 automated tests passed**, JavaScript syntax checks passed, and all local HTML asset references exist. Browser QA verified customer creation, multi-item quotation save/reopen, direct quotation and invoice PDF downloads, repeat-conversion prevention, letter editing, search, notifications, 0% GST defaults, and laptop/mobile layouts. Direct `file://` navigation could not be tested because the browser automation tool allows only HTTP/HTTPS; the walkthrough was verified with the localhost server.

## College presentation walkthrough

1. Sign in and introduce the dashboard and locally stored sample records.
2. Demonstrate the prompt example producing **₹47,200** including 18% GST.
3. Create a multi-item quotation: ₹40,000 + ₹15,000 with 10% discount on the second item and 18% GST on both. Total: **₹63,130**.
4. Save, reopen, download PDF, and convert into an invoice.
5. Repeat conversion to demonstrate duplicate prevention.
6. Show document search, customer history, payment statuses, notifications, and business settings.

## Limits

- Authentication is a demo gate; it is not production security or multi-user authentication.
- Data belongs to the current browser profile and origin. Opening with `file://` and using localhost have separate storage. Keep the same launch method for the presentation. Export backups before clearing browser data.
- LocalStorage is suitable for a single-tab demo, not concurrent multi-user editing. No cross-device sync or backup import is provided.
- PDF downloads contain rasterized document pages; use browser **Print → Save as PDF** if you need selectable text. Very long freeform content may span pages. External images are not supported by the offline exporter.
- Company logo uploads work locally. Gemini requires a valid API key, internet access and available quota.
- Design follows the supplied blue-purple visual brief. The actual startup PPT was not included for exact comparison.

No external deployment is required. Copy the whole project folder, including `js/vendor`, to demonstrate it on another PC.
# Gemini Smart Generator

**Business logo and references:** Settings → Upload logo accepts PNG, JPG or WebP up to 5 MB. Save Settings to persist it; Remove logo + Save Settings clears it. Saved branding appears in quotation, invoice, letter and custom document previews, prints and PDFs. Business name, email, phone, address, GST and document defaults come from Settings.

Create Document → Upload reference images accepts up to two images (5 MB each) for invoice, quotation or custom-document references. Images are resized, previewed and removable; Clear removes them. Select Gemini AI to analyze them. Your prompt, temporary reference images and saved business details are sent to Google; your logo is applied locally and not sent. Reference branding never replaces the saved issuer profile. The result uses the app's A4 layout with generated content and a short reference analysis, not an exact layout copy. Offline templates do not analyze images. Reference uploads are not saved with documents. Data uses localStorage; there is no SQL database or installation requirement.

The local server supports **OpenRouter** (for reference image analysis and vision), **Groq** (for ultra-fast text generation), and **Google Gemini**:
- **OpenRouter (Recommended for Images):** Set `OPENROUTER_API_KEY=sk-or-v1-...` in `.env`. Default vision model is `nvidia/nemotron-3.5-super-vl:free` (with automatic fallback to other active free multimodal models). Free keys can be created at [openrouter.ai/keys](https://openrouter.ai/keys).
- **Groq (Recommended for Text):** Set `GROQ_API_KEY=gsk_...` in `.env`. Default model is `openai/gpt-oss-120b`.
- **Google Gemini:** Set `GEMINI_API_KEY=AIzaSy...` in `.env`. Default model is `gemini-2.5-flash-lite`.

Run `npm start`, open `http://localhost:3000`, and choose **AI Generator (Groq / Online)** in Create Document. Enter instructions, optionally attach reference images, and click Generate. Review the extracted fields and generated content before saving. Offline templates remain available without internet or any API access.

The local server automatically reads `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `GEMINI_API_KEY`, and `GEMINI_MODEL` from `.env`. Environment variables take precedence. `.env` is ignored by Git and must never be distributed. Node 18 or newer is required. The server validates all returned fields; existing money calculations remain authoritative.
