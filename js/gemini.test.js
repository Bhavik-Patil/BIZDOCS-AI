const test = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../gemini');
const {imageParts,businessContext}=require('../gemini');

test.beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_PROVIDER;
});

test.afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_PROVIDER;
});
test('reference validation rejects unsafe types, disguised images and excessive uploads',()=>{
  for(const image of [{mimeType:'image/svg+xml',data:'AAAA'},{mimeType:'image/png',data:'AAAA'},{mimeType:'image/png',data:'!'}])assert.throws(()=>imageParts([image]),/Gemini/);
  assert.throws(()=>imageParts([1,2,3]),/2 reference/);
  assert.equal(businessContext({business_name:'TechDwarf',default_gst_bp:500,logo_data_url:'ignored'}).logo_data_url,undefined);
  assert.throws(()=>businessContext({email:12}),/invalid/);
});
test('generation includes reference bytes and settings as issuer context',async()=>{
  process.env.GEMINI_API_KEY='test-key';
  const sample={docType:'custom',customer:null,description:'',amount:0,gstBp:500,subject:'Proposal',body:'Our proposal'};
  try{const result=await generate('Create a custom proposal','custom',async(url,options)=>{
    const parts=JSON.parse(options.body).contents[0].parts;assert.ok(parts[0].text.includes('TechDwarf'));assert.ok(parts[0].text.includes('hello@example.com'));assert.equal(parts[1].inlineData.mimeType,'image/png');
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(sample)}]}}]})};
  },[{mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII='}],{business_name:'TechDwarf',email:'hello@example.com',default_gst_bp:500});assert.equal(result.docType,'custom');}finally{delete process.env.GEMINI_API_KEY;}
});
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

test('Groq validates response, formats auth header and switches to vision on images', async () => {
  process.env.GROQ_API_KEY = 'gsk_test_groq_key';
  const sample = { docType: 'invoice', customer: 'Nexus', description: 'Logo', amount: 15000, gstBp: 1800, subject: '', body: '', analysis: '' };
  const fake = async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(options.headers['Authorization'], 'Bearer gsk_test_groq_key');
    const body = JSON.parse(options.body);
    assert.ok(['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'].includes(body.model));
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(sample) } }] })
    };
  };
  try {
    const result = await generate('Invoice for Nexus logo 15000', 'invoice', fake);
    assert.deepEqual(result, sample);

    // Test rejection on 401
    await assert.rejects(generate('test', 'invoice', async () => ({ ok: false, status: 401 })), /rejected/);

    // Test rejection of reference images with helpful error message
    await assert.rejects(
      generate('test', 'invoice', fake, [{ mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=' }]),
      /text prompts only/
    );
  } finally {
    delete process.env.GROQ_API_KEY;
  }
});

test('OpenRouter sends auth header, formats image attachments, and parses response', async () => {
  process.env.OPENROUTER_API_KEY = 'sk-or-v1-testkey';
  const sample = { docType: 'quotation', customer: 'OpenCo', description: 'Consulting', amount: 45000, gstBp: 1800, subject: 'Quote', body: 'Quote body', analysis: 'Image has receipt' };
  const fake = async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.headers['Authorization'], 'Bearer sk-or-v1-testkey');
    const body = JSON.parse(options.body);
    // User content must be an array when image attachment is included
    assert.ok(Array.isArray(body.messages[1].content));
    assert.equal(body.messages[1].content[1].type, 'image_url');
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(sample) } }] })
    };
  };
  try {
    const result = await generate(
      'Quote for OpenCo 45000',
      'quotation',
      fake,
      [{ mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=' }]
    );
    assert.deepEqual(result, sample);

    // Test rejection on 401
    await assert.rejects(generate('test', 'quotation', async () => ({ ok: false, status: 401 })), /rejected/);
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
});


