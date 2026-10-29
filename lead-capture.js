/* Static-site client: private persistence happens only in Apps Script. */
(() => {
 'use strict';
 const config = window.BRIDGE_LEAD_CONFIG || {};
 const copy = {
  en: {
   submit:'Send enquiry', note:'Your enquiry is saved privately for our advisor. WhatsApp is optional.',
   consent:'I agree that Bridge Properties may store these details and contact me about this enquiry by phone or WhatsApp.',
   privacy:'Privacy notice', whatsapp:'Contact us on WhatsApp', saving:'Saving your enquiry…',
   saved:'Enquiry received. Your advisor will contact you. You can also message us on WhatsApp.',
   error:'We could not confirm your enquiry was saved. Please retry, or contact us on WhatsApp.',
   phone:'Enter a phone number with country code (7–15 digits).'
  },
  ru: {
   submit:'Отправить заявку', note:'Заявка сохраняется конфиденциально для консультанта. WhatsApp — по желанию.',
   consent:'Я согласен на хранение этих данных Bridge Properties и связь по телефону или WhatsApp по моей заявке.',
   privacy:'Конфиденциальность', whatsapp:'Написать в WhatsApp', saving:'Сохраняем заявку…',
   saved:'Заявка получена. Консультант свяжется с вами. Вы также можете написать в WhatsApp.',
   error:'Не удалось подтвердить сохранение заявки. Повторите попытку или напишите в WhatsApp.',
   phone:'Введите номер с кодом страны (7–15 цифр).'
  },
  az: {
   submit:'Sorğunu göndərin', note:'Sorğunuz məsləhətçi üçün məxfi saxlanılır. WhatsApp istəyə bağlıdır.',
   consent:'Bridge Properties-in bu məlumatları saxlamasına və sorğumla bağlı telefon və ya WhatsApp ilə əlaqə saxlamasına razıyam.',
   privacy:'Məxfilik bildirişi', whatsapp:'WhatsApp-da yazın', saving:'Sorğunuz saxlanılır…',
   saved:'Sorğunuz qəbul edildi. Məsləhətçi sizinlə əlaqə saxlayacaq. WhatsApp-da da yaza bilərsiniz.',
   error:'Sorğunun saxlanmasını təsdiqləyə bilmədik. Yenidən cəhd edin və ya WhatsApp-da yazın.',
   phone:'Ölkə kodu ilə telefon nömrəsi daxil edin (7–15 rəqəm).'
  }
 };
 const state = new WeakMap();
 const text = () => copy[document.documentElement.lang] || copy.en;
 const active = config.enabled === true && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.endpoint);
 function attribution() {
  const q=new URLSearchParams(location.search);
  let referrer=''; try {referrer=new URL(document.referrer).hostname;} catch (_) {}
  const result={source:q.get('utm_source') || referrer || 'Direct',
   medium:q.get('utm_medium') || '', campaign:q.get('utm_campaign') || '',
   content:q.get('utm_content') || '', term:q.get('utm_term') || '',
   landingPage:location.pathname, referrer};
  Object.keys(result).forEach(k=>result[k]=result[k].slice(0,300));
  // Session attribution only; never store contact details in browser storage.
  try {
   const previous=JSON.parse(sessionStorage.getItem('bpLeadSource'));
   if (!q.has('utm_source') && previous && typeof previous.source==='string') return previous;
   sessionStorage.setItem('bpLeadSource',JSON.stringify(result));
  } catch (_) {}
  return result;
 }
 const source=attribution();
 async function request(url, options={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try {
   const response=await fetch(url,{...options,signal:controller.signal,credentials:'omit',redirect:'follow'});
   if(!response.ok) throw new Error('Transport failed');
   return await response.json();
  } finally {clearTimeout(timer);}
 }
 function init() {
  if(!active) return; // Deployment gate preserves the current form until storage is verified.
  document.querySelectorAll('form[onsubmit*="sendLead"], #az-lead-form').forEach((form,index)=>{
   if(state.has(form)) return;
   const s={busy:false,version:0}; state.set(form,s);
   const label=document.createElement('label');
   const check=document.createElement('input');
   check.type='checkbox'; check.name='consent'; check.required=true;
   check.style.width='auto'; check.style.marginRight='.6rem';
   const span=document.createElement('span'); span.dataset.captureCopy='consent';
   label.append(check,span);
   const privacy=document.createElement('a');
   privacy.href='/lead-privacy.html'; privacy.target='_blank'; privacy.rel='noopener';
   privacy.dataset.captureCopy='privacy';
   const trap=document.createElement('input');
   trap.name='website'; trap.tabIndex=-1; trap.autocomplete='off';
   trap.setAttribute('aria-hidden','true'); trap.style.cssText='position:absolute;left:-10000px;width:1px;height:1px';
   const status=document.createElement('p'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
   status.id='lead-status-'+index;
   const link=document.createElement('a'); link.href='https://wa.me/971561422113';
   link.target='_blank'; link.rel='noopener'; link.dataset.captureCopy='whatsapp'; link.className='text-link';
   s.status=status; s.link=link;
   const button=form.querySelector('[type=submit]'); s.button=button;
   button.removeAttribute('data-i18n'); button.dataset.captureCopy='submit';
   const note=form.querySelector('.form-note');
   if(note){note.removeAttribute('data-i18n'); note.dataset.captureCopy='note';}
   button.before(label,privacy,trap); form.append(status,link);
   form.addEventListener('input',()=>{
    s.version++; s.saved=false; s.messageKey=null; s.link.href='https://wa.me/971561422113';
    s.status.textContent='';
   });
  });
  const azIntro=document.querySelector('.az-lead .lead-copy p:last-child');
  if(azIntro) azIntro.dataset.captureCopy='note';
  // Existing footer copy must match the enabled storage flow.
  document.querySelectorAll('[data-i18n=privacyNote]').forEach(el=>{
   el.removeAttribute('data-i18n'); el.dataset.captureCopy='note';
  });
  translate();
 }
 function translate() {
  document.querySelectorAll('[data-capture-copy]').forEach(el=>el.textContent=text()[el.dataset.captureCopy]);
  document.querySelectorAll('form[onsubmit*="sendLead"], #az-lead-form').forEach(form=>{
   const s=state.get(form);
   if(s?.busy) s.button.textContent=text().saving;
   if(s?.messageKey) s.status.textContent=text()[s.messageKey];
  });
 }
 async function submit(form,project) {
  if(!active) return false;
  const s=state.get(form);
  if(!s || s.busy || !form.reportValidity()) return;
  const get=name=>String(form.elements.namedItem(name)?.value || '').trim();
  const phone=get('phone').replace(/[\s().-]/g,'');
  if(!/^\+?[0-9]{7,15}$/.test(phone)){s.status.textContent=text().phone;return;}
  const payload={name:get('name'),phone,interest:get('interest') || get('goal'),budget:get('budget'),
   timeframe:get('timeframe'),message:get('message'),appointment:get('appointment'),
   project,language:document.documentElement.lang,consent:form.elements.consent.checked,
   consentVersion:'2026-10-29',website:get('website'),...source,page:location.pathname};
  const snapshot=JSON.stringify(payload);
  if(snapshot!==s.snapshot){s.id=crypto.randomUUID();s.snapshot=snapshot;s.saved=false;s.challenge=null;}
  if(s.saved){s.status.textContent=text().saved;return;}
  s.busy=true; s.button.disabled=true; s.messageKey='saving'; s.status.textContent=text().saving;
  const version=s.version;
  try {
   if(!s.challenge || Date.now()-s.challengeAt>25*60*1000) {
    s.challenge=await request(config.endpoint+'?id='+encodeURIComponent(s.id)+'&origin='+encodeURIComponent(location.origin));
    if(!s.challenge.ok) throw new Error('Challenge unavailable');
    s.challengeAt=Date.now();
   }
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,2200-(Date.now()-s.challengeAt))));
   const result=await request(config.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
    body:JSON.stringify({...payload,id:s.id,origin:location.origin,token:s.challenge.token})});
   if(result.ok!==true || result.id!==s.id) throw new Error('Unconfirmed write');
   if(version!==s.version) {s.messageKey=null;s.status.textContent='';return;}
   s.saved=true; s.messageKey='saved';
   const message=['Hello Bridge Properties','Enquiry reference: '+s.id,
    'Project: '+project,'Name: '+payload.name,'Phone: '+phone,'Interest: '+payload.interest,
    'Budget: '+payload.budget,'Timeframe: '+payload.timeframe,'Requirements: '+payload.message,
    'Preferred appointment (Dubai time): '+payload.appointment].join('\n');
   s.link.href='https://wa.me/971561422113?text='+encodeURIComponent(message);
  } catch (_) {s.messageKey='error';}
  finally {
   s.busy=false;s.button.disabled=false;translate();
  }
 }
 window.BridgeLeads={enabled:active,submit};
 document.addEventListener('languagechange',translate);
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
