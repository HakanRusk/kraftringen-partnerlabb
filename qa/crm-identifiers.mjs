// Synthetic strings only. These checks validate format/storage, not identities or supply points.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const html=fs.readFileSync('dist/index.html','utf8');
async function boot(saved, demo=false) {
  const dom=new JSDOM(html,{url:`https://portal.example/${demo?'?demo=inflyttning':''}`,runScripts:'outside-only'});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  const w=dom.window,errors=[];
  w.addEventListener('error',event=>errors.push(event.error));
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
  for(const name of ['partner-setup','app','partner-crm','commercial'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {dom,w,P:w.Portal,doc:w.document,errors};
}
const ctx=await boot(),{P,w,doc}=ctx;
const partner=P.partnerSetup.saveProfile({name:'Fiktiv identifierartest',salesAudiences:['business','consumer'],crmMode:'portal'}).id;
const other=P.partnerSetup.saveProfile({name:'Fiktiv annan partner',salesAudiences:['consumer'],crmMode:'portal'}).id;
P.previewPartner(partner);
const unchanged=()=>JSON.stringify({records:P.state.records,offers:P.state.offers,commercial:P.state.commercial,moveins:P.state.moveins});
const baseline=unchanged();
const plain=value=>JSON.parse(JSON.stringify(value));
const payload={name:'Fiktiv kund',segment:'business',stage:'contact',nextAction:'Ring',nextDate:'2099-01-01'};
let checks=0;
const test=(label,run)=>{run();checks++;console.log(`PASS ${label}`);};
const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
let businessId,consumerId;
test('new form switches identity fields and excludes the inactive value from save',()=>{
  P.crm.open();const f=doc.querySelector('#crm-customer-form');
  assert.equal(f.elements.organizationNumber.disabled,false);assert.equal(f.elements.personalNumber.disabled,true);
  f.elements.organizationNumber.value='000000-0000';
  f.elements.segment.value='consumer';f.elements.segment.dispatchEvent(new w.Event('change'));
  assert.equal(f.elements.organizationNumber.disabled,true);assert.equal(f.elements.organizationNumber.closest('label').hidden,true);
  assert.equal(f.elements.personalNumber.disabled,false);
  assert.equal(new w.FormData(f).has('organizationNumber'),false);
  Object.entries({...payload,segment:'consumer',personalNumber:'00000000-0000',facilityId:'735999 000000000000',gridAreaCode:'xyz'}).forEach(([key,value])=>f.elements[key].value=value);
  submit(f);assert.equal(doc.querySelector('#portal-dialog').open,false);
  const row=P.crm.rows()[0];consumerId=row.id;
  assert.equal(row.personalNumber,'00000000-0000');assert.equal(row.organizationNumber,undefined);
  assert.equal(row.facilityId,'735999000000000000');assert.equal(row.gridAreaCode,'XYZ');
});
test('business identifier and 18-digit string survive reopening and identifier-only edits',()=>{
  const result=P.crm.save({...payload,organizationNumber:'000000-0000',facilityId:'735999000000000001',gridAreaCode:' abc '});
  assert.equal(result.ok,true);businessId=result.id;P.crm.open(businessId);
  let f=doc.querySelector('#crm-customer-form');assert.equal(f.elements.personalNumber,undefined);
  assert.equal(f.elements.organizationNumber.value,'000000-0000');assert.equal(f.elements.facilityId.value,'735999000000000001');
  const previous=P.crm.rows().find(r=>r.id===businessId).revision;
  f.elements.organizationNumber.value='000000-0001';f.elements.facilityId.value='735999000000000002';f.elements.gridAreaCode.value='def';submit(f);
  const row=P.crm.rows().find(r=>r.id===businessId);
  assert.equal(row.revision,previous+1);assert.equal(row.facilityId,'735999000000000002');assert.equal(row.gridAreaCode,'DEF');
  assert.match(row.events[0].text,/Kunduppgifter uppdaterade/);assert.match(row.events[0].text,/Anläggningsuppgifter uppdaterade/);
  assert.ok(!row.events.some(event=>/000000-0001|735999/.test(event.text)));
});
test('invalid populated identifiers are rejected atomically with field focus',()=>{
  const row=plain(P.crm.rows().find(r=>r.id===businessId)),before=JSON.stringify(P.state);
  for(const [key,value] of [['organizationNumber','abc'],['facilityId','73599900000000000'],['facilityId',735999000000000000],['gridAreaCode','SE4'],['gridAreaCode','ABCD']]) {
    const result=P.crm.save({...row,[key]:value},row.id,row.revision);
    assert.equal(result.ok,false);assert.equal(result.field,key);assert.equal(JSON.stringify(P.state),before);
  }
  const person=plain(P.crm.rows().find(r=>r.id===consumerId));
  assert.equal(P.crm.save({...person,personalNumber:'123'},person.id).ok,false);
  P.crm.open(businessId);const f=doc.querySelector('#crm-customer-form');f.elements.gridAreaCode.value='12';submit(f);
  assert.equal(doc.activeElement,f.elements.gridAreaCode);assert.equal(f.elements.gridAreaCode.getAttribute('aria-invalid'),'true');
  assert.match(doc.querySelector('#crm-form-error').textContent,/Nätområdeskod/);assert.equal(doc.querySelector('#portal-dialog').open,true);P.closeDialog();
});
test('old rows and omitted fields remain editable; intentional clearing is saved',()=>{
  const row=plain(P.crm.rows().find(r=>r.id===businessId));
  const legacyPayload={...row,note:'Äldre formulär'};
  delete legacyPayload.facilityId;delete legacyPayload.gridAreaCode;delete legacyPayload.organizationNumber;
  assert.equal(P.crm.save(legacyPayload,row.id).ok,true);
  assert.equal(P.crm.rows().find(r=>r.id===businessId).organizationNumber,row.organizationNumber);
  assert.equal(P.crm.rows().find(r=>r.id===businessId).facilityId,row.facilityId);
  const id=P.crm.save({...payload,name:'Fiktiv äldre kund'}).id;
  const old=P.state.crmRecords.find(r=>r.id===id);for(const key of ['facilityId','gridAreaCode','organizationNumber'])delete old[key];
  P.crm.open(id);const f=doc.querySelector('#crm-customer-form');assert.equal(f.elements.facilityId.value,'');assert.equal(f.checkValidity(),true);
  f.elements.organizationNumber.value='0000000000';submit(f);
  assert.equal(P.crm.rows().find(r=>r.id===id).organizationNumber,'0000000000');
  P.crm.open(id);const clear=doc.querySelector('#crm-customer-form');clear.elements.organizationNumber.value='';submit(clear);
  assert.equal(P.crm.rows().find(r=>r.id===id).organizationNumber,'');
});
test('person number formatting keeps plus and century; segment stays locked',()=>{
  for(const value of ['000000+0000','0000000000','000000000000']) {
    const row=plain(P.crm.rows().find(r=>r.id===consumerId));
    assert.equal(P.crm.save({...row,personalNumber:value,segment:'business'},row.id).ok,true);
    assert.equal(P.crm.rows().find(r=>r.id===consumerId).personalNumber,value);
    assert.equal(P.crm.rows().find(r=>r.id===consumerId).segment,'consumer');
  }
  P.crm.open(consumerId);assert.equal(doc.querySelector('#crm-customer-form').elements.organizationNumber,undefined);P.closeDialog();
});
test('save failure retains values in the form and preserves all stored data',()=>{
  P.crm.open(businessId);const f=doc.querySelector('#crm-customer-form'),before=JSON.stringify(P.state),save=P.save;
  f.elements.facilityId.value='735999000000000003';P.save=()=>false;submit(f);
  assert.equal(JSON.stringify(P.state),before);assert.equal(f.elements.facilityId.value,'735999000000000003');
  assert.equal(doc.querySelector('#portal-dialog').open,true);P.save=save;P.closeDialog();
});
test('identifiers stay inside own partner export and never change results',()=>{
  let exported;P.download=(name,content)=>exported=JSON.parse(content);
  P.go('settings');doc.querySelector('#export-settings').click();
  assert.equal(exported.crmRecords.find(r=>r.id===businessId).facilityId,'735999000000000002');
  assert.equal(exported.crmRecords.find(r=>r.id===consumerId).personalNumber,'000000000000');
  P.previewPartner(other);P.go('settings');doc.querySelector('#export-settings').click();assert.equal(exported.crmRecords.length,0);
  assert.equal(P.crm.save({...payload,segment:'consumer'},consumerId).ok,false);P.previewPartner(partner);
  assert.equal(unchanged(),baseline);
});
const saved=w.localStorage.getItem('partnerlabb.portal.v2'),reload=await boot(saved),demo=await boot(saved,true);
test('reload preserves exact strings and separate demo contains no copied identities',()=>{
  reload.P.previewPartner(partner);
  assert.equal(reload.P.crm.rows().find(r=>r.id===businessId).facilityId,'735999000000000002');
  assert.equal(reload.P.crm.rows().find(r=>r.id===consumerId).personalNumber,'000000000000');
  assert.equal(demo.P.state.crmRecords,undefined);assert.equal(demo.w.localStorage.getItem('partnerlabb.portal.v2'),saved);
  assert.deepEqual([...ctx.errors,...reload.errors,...demo.errors],[]);
});
for(const c of [ctx,reload,demo])c.dom.window.close();
console.log(`${checks} CRM identifier scenarios passed`);
