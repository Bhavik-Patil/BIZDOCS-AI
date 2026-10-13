const test = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../gemini');
test('Gemini rejects empty prompts without a request', async () => {
  await assert.rejects(generate('', 'quotation'), /Enter a prompt/);
});
test('Gemini validates response and sends credentials only in a header', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  const sample = {docType:'quotation',customer:'ABC',description:'Website',amount:40000,gstBp:1800,subject:'',body:''};
  const fake = async (url, options) => {
    assert.equal(url.includes('test-key'), false);
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(sample)}]}}]})};
  };
  try {
    assert.deepEqual(await generate('quotation', 'quotation', fake), sample);
    await assert.rejects(generate('quotation','quotation',async()=>({ok:false,status:403})), /rejected/);
    await assert.rejects(generate('quotation','quotation',async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({...sample,amount:-1})}]}}]})})), /invalid/);
  } finally { delete process.env.GEMINI_API_KEY; }
});
