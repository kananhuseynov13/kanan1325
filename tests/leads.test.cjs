const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=require('node:path').resolve(__dirname,'..');
const code=fs.readFileSync(root+'/backend/Code.gs','utf8');
let rows=[], flushFails=false;
const props={SHEET_ID:'private',SIGNING_KEY:'test-secret'};
const sheet={getLastRow:()=>rows.length,getMaxRows:()=>1000,
 getRange(r,c,n=1,m=1){const range={getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m)),getValue:()=>rows[r-1][c-1],
 setNumberFormat:()=>range,setValues(values){values.forEach((v,i)=>{rows[r-1+i]=v});return range;},
 createTextFinder(value){return {matchEntireCell(){return this},findNext(){const index=rows.findIndex((row,i)=>i>=r-1&&row[c-1]===value);return index<0?null:{getRow:()=>index+1};}};}};return range;}};
const context={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){if(flushFails)throw Error('write failure')}},
 Utilities:{base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url'),
 computeHmacSha256Signature:(v,k)=>crypto.createHmac('sha256',k).update(v).digest(),
 computeDigest:(_,v)=>crypto.createHash('sha256').update(v).digest(),DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},formatDate:()=> '2026-10-29 20:00:00'},Date,JSON,Number,String,Error};
vm.createContext(context);vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
rows=[JSON.parse(run('JSON.stringify(HEADERS)'))];
function payload(overrides={}){const p={id:crypto.randomUUID(),origin:'https://bridgeproperties.ae',consent:true,consentVersion:'2026-10-29',website:'',name:'TEST',phone:'+971500000001',project:'Test project',interest:'Buying',budget:'AED 2m–5m',timeframe:'1–3 months',message:'=HYPERLINK("https://example.com")',appointment:'',language:'en',source:'qa',medium:'test',campaign:'smoke',content:'',term:'',landingPage:'/',page:'/',referrer:'',...overrides};const v=[Date.now()-3000,p.id,p.origin].join('|');p.token=v+'|'+context.sign_(v);return p;}
const post=p=>context.doPost({postData:{contents:JSON.stringify(p)}});
const p=payload();assert.equal(post(p).ok,true);assert.equal(rows.length,2);assert.equal(rows[1][22],'New');assert.equal(rows[1][9][0],"'");assert.equal(rows[1][12],'qa');
assert.equal(post(p).ok,true);assert.equal(rows.length,2,'retry must not duplicate');
assert.equal(post({...p,name:'Changed'}).ok,false);
for(const change of [{consent:false},{website:'spam'},{name:''},{phone:'junk'},{token:'invalid'},{origin:'https://evil.test'},{message:'x'.repeat(2001)},{language:'xx'}])assert.equal(post({...payload(),...change}).ok,false);
const early=payload();const v=[Date.now(),early.id,early.origin].join('|');early.token=v+'|'+context.sign_(v);assert.equal(post(early).ok,false);
const expired=payload();const v2=[Date.now()-31*60000,expired.id,expired.origin].join('|');expired.token=v2+'|'+context.sign_(v2);assert.equal(post(expired).ok,false);
assert.equal(context.doGet({parameter:{id:crypto.randomUUID(),origin:'https://evil.test'}}).ok,false);
assert.equal(context.doGet({parameter:{id:crypto.randomUUID(),origin:p.origin}}).ok,true);
assert.equal(post(payload()).ok,true);assert.equal(post(payload()).ok,true);assert.equal(post(payload()).ok,false,'phone hourly limit');
flushFails=true;assert.equal(post(payload({phone:'+971500000002'})).ok,false,'failed flush must never acknowledge');flushFails=false;
rows[0][0]='changed';assert.equal(post(payload({phone:'+971500000003'})).ok,false,'schema mismatch');
rows=[JSON.parse(run('JSON.stringify(HEADERS)'))];
for(let i=0;i<200;i++) rows.push(['id',new Date().toISOString(),'','','+971500000000']);
assert.equal(post(payload()).ok,false,'global rolling day limit');
console.log('PASS backend: writes, consent, signed challenge, honeypot, validation, formula safety, deduplication, limits, schema and storage failures');
async function clientTest(){
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://bridgeproperties.ae/?utm_source=qa&utm_campaign=smoke',runScripts:'outside-only'});
 const w=dom.window;w.document.documentElement.lang='en';w.BRIDGE_LEAD_CONFIG={enabled:true,endpoint:'https://script.google.com/macros/s/TEST/exec'};
 const calls=[];let failure=false;
 w.fetch=async(url,opts)=>{calls.push([url,opts]);if(failure)throw Error('offline');return {ok:true,json:async()=>opts.method?{ok:true,id:JSON.parse(opts.body).id}:{ok:true,token:'test-token'}}};
 // Only bypass the two-second UI wait; server age validation tested above.
 const originalTimeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>originalTimeout(fn,ms===20000?ms:0);
 vm.runInContext(fs.readFileSync(root+'/lead-capture.js','utf8'),dom.getInternalVMContext());
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const form=w.document.querySelector('.lead-form');
 assert.equal(form.querySelectorAll('[name=consent]').length,1);
 form.elements.name.value='Test Buyer';form.elements.phone.value='+971500000009';form.elements.consent.checked=true;
 await w.BridgeLeads.submit(form,'Cedarwood');
 assert.match(form.querySelector('[role=status]').textContent,/received/);
 const body=JSON.parse(calls.find(c=>c[1].method==='POST')[1].body);assert.equal(body.source,'qa');assert.equal(body.campaign,'smoke');assert.equal(body.consent,true);
 assert.match(form.querySelector('[data-capture-copy=whatsapp]').href,/text=/);
 const length=calls.length;await w.BridgeLeads.submit(form,'Cedarwood');assert.equal(calls.length,length);
 failure=true;form.elements.name.value='Another';form.dispatchEvent(new w.Event('input',{bubbles:true}));
 await w.BridgeLeads.submit(form,'Cedarwood');assert.match(form.querySelector('[role=status]').textContent,/could not confirm/);
 assert.equal(form.querySelector('[type=submit]').disabled,false);
 assert.equal(form.elements.name.value,'Another');
 form.elements.consent.checked=false;const n=calls.length;await w.BridgeLeads.submit(form,'Cedarwood');assert.equal(calls.length,n);
 assert.equal(w.sessionStorage.getItem('bpLeadSource').includes('Test Buyer'),false);
 dom.window.close();console.log('PASS client: consent UI, attribution, confirmed success, optional WhatsApp, duplicate clicks and offline retry');
}
clientTest().catch(e=>{console.error(e);process.exitCode=1});
