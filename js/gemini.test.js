const test = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../gemini');
const {imageParts,businessContext}=require('../gemini');
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
