import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
async function boot(saved,demo=false) {
  const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:`https://portal.example/${demo?'?demo=inflyttning':''}`,runScripts:'outside-only'});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  const w=dom.window,errors=[],NativeDate=w.Date;
  w.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00Z']));}static now(){return NativeDate.parse('2026-10-15T12:00:00Z');}};
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.addEventListener('error',event=>errors.push(String(event.error)));
  if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
  for(const name of ['partner-setup','app','partner-crm','commercial','partner-results-data'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));return {dom,w,P:w.Portal,doc:w.document,errors};
}
const ctx=await boot(),{w,P,doc}=ctx;
let checks=0;
const test=(name,fn)=>{fn();console.log(`PASS ${name}`);checks++;};
const form=()=>doc.querySelector('#crm-customer-form');
const submit=f=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const get=id=>P.crm.rows().find(row=>row.id===id);
const partner=P.partnerSetup.saveProfile({name:'Fiktiv finputspartner',salesAudiences:['business','consumer'],crmMode:'portal'}).id;
P.previewPartner(partner);
const base={name:'Fiktiv förbrukningskund',segment:'business',stage:'lead',nextAction:'Ring kunden',nextDate:'2026-10-22'};
let id;
test('Swedish grouped whole kWh normalize, format on blur and round-trip without spurious history',()=>{
  for(const value of ['250000','250 000','250\u00a0000','250\u202f000']){
    const result=P.crm.save({...base,annualConsumptionKwh:value});assert.equal(result.ok,true);id=result.id;
    assert.equal(get(id).annualConsumptionKwh,'250000');
    P.crm.open(id);assert.equal(form().elements.annualConsumptionKwh.value,'250\u00a0000');
    const before=JSON.stringify(get(id));submit(form());assert.equal(JSON.stringify(get(id)),before);
  }
  P.crm.open(id);form().elements.annualConsumptionKwh.value='1 234 567';form().elements.annualConsumptionKwh.dispatchEvent(new w.Event('blur'));
  assert.equal(form().elements.annualConsumptionKwh.value,'1\u00a0234\u00a0567');submit(form());assert.equal(get(id).annualConsumptionKwh,'1234567');
});
test('new decimals, malformed grouping and overflow fail with requested message and no mutation',()=>{
  const before=JSON.stringify(P.state);
  for(const value of ['25000,5','25000.5','25 00','1 23 456','1\t000','-2','1e6','9007199254740992']){
    const result=P.crm.save({...get(id),annualConsumptionKwh:value},id);assert.equal(result.ok,false,value);
    assert.equal(result.error,'Ange årsförbrukningen i hela kWh, till exempel 250 000.');assert.equal(JSON.stringify(P.state),before);
  }
});
test('v38 decimals remain exact on ordinary edits and omissions; explicit clear or whole replacement works',()=>{
  const legacy={...get(id),id:'legacy-decimal',name:'Fiktiv äldre decimal',annualConsumptionKwh:'25000.500',events:[{at:'2026-10-01T12:00:00Z',text:'Bevarad tidigare historik'}]};
  P.state.crmRecords.push(legacy);P.crm.open(legacy.id);
  assert.equal(form().elements.annualConsumptionKwh.value,'25\u00a0000,5');form().elements.note.value='Ny anteckning';submit(form());
  assert.equal(get(legacy.id).annualConsumptionKwh,'25000.500');assert.equal(get(legacy.id).events[1].text,'Bevarad tidigare historik');
  const omitted={...get(legacy.id),note:'Äldre anrop'};delete omitted.annualConsumptionKwh;assert.equal(P.crm.save(omitted,legacy.id).ok,true);assert.equal(get(legacy.id).annualConsumptionKwh,'25000.500');
  assert.equal(P.crm.save({...get(legacy.id),annualConsumptionKwh:'25000,6'},legacy.id).ok,false);
  assert.equal(P.crm.save({...get(legacy.id),annualConsumptionKwh:''},legacy.id).ok,true);assert.equal(get(legacy.id).annualConsumptionKwh,'');
  assert.equal(P.crm.save({...get(legacy.id),annualConsumptionKwh:'0'},legacy.id).ok,true);P.crm.open(legacy.id);assert.equal(form().elements.annualConsumptionKwh.value,'0');P.closeDialog();
});
test('customer summary precedes fields, follows draft values and cancels without changing saved data',()=>{
  P.crm.save({...get(id),contractEndDate:'2027-01-31',email:'kim@kund.example',phone:'+46 700 000 000'},id);
  const before=JSON.stringify(P.state);P.crm.open(id);const f=form(),summary=doc.querySelector('#crm-card-summary');
  assert.equal(f.firstElementChild,summary);assert.equal(doc.activeElement,summary);
  assert.match(summary.textContent,/Ny kontakt/);assert.match(summary.textContent,/Ring kunden · 22 okt\./);assert.match(summary.textContent,/31 jan\. 2027/);assert.match(summary.textContent,/1\u00a0234\u00a0567 kWh/);
  assert.ok(summary.querySelector('a[href="tel:+46700000000"]'));assert.ok(summary.querySelector('a[href="mailto:kim%40kund.example"]'));
  f.elements.stage.value='meeting';f.elements.stage.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(summary.textContent,/Möte bokat/);
  f.elements.nextDate.value='2027-02-03';f.elements.nextDate.dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(summary.textContent,/3 feb\. 2027/);
  doc.querySelector('#crm-cancel').click();assert.equal(JSON.stringify(P.state),before);
});
test('CRM dates consistently include year only when outside Stockholm current year',()=>{
  P.state.crmRecords=[{...get(id),id:'dates',stage:'won',closedAt:'2026-10-15T23:30:00Z',events:[{at:'2025-12-31T12:00:00Z',text:'Nästa aktivitet: Ring (2027-01-31).'}]}];
  P.go('crm-customers');assert.equal(doc.querySelector('tbody td:last-child').textContent,'16 okt.');
  P.go('crm-pipeline');assert.match(doc.querySelector('.crm-deal').textContent,/16 okt\./);
  P.go('crm');assert.match(doc.querySelector('#crm-expiring').textContent,/till 15 apr\. 2027/);assert.equal(doc.querySelector('#crm-expiring .crm-due').textContent,'31 jan. 2027');
  P.crm.open('dates');assert.equal(form().elements.contractEndDate.value,'2027-01-31');assert.match(form().querySelector('.crm-history').textContent,/31 dec\. 2025/);assert.match(form().querySelector('.crm-history').textContent,/Ring \(31 jan\. 2027\)/);assert.equal(get('dates').events[0].text,'Nästa aktivitet: Ring (2027-01-31).');P.closeDialog();
});
test('pipeline summary excludes closed deals, respects search and omits volume text in empty steps',()=>{
  for(const row of [{...base,name:'Öppen A',annualConsumptionKwh:'250 000'},{...base,name:'Öppen B'},{...base,name:'Förlorad',stage:'lost',lostReason:'Fiktivt',annualConsumptionKwh:'999000'}])assert.equal(P.crm.save(row).ok,true);
  P.go('crm-pipeline');let summary=doc.querySelector('.crm-pipeline-summary');assert.equal(summary.querySelector('div>strong').textContent,'2');assert.match(summary.textContent,/250 MWh\/år/);assert.match(summary.textContent,/1 av 2/);
  assert.equal(doc.querySelector('[data-crm-stage=meeting] .crm-volume'),null);
  const input=doc.querySelector('[name=query]');input.value='Öppen B';input.dispatchEvent(new w.Event('input',{bubbles:true}));summary=doc.querySelector('.crm-pipeline-summary');assert.equal(summary.querySelector('div>strong').textContent,'1');assert.match(summary.textContent,/Årsförbrukning saknas/);
  doc.querySelector('[data-crm-clear]').click();
});
test('partner setup lists confirmed B2B products and required marker shares the label text wrapper',()=>{
  P.role='internal';P.partnerSetup.open();const label=doc.querySelector('[for=partner-setup-name]');assert.equal(label.firstElementChild.textContent,'Partnernamn *');assert.equal(label.querySelector('input').required,true);
  const business=doc.querySelector('[name=salesAudience][value=business]').closest('label');for(const product of P.partnerResultsData.segmentCatalog.business)assert.ok(business.textContent.includes(product));P.closeDialog();P.previewPartner(partner);
});
P.save();const saved=w.localStorage.getItem('partnerlabb.portal.v2'),reload=await boot(saved),demo=await boot(saved,true);
test('reload, legacy data and separate demo survive formatting changes without script errors',()=>{
  reload.P.previewPartner(partner);assert.equal(JSON.stringify(reload.P.crm.rows()),JSON.stringify(P.crm.rows()));assert.equal(demo.P.state.crmRecords,undefined);assert.equal(demo.w.localStorage.getItem('partnerlabb.portal.v2'),saved);assert.deepEqual([...ctx.errors,...reload.errors,...demo.errors],[]);
});
for(const c of [ctx,reload,demo])c.dom.window.close();console.log(`${checks} CRM polish scenarios passed`);
