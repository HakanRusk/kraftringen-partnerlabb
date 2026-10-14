// DOM behaviour verification, not a browser/layout test.
// npm ci && node qa/partner-crm.mjs; CRM_QA_JSDOM can override the installed dependency.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const {JSDOM} = await import(process.env.CRM_QA_JSDOM ? pathToFileURL(process.env.CRM_QA_JSDOM).href : 'jsdom');
const html = fs.readFileSync('dist/index.html','utf8');
let checks=0;
const test=(name,run)=>{run();checks++;console.log(`PASS ${name}`);};
async function boot(saved, demo=false) {
  const dom = new JSDOM(html,{url:`https://portal.example/${demo?'?demo=inflyttning':''}`,runScripts:'outside-only'});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  const w=dom.window,errors=[];
  w.addEventListener('error',ev=>errors.push(ev.error));
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
  for(const name of ['partner-setup','app','partner-crm','commercial'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {dom,w,P:w.Portal,errors,doc:w.document};
}
const ctx=await boot(),{w,P,doc,errors}=ctx;
const plain=x=>JSON.parse(JSON.stringify(x));
const click=selector=>{const n=doc.querySelector(selector);assert.ok(n,selector);n.click();};
const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
let partnerA,partnerB,businessId,consumerId;
let baseline=JSON.stringify({records:P.state.records,offers:P.state.offers,commercial:P.state.commercial,moveins:P.state.moveins});
test('existing partners keep four areas; CRM deep links stay unavailable',()=>{
  for(const id of ['syd','vast']){
    assert.equal(P.getPartner(id).crmMode,'external');P.previewPartner(id);
    assert.equal(doc.querySelectorAll('.partner-start-choice').length,4);
    P.go('crm-customers');assert.equal(P.page,'overview');
    assert.equal(P.crm.save({name:'Rejected'}).ok,false);
  }
});
test('new partner form persists portal CRM and both customer segments',()=>{
  P.returnInternal();P.partnerSetup.open();
  const form=doc.querySelector('#partner-setup-form');
  form.elements.namedItem('name').value='CRM Partner A';
  form.elements.namedItem('salesAudience').value='both';
  form.elements.namedItem('crmMode').value='portal';
  form.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.match(doc.querySelector('#partner-setup-note').textContent,/Gemensam lagring/);
  submit(form);partnerA=P.selectedPartnerId;
  assert.equal(P.getPartner(partnerA).crmMode,'portal');assert.equal(P.page,'partner-detail');
  assert.ok(doc.querySelector('[data-go="crm"]'));
  click('[data-go="crm"]');assert.equal(P.page,'crm');
  assert.equal(new URL(w.location.href).searchParams.get('partner'),partnerA);
  partnerB=P.partnerSetup.saveProfile({name:'CRM Partner B',salesAudiences:['consumer'],crmMode:'portal'}).id;
  P.previewPartner(partnerA);assert.match(doc.querySelector('#view').textContent,/Ditt kundarbete/);
  assert.ok(doc.querySelector('#nav [data-go="crm-customers"]'));
  baseline=JSON.stringify({records:P.state.records,offers:P.state.offers,commercial:P.state.commercial,moveins:P.state.moveins});
});
test('customer form validates next step, saves contact and escapes text',()=>{
  click('[data-crm-new]');const form=doc.querySelector('#crm-customer-form');
  form.elements.name.value='Fiktiv <img src=x onerror=alert(1)> AB';
  assert.equal(form.checkValidity(),false);
  form.elements.segment.value='business';form.elements.contact.value='Kim Exempel';
  form.elements.email.value='kim@kund.example';form.elements.owner.value='Exempelsäljare';
  form.elements.nextAction.value='Ring och boka möte';form.elements.nextDate.value='2026-01-01';
  form.elements.note.value='Första kontakt dokumenterad.';submit(form);
  assert.equal(P.crm.rows().length,1);businessId=P.crm.rows()[0].id;
  assert.equal(P.crm.rows()[0].events.length,1);assert.equal(doc.querySelector('#portal-dialog').open,false);
  assert.equal(doc.querySelector('#view img'),null);
  assert.equal(P.crm.save({name:'Invalid date',segment:'business',stage:'lead',nextAction:'Ring',nextDate:'2026-02-30'}).ok,false);
});
test('consumer and business share CRM without sharing partners or mutating results',()=>{
  const result=P.crm.save({name:'Fiktiv konsument',segment:'consumer',stage:'meeting',nextAction:'Följ upp',nextDate:'2099-01-01'});
  assert.equal(result.ok,true);consumerId=result.id;
  assert.equal(P.crm.rows().length,2);
  assert.equal(P.crm.rows(partnerB).length,0);
  P.previewPartner(partnerB);assert.equal(P.crm.rows().length,0);
  assert.equal(P.crm.save({name:'Wrong segment',segment:'business',stage:'lead',nextAction:'Ring',nextDate:'2099-01-01'}).ok,false);
  assert.equal(P.crm.save({name:'Attempt',stage:'lost',lostReason:'Test'},businessId).ok,false);
  P.previewPartner(partnerA);
  assert.equal(JSON.stringify({records:P.state.records,offers:P.state.offers,commercial:P.state.commercial,moveins:P.state.moveins}),baseline);
});
test('pipeline, lost reason, won and reopen preserve notes and require next action',()=>{
  P.go('crm-pipeline');assert.equal(doc.querySelectorAll('.crm-deal').length,2);
  click(`[data-crm-open="${businessId}"]`);let form=doc.querySelector('#crm-customer-form');
  form.elements.stage.value='lost';form.elements.stage.dispatchEvent(new w.Event('change'));
  assert.equal(form.checkValidity(),false);form.elements.lostReason.value='Kunden valde annan leverantör';submit(form);
  assert.equal(P.crm.rows().find(r=>r.id===businessId).stage,'lost');
  assert.equal(P.crm.rows().find(r=>r.id===businessId).nextDate,'');
  click(`[data-crm-open="${businessId}"]`);form=doc.querySelector('#crm-customer-form');
  form.elements.stage.value='won';form.elements.stage.dispatchEvent(new w.Event('change'));submit(form);
  assert.equal(P.crm.rows().find(r=>r.id===businessId).stage,'won');
  click(`[data-crm-open="${businessId}"]`);form=doc.querySelector('#crm-customer-form');
  form.elements.stage.value='contact';form.elements.stage.dispatchEvent(new w.Event('change'));assert.equal(form.checkValidity(),false);
  form.elements.nextAction.value='Återuppta dialog';form.elements.nextDate.value='2026-01-01';submit(form);
  const record=P.crm.rows().find(r=>r.id===businessId);assert.equal(record.events.length,4);
  assert.equal(record.closedAt,'');assert.equal(record.lostReason,'');
  assert.match(record.events.map(e=>e.text).join(' '),/Förlustorsak/);
  assert.equal(JSON.stringify(P.state.commercial),JSON.parse(baseline).commercial?JSON.stringify(JSON.parse(baseline).commercial):'{}');
});
test('visible filters search and separate stage selection from activities',()=>{
  P.go('crm-customers');let form=doc.querySelector('#crm-filter-form');form.elements.stage.value='won';submit(form);
  assert.equal(doc.querySelectorAll('.crm-customer-name').length,0);
  P.go('crm-activities');assert.equal(doc.querySelectorAll('.crm-activity').length,2);
  form=doc.querySelector('#crm-filter-form');form.elements.due.value='overdue';submit(form);
  assert.equal(doc.querySelectorAll('.crm-activity').length,1);
  P.go('crm-customers');assert.equal(doc.querySelectorAll('.crm-customer-name').length,0);
  click('[data-crm-clear]');form=doc.querySelector('#crm-filter-form');form.elements.query.value='Kim Exempel';submit(form);
  assert.equal(doc.querySelectorAll('.crm-customer-name').length,1);
  click('[data-crm-clear]');
});
test('save failures roll back state and keep edited form open; stale cards fail',()=>{
  P.go('crm-customers');click(`[data-crm-open="${businessId}"]`);
  const form=doc.querySelector('#crm-customer-form'),before=JSON.stringify(P.state),originalSave=P.save;
  form.elements.note.value='Får inte sparas';P.save=()=>false;submit(form);
  assert.equal(JSON.stringify(P.state),before);assert.equal(doc.querySelector('#portal-dialog').open,true);
  assert.match(doc.querySelector('#crm-form-error').textContent,/Kunde inte spara/);assert.equal(form.elements.note.value,'Får inte sparas');
  P.save=originalSave;P.closeDialog();
  const record=plain(P.crm.rows().find(r=>r.id===businessId));
  assert.equal(P.crm.save({...record,note:'New version'},record.id,record.revision).ok,true);
  assert.equal(P.crm.save({...record,note:'Stale version'},record.id,record.revision).ok,false);
});
test('mode and segment changes preserve CRM history; unavailable mode prevents edits',()=>{
  const before=JSON.stringify(P.state.crmRecords);P.role='internal';
  assert.equal(P.partnerSetup.saveProfile({name:'CRM Partner A',salesAudiences:['business'],crmMode:'external'},partnerA).ok,true);
  assert.equal(JSON.stringify(P.state.crmRecords),before);
  P.previewPartner(partnerA);assert.equal(doc.querySelectorAll('.partner-start-choice').length,4);
  assert.equal(P.crm.rows().length,0);P.go('crm');assert.equal(P.page,'overview');
  P.role='internal';P.partnerSetup.saveProfile({name:'CRM Partner A',salesAudiences:['business'],crmMode:'portal'},partnerA);
  P.previewPartner(partnerA);assert.equal(P.crm.rows().length,2);
  const old=plain(P.crm.rows().find(r=>r.id===consumerId));assert.equal(P.crm.save({...old,note:'Bevarad konsumenthistorik'},old.id).ok,true);
  assert.equal(P.crm.rows().find(r=>r.id===consumerId).segment,'consumer');
  assert.equal(P.crm.save({name:'Ny konsument',segment:'consumer',stage:'won'}).ok,false);
});
test('corrupt CRM container is preserved, malformed row ignored, invalid mode rejected',()=>{
  const before=P.state.crmRecords;P.state.crmRecords={legacy:'preserve'};
  assert.equal(P.crm.save({name:'No overwrite',segment:'business',stage:'won'}).ok,false);
  assert.equal(P.state.crmRecords.legacy,'preserve');P.state.crmRecords=before;
  P.state.crmRecords.push({id:'broken',partner:partnerA,name:'Broken',segment:'business',stage:'lead'});
  P.go('crm-activities');assert.equal(P.crm.rows().length,2);P.state.crmRecords.pop();
  P.role='internal';assert.equal(P.partnerSetup.saveProfile({name:'CRM Partner A',salesAudiences:['business'],crmMode:'invalid'},partnerA).ok,false);
});
test('exports scope CRM rows and cross-tab changes block overwrites',()=>{
  P.previewPartner(partnerA);let downloaded;
  P.download=(name,content)=>{downloaded=JSON.parse(content);};
  P.go('settings');click('#export-settings');
  assert.equal(downloaded.crmRecords.length,2);
  assert.ok(downloaded.crmRecords.every(row=>row.partner===partnerA));
  P.previewPartner(partnerB);P.go('settings');click('#export-settings');assert.equal(downloaded.crmRecords.length,0);
  P.previewPartner(partnerA);
  const current=w.localStorage.getItem('partnerlabb.portal.v2'),before=JSON.stringify(P.state.crmRecords);
  w.localStorage.setItem('partnerlabb.portal.v2',current+' ');
  assert.equal(P.crm.save({name:'Conflicting write',segment:'business',stage:'won'}).ok,false);
  assert.equal(JSON.stringify(P.state.crmRecords),before);
  assert.equal(w.localStorage.getItem('partnerlabb.portal.v2'),current+' ');
  w.localStorage.setItem('partnerlabb.portal.v2',current);
});
const saved=w.localStorage.getItem('partnerlabb.portal.v2');
const reload=await boot(saved),demo=await boot(saved,true);
test('reload keeps CRM profiles and records while demo data is isolated',()=>{
  reload.P.previewPartner(partnerA);assert.equal(reload.P.getPartner(partnerA).crmMode,'portal');assert.equal(reload.P.crm.rows().length,2);
  assert.equal(demo.P.getPartner(partnerA),undefined);assert.equal(demo.P.state.crmRecords,undefined);
  assert.equal(demo.w.localStorage.getItem('partnerlabb.portal.v2'),saved);
});
test('property and employee setup hide CRM choices and remain separate',()=>{
  P.role='internal';P.partnerSetup.open();const form=doc.querySelector('#partner-setup-form');
  for(const type of ['property','employee']) {form.elements.partnerType.value=type;form.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(doc.querySelector('#partner-setup-crm').disabled,true);assert.equal(doc.querySelector('#partner-setup-crm').hidden,true);}
  P.closeDialog();
});
test('all DOM events completed without script exceptions',()=>assert.deepEqual([...errors,...reload.errors,...demo.errors],[]));
ctx.dom.window.close();reload.dom.window.close();demo.dom.window.close();
console.log(`${checks} CRM DOM and data scenarios passed`);
