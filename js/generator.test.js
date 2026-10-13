'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={BizStorage:{getSettings:()=>({default_gst_bp:0})}};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/pages/generator.js','utf8'),context);
const parse=context.PageGenerator.parsePrompt;
test('requested quotation prompt extracts correct customer, amount, GST and description',()=>{const p=parse('Create a quotation for ABC Enterprises for website development for ₹40,000 plus 18% GST.');assert.equal(p.docType,'quotation');assert.equal(p.customer,'ABC Enterprises');assert.equal(p.amount,40000);assert.equal(p.gstBp,1800);assert.equal(p.description,'website development');});
test('all six document types can be selected from prompts',()=>{for(const [prompt,type] of [['quotation','quotation'],['invoice','invoice'],['business letter','letter'],['agreement','agreement'],['report','report'],['custom document','custom']])assert.equal(parse(prompt).docType,type);});
test('agreement with customer extracts the customer name',()=>assert.equal(parse('Agreement with Patil Industries for software services Rs 50000').customer,'Patil Industries'));
test('missing GST follows zero-percent business default',()=>assert.equal(parse('Quotation for ABC Enterprises for design Rs 1000').gstBp,0));
test('lowercase customer names and letter subjects are extracted',()=>{const p=parse('Business letter to sharma & co regarding annual maintenance proposal');assert.equal(p.customer,'sharma & co');assert.equal(p.subject,'annual maintenance proposal');});
