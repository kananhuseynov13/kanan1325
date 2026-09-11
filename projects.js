'use strict';
const cards=[...document.querySelectorAll('.catalogue-card')];
const filters=document.querySelector('#filters');
const selected=new Set();
function updateCatalogue(){
 if(!filters)return;
 const q=document.querySelector('#project-search').value.toLowerCase().trim(), type=document.querySelector('#type-filter').value, bed=document.querySelector('#bed-filter').value,budget=document.querySelector('#budget-filter').value;
 let count=0;
 cards.forEach(card=>{const d=card.dataset,n=Number(d.price);const show=(!q||(d.name+' '+d.location).toLowerCase().includes(q))&&(!type||type===d.kind)&&(!bed||d.beds.split(',').includes(bed))&&(!budget||(budget==='unknown'?n===0:budget==='higher'?n>20000000:n>0&&n<=Number(budget)));card.hidden=!show;if(show)count++;});
 document.querySelector('#project-count').textContent=({en:`${count} of ${cards.length} projects`,ru:`Проектов: ${count} из ${cards.length}`,az:`${cards.length} layihədən ${count}`} )[currentLang];
 document.querySelector('#no-projects').hidden=count>0;
}
if(filters){filters.addEventListener('submit',e=>e.preventDefault());filters.addEventListener('input',updateCatalogue);filters.addEventListener('reset',()=>setTimeout(updateCatalogue,0));updateCatalogue();}
function comparison(){
 const region=document.querySelector('#comparison');if(!region)return;region.hidden=selected.size===0;
 const container=document.querySelector('#compare-table');container.replaceChildren();
 const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent=dict[currentLang].compareHint;table.append(caption);
 const chosen=cards.filter(c=>selected.has(c.querySelector('.compare-check').value));
 const labels=currentLang==='ru'?['Проект','Расположение','Тип','Спальни','Цена по документу','Срок сдачи']:currentLang==='az'?['Layihə','Ərazi','Növ','Yataq otaqları','Sənəddəki qiymət','Təhvil']:['Project','Location','Type','Bedrooms','Document price','Completion'];
 labels.forEach((label,i)=>{const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;tr.append(th);chosen.forEach(c=>{const td=document.createElement('td');const d=c.dataset;td.textContent=[d.name,d.location,d.kind,d.beds.replace('0','Studio').replaceAll(',',' / '),c.querySelector('.card-price').textContent,d.date][i];tr.append(td)});table.append(tr)});container.append(table);
 document.querySelector('#compare-enquiry').href='https://wa.me/971561422113?text='+encodeURIComponent('Hello Bridge Properties, please help me compare these projects and confirm current terms:\n'+chosen.map(c=>c.dataset.name).join('\n'));
 document.querySelectorAll('.compare-check').forEach(c=>{c.disabled=selected.size>=3&&!c.checked;});
}
document.querySelectorAll('.compare-check').forEach(input=>input.addEventListener('change',()=>{if(input.checked)selected.add(input.value);else selected.delete(input.value);comparison();}));
document.querySelector('#clear-comparison')?.addEventListener('click',()=>{selected.clear();document.querySelectorAll('.compare-check').forEach(c=>c.checked=false);comparison();});
let viewer;
document.querySelectorAll('[data-gallery]').forEach(link=>link.addEventListener('click',event=>{
 if(!HTMLDialogElement.prototype.showModal)return;event.preventDefault();
 if(!viewer){viewer=document.createElement('dialog');viewer.className='image-viewer';viewer.innerHTML='<div class="viewer-bar"><span id="viewer-title"></span><button class="btn ghost" type="button">Close ×</button></div><img alt="">';viewer.setAttribute('aria-labelledby','viewer-title');document.body.append(viewer);viewer.querySelector('button').addEventListener('click',()=>viewer.close());viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});}
 const img=link.querySelector('img');viewer.querySelector('img').src=link.href;viewer.querySelector('img').alt=img.alt;viewer.querySelector('span').textContent=img.alt;viewer.showModal();
}));
document.addEventListener('languagechange',()=>{updateCatalogue();comparison();});
