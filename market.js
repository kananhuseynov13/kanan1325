'use strict';
const marketArea=document.querySelector('#market-area');
let officialMarket=null;
function marketDisplay(){
 const area=marketArea.value,type=document.querySelector('#market-type').value,stage=document.querySelector('#market-stage').value;
 const value=document.querySelector('#market-value'),status=document.querySelector('#market-status'),detail=document.querySelector('#market-detail'),period=document.querySelector('#market-period');
 value.textContent='—';status.textContent=dict[currentLang].marketUnavailable;detail.textContent=dict[currentLang].marketPending;period.textContent='';
 const segment=officialMarket?.areas?.find(a=>a.name===area)?.segments?.find(s=>s.type===type&&s.stage===stage);
 // Do not publish numbers unless provenance, coverage, sample and dates are verified.
 const verified=officialMarket?.status==='verified' && officialMarket.source_url==='https://dubailand.gov.ae/en/open-data/real-estate-data/' && officialMarket.updated_at && officialMarket.period_start && officialMarket.period_end && segment?.coverage_verified===true && segment.transactions>=10 && Number.isFinite(segment.median_aed_sqft) && segment.median_aed_sqft>0;
 if(verified){
  const locale={en:'en-AE',ru:'ru-RU',az:'az-AZ'}[currentLang];
  value.textContent=new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(segment.median_aed_sqft)+' AED / sq ft';
  status.textContent=({en:'Verified data snapshot',ru:'Подтверждённый срез данных',az:'Təsdiqlənmiş məlumatlar'})[currentLang];
  detail.textContent=({en:`Median of ${segment.transactions} registered sales.`,ru:`Медиана по ${segment.transactions} зарегистрированным продажам.`,az:`${segment.transactions} qeydiyyatlı satış üzrə median.`})[currentLang];
  period.textContent=`${officialMarket.period_start} — ${officialMarket.period_end} · ${officialMarket.updated_at}`;
 }
 document.querySelector('#market-enquiry').href='https://wa.me/971561422113?text='+encodeURIComponent(`Hello Bridge Properties, please send a price-per-square-foot comparison using official DLD records for ${area}, ${type}, ${stage}. Please include the dates, transaction count and comparable projects.`);
}
function calculatePSF(){
 const price=Number(document.querySelector('#psf-price').value),area=Number(document.querySelector('#psf-area').value),unit=document.querySelector('#psf-unit').value;
 const output=document.querySelector('#psf-output');output.textContent='';
 if(!(price>0&&area>0&&Number.isFinite(price)&&Number.isFinite(area)))return;
 const psf=price/(unit==='sqm'?area*10.76391041671:area);
 output.textContent=new Intl.NumberFormat({en:'en-AE',ru:'ru-RU',az:'az-AZ'}[currentLang],{maximumFractionDigits:2}).format(psf)+' AED / sq ft';
}
if(marketArea){
 ['market-area','market-type','market-stage'].forEach(id=>document.getElementById(id).addEventListener('change',marketDisplay));
 document.querySelector('#psf-form').addEventListener('submit',e=>{e.preventDefault();calculatePSF();});
 document.querySelector('#psf-form').addEventListener('input',()=>{document.querySelector('#psf-output').textContent='';});
 document.addEventListener('languagechange',()=>{marketDisplay();if(document.querySelector('#psf-output').textContent)calculatePSF();});
 marketDisplay();
 fetch('market-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();}).then(data=>{officialMarket=data;marketDisplay();}).catch(()=>{officialMarket=null;marketDisplay();});
}
