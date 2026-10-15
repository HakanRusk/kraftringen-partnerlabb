// Operational CRM regressions with synthetic customers. DOM tests are not layout tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('dist/index.html','utf8');
async function boot(saved, demo=false) {
  const dom=new JSDOM(html,{url:`https://portal.example/${demo?'?demo=inflyttning':''}`,runScripts:'outside-only'});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  const w=dom.window,errors=[];
  let clock='2026-10-15T12:00:00Z';
  const NativeDate=w.Date;
  w.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[clock]));} static now(){return NativeDate.parse(clock);}};
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.addEventListener('error',event=>errors.push(String(event.error)));
  if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
  for(const name of ['partner-setup','app','partner-crm','commercial','partner-results-data'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {dom,w,P:w.Portal,doc:w.document,errors,time:value=>{clock=value;}};
}
const ctx=await boot(),{w,P,doc}=ctx;
let checks=0;
const test=(name,fn)=>{fn();console.log(`PASS ${name}`);checks++;};
const plain=value=>JSON.parse(JSON.stringify(value));
const change=field=>field.dispatchEvent(new w.Event('change',{bubbles:true}));
const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const form=()=>doc.querySelector('#crm-customer-form');
const current=id=>P.crm.rows().find(row=>row.id===id);
const partner=P.partnerSetup.saveProfile({name:'Fiktiv arbetsflödespartner',salesAudiences:['business','consumer'],crmMode:'portal'}).id;
P.previewPartner(partner);
const base={name:'Fiktiva Bageriet',segment:'business',stage:'lead',nextAction:'Ring',nextDate:'2026-10-16'};
const unaffected=()=>JSON.stringify({records:P.state.records,offers:P.state.offers,commercial:P.state.commercial,moveins:P.state.moveins});
const baseline=unaffected();
let id;
test('optional electricity fields use segment catalog and save without prices or new commercial records',()=>{
  P.crm.open();let f=form();
  assert.equal(f.elements.currentSupplier.required,false);
  assert.deepEqual(Array.from(f.elements.productInterest.options).slice(1).map(o=>o.value),Array.from(P.partnerResultsData.segmentCatalog.business));
  f.elements.productInterest.value='Poolportfölj Trygg';f.elements.segment.value='consumer';change(f.elements.segment);
  assert.equal(f.elements.productInterest.value,'');
  assert.deepEqual(Array.from(f.elements.productInterest.options).slice(1).map(o=>o.value),Array.from(P.partnerResultsData.segmentCatalog.consumer));
  f.elements.segment.value='business';change(f.elements.segment);
  const fields={...base,currentSupplier:'Fiktiv leverantör',contractEndDate:'2027-01-31',electricityArea:'SE4',annualConsumptionKwh:'25000,5',productInterest:'Poolportfölj Trygg',phone:'+46 (0) 700-000 000',email:'kontakt@bageriet.example'};
  for(const [key,value] of Object.entries(fields))f.elements[key].value=value;
  submit(f);id=P.crm.rows()[0].id;
  assert.equal(current(id).annualConsumptionKwh,'25000.5');assert.equal(current(id).contractEndDate,'2027-01-31');
  assert.equal(unaffected(),baseline);
});
test('invalid electricity input is atomic; omitted values survive and explicit clears save history',()=>{
  const before=JSON.stringify(P.state);
  for(const patch of [{contractEndDate:'2026-02-30'},{electricityArea:'SE5'},{annualConsumptionKwh:'-1'},{annualConsumptionKwh:'Infinity'},{annualConsumptionKwh:'1e6'},{productInterest:'Opti'}]){
    assert.equal(P.crm.save({...current(id),...patch},id).ok,false);assert.equal(JSON.stringify(P.state),before);
  }
  const old=plain(current(id));const partial={...old,note:'Kontakt utan nya fält'};
  for(const key of ['currentSupplier','contractEndDate','electricityArea','annualConsumptionKwh','productInterest'])delete partial[key];
  assert.equal(P.crm.save(partial,id).ok,true);assert.equal(current(id).productInterest,old.productInterest);
  P.crm.open(id);const f=form();f.elements.annualConsumptionKwh.value='-20';submit(f);
  assert.equal(doc.querySelector('#portal-dialog').open,true);assert.equal(doc.activeElement,f.elements.annualConsumptionKwh);
  f.elements.annualConsumptionKwh.value='';submit(f);
  assert.equal(current(id).annualConsumptionKwh,'');assert.match(current(id).events[0].text,/Elavtal i dag/);
  assert.equal(P.crm.save({...current(id),annualConsumptionKwh:'25000.5'},id).ok,true);
});
test('won save has specific feedback; close dates use Stockholm and persist across edits/reopen',()=>{
  ctx.time('2026-10-15T23:30:00Z');let toast='';const original=P.toast;P.toast=message=>{toast=message;};
  P.crm.open(id);form().elements.stage.value='won';change(form().elements.stage);
  assert.equal(doc.querySelector('#crm-won-guidance').hidden,false);assert.equal(current(id).stage,'lead');
  submit(form());P.toast=original;
  assert.match(toast,/Markerad som vunnen i CRM/);assert.match(toast,/Inget har skickats/);
  const won=current(id).closedAt;assert.equal(won,'2026-10-15T23:30:00.000Z');assert.equal(current(id).wonAt,won);
  P.go('crm-customers');assert.equal(doc.querySelector('tbody tr td:last-child').textContent,'2026-10-16');
  ctx.time('2026-10-20T12:00:00Z');P.crm.save({...current(id),note:'Ny anteckning'},id);assert.equal(current(id).closedAt,won);
  P.crm.save({...current(id),stage:'lost',lostReason:'Fiktiv orsak'},id);const lost=current(id).lostAt;
  assert.equal(current(id).wonAt,won);P.go('crm-customers');assert.equal(doc.querySelector('tbody tr td:last-child').textContent,'2026-10-20');
  P.crm.save({...current(id),stage:'contact',nextAction:'Återuppta kontakt',nextDate:'2026-10-22'},id);
  assert.equal(current(id).closedAt,'');assert.equal(current(id).wonAt,won);assert.equal(current(id).lostAt,lost);
  assert.match(current(id).events.map(ev=>ev.text).join(' '),/Förlustorsak/);assert.equal(unaffected(),baseline);
  ctx.time('2026-10-15T12:00:00Z');
});
test('legacy closed dates are displayed when known and never fabricated by edits',()=>{
  const old={...base,name:'Äldre känd kund',id:'legacy-won',partner,stage:'won',nextAction:'',nextDate:'',closedAt:'2026-09-01T12:00:00Z',events:[{at:'2026-09-01T12:00:00Z',text:'Bevarad historik'}]};
  P.state.crmRecords.push(old,{...old,id:'legacy-unknown',name:'Äldre kund utan datum',closedAt:''});
  P.go('crm-customers');assert.match(doc.querySelector('#view').textContent,/2026-09-01/);assert.match(doc.querySelector('#view').textContent,/Datum saknas/);
  P.crm.save({...current('legacy-unknown'),note:'Komplettering'},'legacy-unknown');assert.equal(current('legacy-unknown').closedAt,'');
  assert.equal(current('legacy-unknown').events[1].text,'Bevarad historik');
  P.crm.save({...current('legacy-won'),stage:'contact',nextAction:'Återkom',nextDate:'2026-11-01'},'legacy-won');
  assert.equal(current('legacy-won').wonAt,'2026-09-01T12:00:00Z');
  assert.equal(current('legacy-won').closedAt,'');
});
test('home queues include inclusive boundaries, exclude past expiry and remain partner-scoped',()=>{
  for(const [name,nextDate,end] of [['Idag','2026-10-15','2026-10-15'],['Imorgon','2026-10-16','2026-11-01'],['Dag sju','2026-10-22','2027-04-15'],['Dag åtta','2026-10-23','2027-04-16'],['Försenad','2026-10-14','2026-10-14']])P.crm.save({...base,name,nextDate,contractEndDate:end});
  const other=P.partnerSetup.saveProfile({name:'Annan partner',salesAudiences:['business'],crmMode:'portal'}).id;
  P.state.crmRecords.push({...base,id:'other',partner:other,name:'Får inte visas',contractEndDate:'2026-10-20'});
  P.go('crm');const upcoming=doc.querySelector('#crm-upcoming').textContent,expiry=doc.querySelector('#crm-expiring');
  assert.match(upcoming,/Imorgon/);assert.match(upcoming,/Dag sju/);assert.doesNotMatch(upcoming,/Dag åtta|Försenad|Får inte visas/);
  const dates=Array.from(expiry.querySelectorAll('.crm-due')).map(n=>n.textContent);
  assert.deepEqual(dates,['2026-10-15','2026-11-01','2027-01-31','2027-04-15']);assert.doesNotMatch(expiry.textContent,/Dag åtta|Försenad|Får inte visas/);
});
test('quick dates are unsaved drafts with month-end, leap-year and DST-safe boundaries',()=>{
  const before=JSON.stringify(P.state);P.crm.open(id);
  for(const [key,expected] of [['today','2026-10-15'],['tomorrow','2026-10-16'],['week','2026-10-22'],['month','2026-11-15']]){doc.querySelector(`[data-crm-date="${key}"]`).click();assert.equal(form().elements.nextDate.value,expected);}
  ctx.time('2027-01-31T12:00:00Z');doc.querySelector('[data-crm-date=month]').click();assert.equal(form().elements.nextDate.value,'2027-02-28');
  ctx.time('2028-01-31T12:00:00Z');doc.querySelector('[data-crm-date=month]').click();assert.equal(form().elements.nextDate.value,'2028-02-29');
  ctx.time('2026-10-24T23:30:00Z');doc.querySelector('[data-crm-date=tomorrow]').click();assert.equal(form().elements.nextDate.value,'2026-10-26');
  assert.equal(JSON.stringify(P.state),before);P.closeDialog();ctx.time('2026-10-15T12:00:00Z');
});
test('list and card offer safe call/email links including draft edits',()=>{
  P.go('crm-customers');assert.ok(doc.querySelector('a[href="tel:+460700000000"]'));
  assert.ok(doc.querySelector('a[href="mailto:kontakt%40bageriet.example"]'));
  P.crm.open(id);assert.ok(form().querySelector('a[href^="tel:"]'));
  form().elements.phone.value='+46 700 000 001';form().elements.phone.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.ok(form().querySelector('a[href="tel:+46700000001"]'));P.closeDialog();
});
test('live search keeps focus and caret while filtering all three views without submit',()=>{
  for(const page of ['crm-customers','crm-pipeline','crm-activities']){
    P.go(page);doc.querySelector('[data-crm-clear]').click();
    for(const query of ['F','Fi','Fiktiva Bageriet']){
      const input=doc.querySelector('[name=query]');input.focus();input.value=query;input.setSelectionRange(query.length,query.length);input.dispatchEvent(new w.Event('input',{bubbles:true}));
      const fresh=doc.querySelector('[name=query]');assert.equal(doc.activeElement,fresh);assert.equal(fresh.selectionStart,query.length);
    }
    const selector=page==='crm-customers'?'.crm-customer-name':page==='crm-pipeline'?'.crm-deal':'.crm-activity';
    assert.equal(doc.querySelectorAll(selector).length,1);doc.querySelector('[data-crm-clear]').click();
  }
});
test('pipeline sums only supplied consumption and next-stage action is a cancellable draft',()=>{
  P.go('crm-pipeline');const column=doc.querySelector('[data-crm-stage=contact]');assert.match(column.querySelector('.crm-volume').textContent,/25,0005 MWh\/år/);
  assert.match(doc.querySelector('[data-crm-stage=lead] .crm-volume').textContent,/saknas/);
  assert.equal(doc.querySelector('[data-crm-stage=won] [data-crm-advance]'),null);
  const before=JSON.stringify(P.state);doc.querySelector(`[data-crm-advance="${id}"]`).click();
  assert.equal(form().elements.stage.value,'meeting');assert.equal(doc.activeElement,form().elements.nextAction);
  assert.equal(JSON.stringify(P.state),before);doc.querySelector('#crm-cancel').click();assert.equal(JSON.stringify(P.state),before);
  doc.querySelector(`[data-crm-advance="${id}"]`).click();form().elements.nextAction.value='Boka behovsmöte';submit(form());assert.equal(current(id).stage,'meeting');
  P.crm.save({...current(id),stage:'offer'},id);P.go('crm-pipeline');doc.querySelector(`[data-crm-advance="${id}"]`).click();assert.equal(form().elements.stage.value,'won');assert.equal(doc.querySelector('#crm-won-guidance').hidden,false);P.closeDialog();
});
test('failed saves and stale revisions preserve electricity data, stage timestamps and history',()=>{
  const before=JSON.stringify(P.state),original=P.save;P.save=()=>false;
  assert.equal(P.crm.save({...current(id),stage:'won',currentSupplier:'Ej sparat'},id).ok,false);P.save=original;assert.equal(JSON.stringify(P.state),before);
  const old=plain(current(id));P.crm.save({...old,currentSupplier:'Ny fiktiv leverantör'},id,old.revision);
  assert.equal(P.crm.save({...old,currentSupplier:'Föråldrat'},id,old.revision).ok,false);assert.equal(current(id).currentSupplier,'Ny fiktiv leverantör');
});
test('partner uses side navigation; internal view retains CRM tabs',()=>{
  for(const page of ['overview','crm-customers','crm-pipeline','crm-activities']){P.go(page);assert.equal(doc.querySelector('.crm-tabs'),null);assert.ok(doc.querySelector('#nav [data-go=crm-customers]'));}
  P.role='internal';P.selectedPartnerId=partner;P.go('crm');assert.equal(doc.querySelectorAll('.crm-tabs [data-go]').length,4);P.previewPartner(partner);
});
P.save();const saved=w.localStorage.getItem('partnerlabb.portal.v2'),reload=await boot(saved),demo=await boot(saved,true);
test('reload and demo isolation preserve new fields, old records and all prior history',()=>{
  reload.P.previewPartner(partner);const row=reload.P.crm.rows().find(r=>r.id===id);
  assert.deepEqual(plain(row),plain(current(id)));assert.equal(reload.P.crm.rows().find(r=>r.id==='legacy-unknown').events[1].text,'Bevarad historik');
  assert.equal(demo.P.state.crmRecords,undefined);assert.equal(demo.w.localStorage.getItem('partnerlabb.portal.v2'),saved);
  assert.deepEqual([...ctx.errors,...reload.errors,...demo.errors],[]);assert.equal(unaffected(),baseline);
});
for(const c of [ctx,reload,demo])c.dom.window.close();
console.log(`${checks} operational CRM scenarios passed`);
