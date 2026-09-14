'use strict';
const cards=[...document.querySelectorAll('.catalogue-card')];
const filters=document.querySelector('#filters');
const selected=new Set();
// Keep a visitor's shortlist while they open project pages in this tab.
if(filters){
 try{
  const saved=JSON.parse(sessionStorage.getItem('bpShortlist')||'[]');
  if(Array.isArray(saved))saved.filter(slug=>cards.some(card=>card.querySelector('.compare-check').value===slug)).slice(0,3).forEach(slug=>selected.add(slug));
 }catch(_){}
 document.querySelectorAll('.compare-check').forEach(input=>input.checked=selected.has(input.value));
}
function updateCatalogue(){
 if(!filters)return;
 const q=document.querySelector('#project-search').value.toLowerCase().trim(), location=document.querySelector('#location-filter')?.value.toLowerCase().trim()||'', type=document.querySelector('#type-filter').value, bed=document.querySelector('#bed-filter').value,budget=document.querySelector('#budget-filter').value;
 let count=0;
 cards.forEach(card=>{const d=card.dataset,n=Number(d.price);const show=(!q||(d.name+' '+d.location).toLowerCase().includes(q))&&(!location||d.location.toLowerCase().includes(location))&&(!type||type===d.kind)&&(!bed||d.beds.split(',').includes(bed))&&(!budget||(budget==='unknown'?n===0:budget==='higher'?n>20000000:n>0&&n<=Number(budget)));card.hidden=!show;if(show)count++;});
 document.querySelector('#project-count').textContent=({en:`${count} of ${cards.length} projects`,ru:`Проектов: ${count} из ${cards.length}`,az:`${cards.length} layihədən ${count}`} )[currentLang];
 document.querySelector('#no-projects').hidden=count>0;
 document.querySelector('#empty-projects').hidden=count>0;
}
if(filters){filters.addEventListener('submit',e=>e.preventDefault());filters.addEventListener('input',updateCatalogue);filters.addEventListener('reset',()=>{const location=document.querySelector('#location-filter');if(location)location.value='';setTimeout(updateCatalogue,0)});updateCatalogue();}
document.querySelector('#location-filter')?.addEventListener('change',()=>{updateCatalogue();document.querySelector('#projects')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
function comparison(){
 const region=document.querySelector('#comparison');if(!region)return;region.hidden=selected.size===0;
 document.querySelector('#shortlist-bar').hidden=selected.size===0;
 document.querySelector('#shortlist-count').textContent=`${selected.size} / 3`;
 cards.forEach(card=>card.classList.toggle('is-selected',selected.has(card.querySelector('.compare-check').value)));
 try{sessionStorage.setItem('bpShortlist',JSON.stringify([...selected]));}catch(_){}
 const container=document.querySelector('#compare-table');container.replaceChildren();
 const table=document.createElement('table');const caption=document.createElement('caption');caption.className='visually-hidden';caption.textContent=dict[currentLang].compareTitle;table.append(caption);
 const chosen=cards.filter(c=>selected.has(c.querySelector('.compare-check').value));
 const labels=currentLang==='ru'?['Проект','Расположение','Тип','Спальни','Цена по документу','Срок сдачи']:currentLang==='az'?['Layihə','Ərazi','Növ','Yataq otaqları','Sənəddəki qiymət','Təhvil']:['Project','Location','Type','Bedrooms','Document price','Completion'];
 labels.forEach((label,i)=>{const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;tr.append(th);chosen.forEach(c=>{const td=document.createElement('td');const d=c.dataset;const words=dict[currentLang];const kind=words[{Apartment:'typeApartment',Villa:'typeVilla',Residence:'typeResidence',Retail:'typeRetail'}[d.kind]]||d.kind;const beds=d.beds==='unknown'?words.requestDetails:d.beds==='retail'?'—':d.beds.split(',').map(n=>n==='0'?words.studio:n).join(' / ');td.textContent=[d.name,d.location,kind,beds,c.querySelector('.card-price').textContent,d.date==='Please enquire'?words.confirmDate:d.date][i];tr.append(td)});table.append(tr)});container.append(table);
 document.querySelector('#compare-enquiry').href='https://wa.me/971561422113?text='+encodeURIComponent('Hello Bridge Properties, please help me compare these projects and confirm current terms:\n'+chosen.map(c=>c.dataset.name).join('\n'));
 document.querySelectorAll('.compare-check').forEach(c=>{c.disabled=selected.size>=3&&!c.checked;c.setAttribute('aria-label',dict[currentLang].compare+': '+c.closest('.catalogue-card').dataset.name);});
}
document.querySelectorAll('.compare-check').forEach(input=>input.addEventListener('change',()=>{if(input.checked)selected.add(input.value);else selected.delete(input.value);comparison();}));
function clearShortlist(){
 selected.clear();document.querySelectorAll('.compare-check').forEach(c=>c.checked=false);comparison();
 document.querySelector('#project-search')?.focus();
}
document.querySelector('#clear-comparison')?.addEventListener('click',clearShortlist);
document.querySelector('#clear-shortlist')?.addEventListener('click',clearShortlist);
document.querySelector('#show-all-projects')?.addEventListener('click',()=>{filters.reset();const location=document.querySelector('#location-filter');if(location)location.value='';document.querySelector('#project-search').focus();});
let viewer;
document.querySelectorAll('[data-gallery]').forEach(link=>link.addEventListener('click',event=>{
 if(typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;event.preventDefault();
 if(!viewer){viewer=document.createElement('dialog');viewer.className='image-viewer';viewer.innerHTML='<div class="viewer-bar"><span id="viewer-title"></span><button class="btn ghost" type="button">Close ×</button></div><img alt="">';viewer.setAttribute('aria-labelledby','viewer-title');document.body.append(viewer);viewer.querySelector('button').addEventListener('click',()=>viewer.close());viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});}
 const img=link.querySelector('img');viewer.querySelector('img').src=link.href;viewer.querySelector('img').alt=img.alt;viewer.querySelector('span').textContent=img.alt;viewer.querySelector('button').textContent=dict[currentLang].closeViewer;viewer.showModal();
}));
document.addEventListener('languagechange',()=>{updateCatalogue();comparison();});
comparison();
