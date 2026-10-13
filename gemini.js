const fs = require('node:fs');
const path = require('node:path');
function config() {
  let env = {};
  try {
    for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(GEMINI_API_KEY|GEMINI_MODEL)\s*=\s*(.*?)\s*$/);
      if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let local = {};
  try { local = JSON.parse(fs.readFileSync(path.join(__dirname, '.gemini.local.json'), 'utf8')); } catch {}
  return { key: process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || local.key, model: process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-flash-latest' };
}
async function generate(prompt, type, fetcher = fetch) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 10000) throw new Error('Enter a prompt of 1–10,000 characters.');
  const { key, model } = config();
  if (!key) throw new Error('Gemini is not configured on the local server.');
  const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(45000),
    body: JSON.stringify({ contents: [{ parts: [{ text: `Extract a business document from these instructions. Return only JSON with docType (quotation, invoice, letter, agreement, report, custom), customer (string or null), description (string), amount (number in rupees, not paise), gstBp (GST percentage times 100), subject (string), body (professional plain text for nonfinancial documents). Do not invent prices or customer information. Default document type: ${type}. Instructions: ${prompt}` }] }], generationConfig: { responseMimeType: 'application/json' } })
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Gemini rejected the API key. Check its permissions.' : response.status === 429 ? 'Gemini quota exceeded. Try later or use Offline templates.' : response.status === 503 ? 'Gemini is temporarily unavailable (503). Try later or use Offline templates.' : 'Gemini request failed. Try again or use Offline templates.');
  const data = await response.json();
  const result = JSON.parse((data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(''));
  if (!['quotation','invoice','letter','agreement','report','custom'].includes(result.docType) || !Number.isFinite(result.amount) || result.amount < 0 || result.amount > 1e10 || !Number.isInteger(result.gstBp) || result.gstBp < 0 || result.gstBp > 10000) throw new Error('Gemini returned invalid document fields. Try a clearer prompt.');
  for (const field of ['description','subject','body']) if (typeof result[field] !== 'string' || result[field].length > 20000) throw new Error('Gemini returned invalid document content.');
  if (result.customer !== null && typeof result.customer !== 'string') throw new Error('Gemini returned invalid customer information.');
  return result;
}
module.exports = { generate };
