const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/brand.js','utf8'),c);
test('document identity includes saved contact details, escapes text and excludes unsafe logos',()=>{
  const html=c.BizBrand.header({business_name:'TechDwarf <test>',email:'hello@example.com',phone:'123',logo_data_url:'data:image/svg+xml;base64,AAAA'});
  assert.ok(html.includes('TechDwarf &lt;test&gt;'));assert.ok(html.includes('hello@example.com'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('BizDocs AI'));
  assert.ok(c.BizBrand.header({logo_data_url:'data:image/png;base64,AAAA'}).includes('Business logo'));
});
test('AI context contains profile defaults, excludes logo and unrelated settings',()=>{
  const profile=c.BizBrand.context({business_name:'TechDwarf',default_gst_bp:500,logo_data_url:'secret',password:'secret'});
  assert.equal(profile.business_name,'TechDwarf');assert.equal(profile.default_gst_bp,500);assert.equal(profile.logo_data_url,undefined);assert.equal(profile.password,undefined);
});
