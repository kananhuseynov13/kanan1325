/* Deploy as the owner, access Anyone. The Sheet stays Restricted.
 * No GET/list/update endpoint exposes leads. No personal data is logged.
 */
const HEADERS = ['Enquiry ID','Received UTC','Received Dubai','Name','Phone',
 'Property / project','Interest','Budget','Purchase timeframe','Requirements',
 'Consultation time Dubai','Language','Source','Medium','Campaign','Content','Term',
 'Landing page','Submitted page','Referrer host','Consent','Consent version',
 'Follow-up status','Assigned to','Next follow-up','Notes','Payload hash'];
const ORIGINS = ['https://bridgeproperties.ae','https://www.bridgeproperties.ae',
 'https://kananhuseynov13.github.io'];

// Run once in the Apps Script editor. Creates a private workbook, never a public Sheet.
function setup() {
 const props=PropertiesService.getScriptProperties();
 let id=props.getProperty('SHEET_ID');
 if(!id) {
  const book=SpreadsheetApp.create('Bridge Properties — Private Enquiries');
  book.setSpreadsheetTimeZone('Asia/Dubai');
  const sheet=book.getSheets()[0]; sheet.setName('Enquiries');
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS])
   .setBackground('#13283f').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1); sheet.getRange(1,1,1,HEADERS.length).createFilter();
  sheet.setColumnWidths(1,HEADERS.length,170);
  sheet.setColumnWidth(10,320); sheet.hideColumns(27);
  sheet.getRange(2,23,sheet.getMaxRows()-1,1).setDataValidation(
   SpreadsheetApp.newDataValidation().requireValueInList(
    ['New','Contacted','Qualified','Viewing booked','Won','Lost','Do not contact'],true)
    .setAllowInvalid(false).build());
  id=book.getId(); props.setProperty('SHEET_ID',id);
 }
 if(!props.getProperty('SIGNING_KEY')) props.setProperty('SIGNING_KEY',
  Utilities.getUuid()+Utilities.getUuid());
 return 'https://docs.google.com/spreadsheets/d/'+id+'/edit';
}
function json_(value) {
 return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function sign_(value) {
 const key=PropertiesService.getScriptProperties().getProperty('SIGNING_KEY');
 if(!key) throw new Error('Not configured');
 return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,key)).replace(/=+$/,'');
}
function validId_(id) {
 return typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
function doGet(e) {
 try {
  const p=e.parameter || {};
  if(!validId_(p.id) || !ORIGINS.includes(p.origin)) return json_({ok:false});
  const value=[Date.now(),p.id,p.origin].join('|');
  return json_({ok:true,token:value+'|'+sign_(value)});
 } catch (_) {return json_({ok:false});}
}
function validate_(p) {
 if(!p || !validId_(p.id) || !ORIGINS.includes(p.origin)) throw new Error('Invalid request');
 if(p.consent!==true || p.consentVersion!=='2026-10-29' || p.website) throw new Error('Invalid consent');
 const limits={name:100,phone:30,project:160,interest:160,budget:100,timeframe:100,
  message:2000,appointment:30,language:5,source:300,medium:300,campaign:300,
  content:300,term:300,landingPage:300,page:300,referrer:300};
 Object.keys(limits).forEach(k=>{
  if(typeof p[k]!=='string' || p[k].length>limits[k] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(p[k])) throw new Error('Invalid field');
  p[k]=p[k].trim();
 });
 if(!p.name || !p.interest || !p.project || !/^\+?[0-9]{7,15}$/.test(p.phone)) throw new Error('Invalid contact');
 if(!['en','ru','az'].includes(p.language)) throw new Error('Invalid language');
 if(p.appointment && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.appointment)) throw new Error('Invalid date');
 const parts=String(p.token || '').split('|');
 if(parts.length!==4 || parts[1]!==p.id || parts[2]!==p.origin) throw new Error('Invalid challenge');
 const age=Date.now()-Number(parts[0]);
 if(!Number.isFinite(age) || age<2000 || age>30*60*1000 || sign_(parts.slice(0,3).join('|'))!==parts[3]) throw new Error('Expired challenge');
 return p;
}
function hash_(value) {
 return Utilities.base64EncodeWebSafe(Utilities.computeDigest(
  Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8));
}
function cell_(value) {
 // Text format plus apostrophe prevents spreadsheet/CSV formula injection.
 const s=String(value);
 return /^[\s]*[=+@-]/.test(s) ? "'"+s : s;
}
function storeLead_(p) {
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(10000)) throw new Error('Busy');
 try {
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id) throw new Error('Not configured');
  const sheet=SpreadsheetApp.openById(id).getSheetByName('Enquiries');
  if(!sheet || JSON.stringify(sheet.getRange(1,1,1,HEADERS.length).getValues()[0])!==JSON.stringify(HEADERS)) throw new Error('Schema changed');
  const fields=['name','phone','project','interest','budget','timeframe','message','appointment',
   'language','source','medium','campaign','content','term','landingPage','page','referrer','consentVersion'];
  const fingerprint=hash_(JSON.stringify(fields.map(k=>p[k])));
  const last=sheet.getLastRow();
  if(last>1) {
   const found=sheet.getRange(2,1,last-1,1).createTextFinder(p.id).matchEntireCell(true).findNext();
   if(found) {
    if(sheet.getRange(found.getRow(),27).getValue()!==fingerprint) throw new Error('Changed retry');
    return {ok:true,id:p.id};
   }
  }
  const now=new Date(), cutoff=now.getTime()-24*60*60*1000;
  // Durable limits, independent of cache eviction or row order.
  const recent=last>1 ? sheet.getRange(2,1,last-1,5).getValues() : [];
  const day=recent.filter(row=>Date.parse(row[1])>=cutoff);
  const phoneRows=day.filter(row=>String(row[4]).replace(/^'/,'').replace(/^\+/,'')===p.phone.replace(/^\+/,'') && Date.parse(row[1])>=now.getTime()-3600000);
  if(day.length>=200 || phoneRows.length>=3) throw new Error('Rate limit');
  const row=[p.id,now.toISOString(),Utilities.formatDate(now,'Asia/Dubai','yyyy-MM-dd HH:mm:ss'),
   p.name,p.phone,p.project,p.interest,p.budget,p.timeframe,p.message,p.appointment,p.language,
   p.source,p.medium,p.campaign,p.content,p.term,p.landingPage,p.page,p.referrer,'Yes',p.consentVersion,
   'New','','','',fingerprint].map(cell_);
  if(last+1>sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),1000);
  sheet.getRange(last+1,1,1,row.length).setNumberFormat('@').setValues([row]);
  SpreadsheetApp.flush(); // Never acknowledge before the write has completed.
  return {ok:true,id:p.id};
 } finally {lock.releaseLock();}
}
function doPost(e) {
 try {
  if(!e.postData || e.postData.contents.length>12000) return json_({ok:false});
  return json_(storeLead_(validate_(JSON.parse(e.postData.contents))));
 } catch (_) {
  // Generic public error: never echo contact details, tokens or internal exceptions.
  return json_({ok:false});
 }
}
