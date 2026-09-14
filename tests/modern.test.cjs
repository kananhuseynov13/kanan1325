// Run with jsdom available: node tests/modern.test.cjs
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
function open(file){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://bridgeproperties.ae/'+file,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:true,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const file of ['script.js','projects.js','modern.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8')).runInContext(dom.getInternalVMContext());
 return dom;
}
(async()=>{
 const dom=open('index.html'),w=dom.window,d=w.document;
 const visible=()=>[...d.querySelectorAll('.catalogue-card')].filter(c=>!c.hidden);
 assert.equal(visible().length,10);
 assert.equal(d.querySelectorAll('.card-enquire').length,10);
 assert.equal(d.querySelectorAll('.mobile-actions').length,1);
 assert.equal(d.querySelector('.location-explorer').parentElement.id,'projects');
 d.querySelector('.quick-types [data-kind="Villa"]').click();assert.equal(visible().length,4);
 assert.equal(d.querySelector('#type-filter').value,'Villa');
 d.querySelector('.active-filters button').click();assert.equal(visible().length,10);
 const loc=d.querySelector('#location-filter');loc.value='Business Bay';loc.dispatchEvent(new w.Event('change'));assert.equal(visible().length,1);
 d.querySelector('.active-filters button').click();assert.equal(visible().length,10);
 const search=d.querySelector('#project-search');search.value='not a project';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(visible().length,0);assert.equal(d.querySelector('#empty-projects').hidden,false);
 d.querySelector('#filters').reset();await new Promise(r=>setTimeout(r,10));assert.equal(visible().length,10);
 const sort=d.querySelector('#project-sort');sort.value='low';sort.dispatchEvent(new w.Event('change'));assert.equal(visible()[0].dataset.name,'360 Riverside Crescent');
 const checkbox=visible()[0].querySelector('.compare-check');checkbox.checked=true;checkbox.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('#shortlist-bar').hidden,false);
 for(const l of ['en','ru','az']){d.querySelector(`[data-lang="${l}"]`).click();assert.equal(d.documentElement.lang,l);assert.ok(d.querySelector('.card-enquire').textContent.length>5);assert.ok(d.querySelector('.quick-types button').textContent.length>3);}
 assert.ok(d.querySelector('.form-extras [name="message"]'));assert.ok(d.querySelector('.lead-form [name="phone"]'));assert.equal(d.querySelector('.lead-form [name="phone"]').closest('details'),null);
 dom.window.close();
 for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='index.html')){const p=open(file);assert.equal(p.window.document.querySelectorAll('.mobile-actions').length,1);assert.ok(p.window.document.querySelector('.lead-form [name="message"]'));p.window.close();}
 console.log('PASS: filters, empty state, reset, sorting, shortlist, AZ/RU/EN, enquiry fields and all project pages.');
})();
