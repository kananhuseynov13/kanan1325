'use strict';
(() => {
 const copy={en:{all:'All properties',sort:'Sort by',featured:'Featured',name:'Project name',low:'Quoted price: low to high',high:'Quoted price: high to low',enquire:'Get current prices & availability',extras:'Add requirements or request a viewing',browse:'Browse projects',beds:'bedrooms',remove:'Remove filter',photo:'Featured project · developer rendering'},ru:{all:'Все объекты',sort:'Сортировка',featured:'Рекомендуемые',name:'Название проекта',low:'Цена: по возрастанию',high:'Цена: по убыванию',enquire:'Узнать цены и наличие',extras:'Пожелания или запись на просмотр',browse:'Смотреть проекты',beds:'спальни',remove:'Убрать фильтр',photo:'Избранный проект · визуализация'},az:{all:'Bütün əmlaklar',sort:'Sıralama',featured:'Seçilmiş layihələr',name:'Layihə adı',low:'Qiymət: aşağıdan yuxarı',high:'Qiymət: yuxarıdan aşağı',enquire:'Cari qiymət və mövcudluğu öyrənin',extras:'İstəklərinizi və ya baxış vaxtını əlavə edin',browse:'Layihələrə baxın',beds:'yataq otağı',remove:'Filtri sil',photo:'Seçilmiş layihə · render'}};
 const lang=()=>copy[document.documentElement.lang]||copy.en;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const catalogue=document.querySelector('#projects');
 const form=document.querySelector('#filters');
 const grid=document.querySelector('.catalogue-grid');
 const projectCards=[...document.querySelectorAll('.catalogue-card')];
 let toolbar,active,sortSelect;
 if(form&&grid){
  const locationBlock=document.querySelector('.location-explorer');
  if(locationBlock)form.before(locationBlock);
  toolbar=el('div','catalogue-toolbar');const types=el('div','quick-types');types.setAttribute('role','group');
  for(const value of ['', 'Apartment','Villa','Residence','Retail']){const b=el('button');b.type='button';b.dataset.kind=value;b.addEventListener('click',()=>{document.querySelector('#type-filter').value=value;form.dispatchEvent(new Event('input',{bubbles:true}));});types.append(b);}
  const label=el('label','sort-control');label.htmlFor='project-sort';label.append(el('span'));
  sortSelect=el('select');sortSelect.id='project-sort';for(const v of ['featured','name','low','high']){const o=el('option');o.value=v;sortSelect.append(o);}label.append(sortSelect);toolbar.append(types,label);form.after(toolbar);
  active=el('div','active-filters');toolbar.after(active);
  document.querySelector('#project-count')?.setAttribute('role','status');
  sortSelect.addEventListener('change',()=>{
   const sorted=[...projectCards];const mode=sortSelect.value;
   if(mode==='name')sorted.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,document.documentElement.lang));
   if(mode==='low'||mode==='high')sorted.sort((a,b)=>{const x=Number(a.dataset.price),y=Number(b.dataset.price);if(!x)return !y?0:1;if(!y)return -1;return mode==='low'?x-y:y-x;});
   sorted.forEach(c=>grid.append(c));
  });
  projectCards.forEach(card=>{
   const specs=el('div','card-specs');const kind=el('span');kind.dataset.specKind=card.dataset.kind;specs.append(kind);
   if(!['unknown','retail'].includes(card.dataset.beds)){const beds=el('span');beds.dataset.specBeds=card.dataset.beds;specs.append(beds);}
   card.querySelector('h3').after(specs);
   const link=el('a','card-enquire');link.href='https://wa.me/971561422113?text='+encodeURIComponent('Hello Bridge Properties, please send current prices and availability for '+card.dataset.name+'.');card.querySelector('.card-actions').append(link);
  });
 }
 document.querySelectorAll('.lead-form').forEach(form=>{
  const message=form.querySelector('[name="message"]'),appointment=form.querySelector('[name="appointment"]');if(!message&&!appointment)return;
  const details=el('details','form-extras');const summary=el('summary');details.append(summary);
  const first=message||appointment;const firstLabel=form.querySelector(`label[for="${first.id}"]`);(firstLabel||first).before(details);
  [message,appointment].filter(Boolean).forEach(field=>{const label=form.querySelector(`label[for="${field.id}"]`);const hint=field.nextElementSibling?.classList.contains('field-hint')?field.nextElementSibling:null;if(label)details.append(label);details.append(field);if(hint)details.append(hint);});
 });
 const mobile=el('nav','mobile-actions');mobile.setAttribute('aria-label','Quick actions');const browse=el('a');browse.href=catalogue?'#projects':document.querySelector('.nav a')?.getAttribute('href')||'index.html#projects';const wa=el('a',null,'WhatsApp');wa.href='https://wa.me/971561422113';mobile.append(browse,wa);document.body.append(mobile);
 function refresh(){
  const t=lang(),words=typeof dict!=='undefined'?dict[document.documentElement.lang]||dict.en:{};
  const kinds={Apartment:words.typeApartment||'Apartments',Villa:words.typeVilla||'Villas',Residence:words.typeResidence||'Branded residences',Retail:words.typeRetail||'Retail'};
  browse.textContent=t.browse;document.querySelectorAll('.form-extras summary').forEach(s=>s.textContent=t.extras);
  document.querySelector('[data-hero-photo]')?.replaceChildren(document.createTextNode(t.photo));
  if(!toolbar)return;
  toolbar.querySelector('.quick-types').setAttribute('aria-label',words.propertyType||'Property type');
  toolbar.querySelectorAll('button').forEach(b=>{b.textContent=b.dataset.kind?kinds[b.dataset.kind]:t.all;b.setAttribute('aria-pressed',String(b.dataset.kind===document.querySelector('#type-filter').value));});
  toolbar.querySelector('.sort-control span').textContent=t.sort;[...sortSelect.options].forEach(o=>o.textContent=t[o.value]);
  document.querySelectorAll('[data-spec-kind]').forEach(s=>s.textContent=kinds[s.dataset.specKind]);
  document.querySelectorAll('[data-spec-beds]').forEach(s=>s.textContent=s.dataset.specBeds.split(',').map(v=>v==='0'?(words.studio||'Studio'):v).join(' / ')+' '+t.beds);
  document.querySelectorAll('.card-enquire').forEach(a=>a.textContent=t.enquire);
  active.replaceChildren();
  ['project-search','location-filter','type-filter','bed-filter','budget-filter'].forEach(id=>{const control=document.getElementById(id);if(!control?.value)return;const label=control.tagName==='SELECT'?control.selectedOptions[0].textContent:control.value;const b=el('button',null,label+' ×');b.type='button';b.setAttribute('aria-label',t.remove+': '+label);b.addEventListener('click',()=>{control.value='';form.dispatchEvent(new Event('input',{bubbles:true}));control.focus();});active.append(b);});
 }
 form?.addEventListener('input',refresh);form?.addEventListener('reset',()=>{sortSelect.value='featured';sortSelect.dispatchEvent(new Event('change'));setTimeout(refresh,0);});document.querySelector('#location-filter')?.addEventListener('change',refresh);document.addEventListener('languagechange',refresh);refresh();
})();
