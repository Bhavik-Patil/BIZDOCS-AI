'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function request(url,method='GET') {return new Promise((resolve,reject)=>{let handler;const context={URL,require:n=>n==='http'?{createServer:fn=>{handler=fn;return{listen(){}}}}:require(n),__dirname:path.resolve(__dirname,'..'),process:{env:{}},console};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../server.js'),'utf8'),context);let status;try{handler({method,url,headers:{host:'localhost'}},{writeHead:s=>status=s,end:()=>resolve(status)});}catch(e){reject(e);}});}
test('static root is served',async()=>assert.equal(await request('/','HEAD'),200));
test('private repository and config files are blocked',async()=>{for(const p of ['/.git/config','/package.json','/AGENTS.md','/../package.json','/css/../../package.json'])assert.equal(await request(p,'HEAD'),404);});
test('malformed encoding returns 400 instead of crashing',async()=>assert.equal(await request('/%ZZ'),400));
test('unsupported methods return 405',async()=>assert.equal(await request('/','POST'),405));
