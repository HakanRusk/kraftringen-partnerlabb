import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('dist/index.html','utf8');
async function boot(url='https://portal.example/?proposal=orders&workspace=vast',saved){
 const dom=new JSDOM(html,{url,runScripts:'outside-only'});const w=dom.window;
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
 for(const module of ['partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','product-catalog','partner-orders'])w.eval(fs.readFileSync(`dist/${module}.js`,'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));return {dom,w,P:w.Portal,doc:w.document};
}
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const {dom,w,P,doc}=await boot(),api=P.orderWorkspace;
const original=JSON.stringify({records:P.state.records,training:P.state.training,commercial:P.state.commercial,crm:P.state.crmRecords});
let cid,oid;
const customer={name:'Fiktiv <img src=x> Kund',type:'private',identifier:'',postalAddress:'Exempelgatan 5',visitAddress:'Exempelvägen 2',email:'test@kund.example',phone:'0700000000'};
const facility={installationId:'735999999999999998',annualKwh:'12000',area:'SE4',network:'DEM',profile:Array(12).fill('1000')};
let draft;
test('proposal workspace and period cards are partner scoped',()=>{assert.equal(P.role,'partner');assert.equal(P.partner,'vast');assert.equal(doc.querySelectorAll('[data-ow-status]').length,11);assert.ok(doc.querySelector('#nav [data-go="order-commission"]'));assert.equal(api.orders().length,110);assert.ok(api.orders().every(r=>r.partner==='vast'));});
test('partner catalog defaults, atomic configuration, restricted saves and preserved history',()=>{
 const c=P.productCatalog;
 assert.deepEqual(Array.from(c.allowedCategories('vast')),['consumer']);assert.deepEqual(Array.from(c.allowedCategories('syd')),['business']);
 P.go('products');assert.equal(doc.querySelectorAll('.pc-comparison tbody tr').length,3);assert.equal(doc.querySelectorAll('.pc-comparison .pc-icon').length,3);assert.equal(doc.querySelector('[data-pc-category="business"]'),null);
 const config={name:P.getPartner('vast').name,partnerType:'sales',salesAudiences:['consumer'],crmMode:P.getPartner('vast').crmMode,catalogAccess:{products:[c.key('consumer','Kraftringen Opti')],priceLists:['face2face-demo-v1']}};
 assert.equal(P.partnerSetup.saveProfile(config,'vast').ok,false);P.go('product-access');assert.notEqual(P.page,'product-access');
 const history=JSON.stringify(P.state.orderWorkspace);P.role='internal';
 const oldSave=P.save,before=JSON.stringify(P.state.partnerProfiles);P.save=()=>false;assert.equal(P.partnerSetup.saveProfile(config,'vast').ok,false);assert.equal(JSON.stringify(P.state.partnerProfiles),before);P.save=oldSave;
 assert.equal(P.partnerSetup.saveProfile(config,'vast').ok,true);P.selectedPartnerId='vast';P.go('product-access');assert.equal(new URL(w.location.href).searchParams.get('partner'),'vast');assert.equal(doc.querySelector('#pc-access-partner').value,'vast');assert.equal(JSON.stringify(P.state.orderWorkspace),history);
 P.previewPartner('vast');P.go('products');assert.equal(doc.querySelectorAll('.pc-comparison tbody tr').length,1);assert.equal(doc.querySelectorAll('[data-pc-order]').length,1);
 assert.equal(c.snapshot('standard-demo-v1','consumer','Kraftringen Opti'),null);assert.equal(c.snapshot('face2face-demo-v1','consumer','Rörligt månadspris'),null);
 assert.equal(api.saveOrder({customerId:api.customers()[0].id,category:'consumer',product:'Rörligt månadspris',priceListId:'face2face-demo-v1',facilities:[facility]}).ok,false);
 assert.equal(c.lists('syd').length,2);P.role='internal';
 assert.equal(P.partnerSetup.saveProfile({...config,catalogAccess:{products:[],priceLists:[]}},'vast').ok,true);P.previewPartner('vast');P.go('products');assert.equal(c.selected(),'');assert.equal(doc.querySelectorAll('[data-pc-order]').length,0);api.startProductOrder({category:'consumer',product:'Kraftringen Opti',priceListId:'face2face-demo-v1'});assert.equal(doc.querySelector('#ow-order-form'),null);
 // Explicitly enable both audiences for the existing all-product regression scenarios.
 P.role='internal';for(const id of ['vast','syd']){const partner=P.getPartner(id);assert.equal(P.partnerSetup.saveProfile({name:partner.name,partnerType:'sales',crmMode:partner.crmMode,salesAudiences:['consumer','business'],catalogAccess:{products:c.items.map(p=>c.key(p.category,p.name)),priceLists:['standard-demo-v1',id==='vast'?'face2face-demo-v1':'savera-demo-v1']}},id).ok,true);}
 P.previewPartner('vast');
});
test('catalog categories, scoped price lists and old facts links converge',()=>{
 const catalog=P.productCatalog;assert.equal(catalog.items.length,10);assert.deepEqual(Object.values(catalog.products).map(v=>v.length),[3,7]);
 assert.deepEqual(Array.from(catalog.lists('vast'),l=>l.id),['standard-demo-v1','face2face-demo-v1']);
 assert.equal(catalog.select('savera-demo-v1','vast'),false);
 P.go('product-facts');assert.equal(doc.querySelector('h1').textContent,'Produkter');assert.ok(doc.querySelector('[href*="elakademin.html"]'));assert.equal(doc.querySelectorAll('#nav [data-go="product-facts"]').length,0);
 assert.equal(doc.querySelectorAll('[data-pc-order]').length,3);doc.querySelector('[data-pc-category="business"]').click();assert.equal(doc.querySelectorAll('[data-pc-order]').length,7);assert.match(doc.querySelector('.pc-grid').textContent,/Kraftringen Direkt/);doc.querySelector('[data-pc-category="consumer"]').click();P.go('overview');
});
test('product CTA carries category, product and selected price through inline customer and save',()=>{
 const before=JSON.stringify(P.state.orderWorkspace);P.go('products');const c=P.productCatalog;c.select('face2face-demo-v1');P.render();
 doc.querySelector('[data-pc-order="Kraftringen Opti"]').click();let form=doc.querySelector('#ow-order-form');assert.equal(form.elements.product.value,'Kraftringen Opti');assert.equal(form.elements.priceListId.value,'face2face-demo-v1');assert.equal(form.elements.category.value,'consumer');
 form.elements.startDate.value='2026-12-01';doc.querySelector('[data-ow-create-inline]').click();doc.querySelector('[data-ow-cancel]').click();form=doc.querySelector('#ow-order-form');assert.equal(form.elements.startDate.value,'2026-12-01');assert.equal(form.elements.priceListId.value,'face2face-demo-v1');assert.equal(form.elements.product.value,'Kraftringen Opti');P.closeDialog();assert.equal(JSON.stringify(P.state.orderWorkspace),before);
 const input={customerId:api.customers()[0].id,category:'consumer',product:'Kraftringen Opti',priceListId:'face2face-demo-v1',startDate:'2026-12-01',facilities:[facility]};
 const result=api.saveOrder(input,undefined,true);assert.equal(result.ok,true);const row=api.orders().find(r=>r.id===result.id);assert.equal(row.priceSnapshot.monthly,99);const frozen=JSON.stringify(row.priceSnapshot);c.select('standard-demo-v1');P.go('products');assert.equal(JSON.stringify(row.priceSnapshot),frozen);
 assert.equal(api.saveOrder({...input,priceListId:'savera-demo-v1'}).ok,false);const originalSave=P.save;P.save=()=>false;const previous=JSON.stringify(P.state.orderWorkspace);assert.equal(api.saveOrder(input).ok,false);assert.equal(JSON.stringify(P.state.orderWorkspace),previous);P.save=originalSave;
 if(before===undefined)delete P.state.orderWorkspace;else P.state.orderWorkspace=JSON.parse(before);P.save();P.go('overview');
});
test('business CTA with no matching customer keeps product and price list; missing price is never zero',()=>{
 P.go('products');doc.querySelector('[data-pc-category="business"]').click();doc.querySelector('[data-pc-order="Kraftringen Direkt"]').click();const f=doc.querySelector('#ow-order-form');assert.equal(f.elements.customerId.value,'');assert.equal(f.elements.customerType.value,'company');assert.equal(f.elements.product.value,'Kraftringen Direkt');assert.match(f.textContent,/Prisunderlag saknas/);assert.equal(P.productCatalog.snapshot('standard-demo-v1','business','Kraftringen Direkt').monthly,null);P.closeDialog();P.go('products');doc.querySelector('[data-pc-category="consumer"]').click();P.go('overview');
});
test('compact funnel is monotone, current statuses partition the same cohort and click filters',()=>{
 const rows=api.orders().filter(r=>r.registeredAt?.startsWith('2026-10')||(!r.registeredAt&&r.createdAt.startsWith('2026-10'))),stages=['registered','approved','confirmation_sent','confirmed','active'];
 const counts=stages.map(key=>rows.filter(r=>api.reached(r,key)).length);assert.ok(counts.every((n,i)=>i===0||n<=counts[i-1]));
 assert.equal(Object.keys(api.statuses).reduce((sum,key)=>sum+rows.filter(r=>r.status===key).length,0),rows.length);
 doc.querySelector('[data-ow-stage="approved"]').click();assert.equal(doc.querySelector('[data-ow-filter="status"]').value,'stage:approved');assert.equal(doc.querySelectorAll('#ow-order-list tbody tr').length,counts[1]);
 doc.querySelector('[data-ow-status="all"]').click();assert.equal(doc.querySelector('#nav [data-go="order-list"]'),null);assert.equal(doc.querySelector('#nav [data-go="partner-sales"]'),null);
});
test('new sample pack has 90 dated orders and positive late supplementary commission',()=>{
 const sample=api.orders().filter(r=>r.examplePack==='flow2026');assert.equal(sample.length,90);
 for(const r of sample){const h=api.historyFor(r);assert.ok(h.length>=3);assert.ok(h.every((x,i)=>i===0||x.at>=h[i-1].at));assert.equal(h.at(-1).status,r.status);}
 const calc=P.face2faceCommission.calculate;assert.equal(calc(sample,'2026-07').amount,36000);assert.equal(calc(sample,'2026-08').amount,36000);assert.equal(calc(sample,'2026-09').amount,40500);assert.equal(calc(sample,'2026-10').amount,4500);
});
test('legacy status dates stay unknown and a clickable order opens dated history',()=>{
 const h=api.historyFor({status:'active',createdAt:'2026-01-01',registeredAt:'2026-01-02'});assert.equal(h.length,1);assert.equal(h[0].status,'registered');
 assert.equal(api.reached({status:'active'},'approved'),true);
 doc.querySelector('[data-ow-open]').click();assert.ok(doc.querySelector('.ow-status-history'));assert.ok(doc.querySelector('.ow-status-history time'));P.closeDialog();
});
test('ISO week boundaries and cohort date use registration, not confirmation',()=>{assert.equal(api.isoWeek('2027-01-01'),'2026-W53');assert.equal(api.isoWeek('2026-01-01'),'2026-W01');assert.equal(api.matchPeriod({registeredAt:'2026-12-31',createdAt:'2026-10-01'},{mode:'week',year:'2026',week:'53'}),true);assert.equal(api.matchPeriod({registeredAt:'2026-09-30',createdAt:'2026-10-01'},{mode:'month',year:'2026',month:'10'}),false);});
test('customer fields round trip and XSS stays text',()=>{const r=api.saveCustomer(customer);assert.equal(r.ok,true);cid=r.id;assert.equal(api.customers().find(c=>c.id===cid).visitAddress,customer.visitAddress);P.go('order-customers');assert.equal(doc.querySelector('#view img'),null);assert.match(doc.querySelector('#view').textContent,/Fiktiv <img/);});
test('draft is separate from registration; consumer strips business fields',()=>{draft={customerId:cid,category:'consumer',product:'Kraftringen Opti',startDate:'',termMonths:'12',facilities:[{...facility,installationId:'',annualKwh:''}]};const r=api.saveOrder(draft);assert.equal(r.ok,true);oid=r.id;const row=api.orders().find(o=>o.id===oid);assert.equal(row.status,'draft');assert.equal(row.registeredAt,'');assert.equal(row.facilities[0].network,'');assert.equal(row.termMonths,'');assert.equal(api.saveOrder(draft,oid,true).ok,false);});
test('registration validates duplicates and calendar before committing',()=>{draft={...draft,startDate:'2026-02-30',facilities:[facility]};assert.equal(api.saveOrder(draft,oid,true).ok,false);draft.startDate='2026-12-01';draft.facilities=[facility,facility];assert.equal(api.saveOrder(draft,oid,true).ok,false);draft.facilities=[facility,{...facility,installationId:'735999999999999997'}];assert.equal(api.saveOrder(draft,oid,true).ok,true);assert.equal(api.orders().find(o=>o.id===oid).facilities.length,2);assert.equal(api.saveOrder(draft,oid).ok,false);});
test('binding flow requires sending, preserves approval advance and forbids late withdrawal',()=>{
 const date=api.orders().find(o=>o.id===oid).registeredAt;
 assert.equal(api.setStatus(oid,'withdrawn').ok,false);assert.equal(api.setStatus(oid,'confirmed').ok,false);
 assert.equal(api.setStatus(oid,'approved').ok,true);assert.equal(api.setStatus(oid,'confirmed').ok,false);assert.equal(api.setStatus(oid,'withdrawn').ok,false);
 let row=()=>api.orders().find(o=>o.id===oid),c=api.commission([row()]);assert.equal(c.eligible.length,1);assert.equal(c.amount,1200);
 const before=JSON.stringify(P.state),save=P.save;P.save=()=>false;assert.equal(api.setStatus(oid,'confirmation_sent').ok,false);assert.equal(JSON.stringify(P.state),before);P.save=save;
 assert.equal(api.setStatus(oid,'confirmation_sent').ok,true);assert.ok(row().confirmationSentAt);assert.ok(!row().confirmedAt);assert.equal(api.commission([row()]).amount,1200);assert.equal(api.commission([row()]).confirmed.length,0);
 assert.equal(api.setStatus(oid,'confirmed').ok,true);assert.equal(api.commission([row()]).amount,1500);assert.equal(api.setStatus(oid,'withdrawn').ok,false);
 assert.equal(api.setStatus(oid,'lost_before_start').ok,true);assert.equal(api.commission([row()]).amount,1500);assert.equal(row().registeredAt,date);assert.equal(row().events.length,6);
 assert.equal(api.statuses.confirmed,'Bindande avtal');assert.equal(api.statuses.confirmation_sent,'Orderbekräftelse skickad');
});
test('withdrawal branches only after sending and never creates a binding event',()=>{
 const before=JSON.stringify(P.state.orderWorkspace);const result=api.saveOrder(draft,undefined,true);assert.equal(result.ok,true);
 assert.equal(api.setStatus(result.id,'approved').ok,true);assert.equal(api.setStatus(result.id,'confirmation_sent').ok,true);assert.equal(api.setStatus(result.id,'withdrawn').ok,true);
 const row=api.orders().find(o=>o.id===result.id);assert.ok(row.confirmationSentAt);assert.ok(!row.confirmedAt);assert.equal(api.reached(row,'confirmation_sent'),true);assert.equal(api.reached(row,'confirmed'),false);assert.equal(api.commission([row]).amount,1200);assert.equal(api.setStatus(result.id,'confirmed').ok,false);
 P.go('overview');assert.ok(doc.querySelector('.ow-withdrawal-branch [data-ow-status="withdrawn"]'));assert.equal(doc.querySelectorAll('[data-ow-stage]').length,5);assert.match(doc.querySelector('[data-ow-stage=confirmation_sent]').title,/ännu inte/);assert.match(doc.querySelector('[data-ow-stage=confirmed]').title,/blivit bindande/);
 doc.querySelector('[data-ow-status="confirmation_sent"]').click();assert.equal(doc.querySelector('[data-ow-filter="status"]').value,'confirmation_sent');doc.querySelector('[data-ow-status="all"]').click();
 P.state.orderWorkspace=JSON.parse(before);P.save();
});
test('legacy binding and withdrawn histories are read without invented send dates',()=>{
 const old={status:'confirmed',approvedAt:'2026-01-10',confirmedAt:'2026-02-12',statusHistory:[{status:'confirmed',at:'2026-02-12'}],events:[{text:'Bekräftad'}]},before=JSON.stringify(old);
 assert.equal(api.reached(old,'confirmation_sent'),true);assert.ok(!api.historyFor(old).some(h=>h.status==='confirmation_sent'));assert.equal(JSON.stringify(old),before);
 const withdrawn={status:'withdrawn',registeredAt:'2026-01-01'};assert.equal(api.reached(withdrawn,'confirmation_sent'),false);assert.ok(!api.historyFor(withdrawn).some(h=>h.status==='confirmation_sent'));
});

test('cross-partner reads and writes rejected',()=>{P.previewPartner('syd');assert.ok(!api.customers().some(c=>c.id===cid));assert.equal(api.saveCustomer(customer,cid).ok,false);assert.equal(api.setStatus(oid,'approved').ok,false);assert.equal(api.saveOrder(draft).ok,false);});
let businessId,businessOrder;
test('sole trader is a business customer; profile required for the three named products',()=>{const r=api.saveCustomer({...customer,name:'Fiktiv Firma',type:'sole',identifier:'999999-9999'});assert.equal(r.ok,true);businessId=r.id;const input={customerId:businessId,category:'business',product:'Kraftringen Direkt',startDate:'2026-12-01',termMonths:'12',facilities:[{...facility,profile:Array(12).fill('')}]};assert.equal(api.saveOrder(input,undefined,true).ok,false);input.facilities[0].profile=Array(12).fill('999');assert.equal(api.saveOrder(input,undefined,true).ok,false);input.facilities[0].profile=Array(12).fill('1000');const saved=api.saveOrder(input,undefined,true);assert.equal(saved.ok,true);businessOrder=saved.id;assert.equal(api.setStatus(businessOrder,'approved').ok,true);assert.equal(api.setStatus(businessOrder,'confirmation_sent').ok,true);assert.equal(api.setStatus(businessOrder,'confirmed').ok,true);assert.equal(api.commission([api.orders().find(o=>o.id===businessOrder)]).amount,360);});
test('status-card drilldown and search show the same scoped period',()=>{P.go('overview');doc.querySelector('[data-ow-status="confirmed"]').click();assert.equal(doc.querySelector('[data-ow-filter="status"]').value,'confirmed');const search=doc.querySelector('[data-ow-search]');search.value='Fiktiv Firma';search.dispatchEvent(new w.Event('input'));assert.equal(doc.querySelectorAll('#ow-order-list tbody tr').length,1);assert.match(doc.querySelector('#ow-order-list').textContent,/Fiktiv Firma/);});
test('customer and order forms conditional fields, cancel makes no writes',()=>{const before=JSON.stringify(P.state);doc.querySelector('[data-ow-order]').click();const form=doc.querySelector('#ow-order-form');assert.equal(form.querySelector('[name="termMonths"]'),null);form.querySelector('[name="termType"]').value='fixed';form.querySelector('[name="termType"]').dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(doc.querySelector('[name="termMonths"]'));doc.querySelector('[name="product"]').value='Kraftringen Stabil';doc.querySelector('[name="product"]').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(doc.querySelectorAll('[data-month]').length,12);doc.querySelector('[data-ow-add]').click();assert.equal(doc.querySelectorAll('[data-facility]').length,2);doc.querySelector('[data-ow-cancel]').click();assert.equal(JSON.stringify(P.state),before);});
test('appended lifecycle states preserve cohort and demo commission',()=>{
 const row=api.orders().find(o=>o.id===businessOrder),date=row.registeredAt;
 assert.deepEqual(Array.from(Object.values(api.statuses).slice(-3)),['Bortfall före start','Aktivt avtal','Bortfall efter start']);
 assert.equal(api.setStatus(businessOrder,'awaiting_start').ok,false);
 assert.equal(api.commission([api.orders().find(o=>o.id===businessOrder)]).amount,360);
 assert.equal(api.setStatus(businessOrder,'active').ok,true);
 assert.equal(api.commission([api.orders().find(o=>o.id===businessOrder)]).amount,360);
 assert.equal(api.setStatus(businessOrder,'lost_after_start').ok,true);
 assert.equal(api.commission([api.orders().find(o=>o.id===businessOrder)]).amount,0);
 assert.equal(api.orders().find(o=>o.id===businessOrder).registeredAt,date);
 const before=api.orders().find(o=>o.status==='confirmed');assert.equal(api.setStatus(before.id,'lost_before_start').ok,true);
 P.go('overview');doc.querySelector('[data-ow-status="lost_before_start"]').click();assert.equal(doc.querySelector('[data-ow-filter="status"]').value,'lost_before_start');
});
test('volume and duration distinguish missing inputs from real zero or rolling',()=>{
 assert.equal(api.annualVolume({facilities:[{annualKwh:'12000'},{annualKwh:'6000'}]}),18000);
 assert.equal(api.annualVolume({facilities:[{annualKwh:'12000'},{annualKwh:''}]}),null);
 assert.equal(api.annualVolume({facilities:[{annualKwh:'0'}]}),0);
 assert.equal(api.termLabel({category:'business',termMonths:''}),'Ej angiven');
 assert.equal(api.termLabel({termType:'rolling',termMonths:'12'}),'Rörlig');
 assert.equal(api.termLabel({termType:'fixed',termMonths:'24'}),'24 månader');
 assert.match(doc.querySelector('#ow-order-list').textContent,/Total årsvolym/);
});
test('all requested products, customer types and duration options can be saved',()=>{
 for(const type of ['company','sole','private']){
  const c=api.saveCustomer({...customer,type});assert.equal(c.ok,true);
  const category=type==='private'?'consumer':'business';
  for(const product of api.products[category]){
   const input={customerId:c.id,category,product,startDate:'2026-12-01',termType:'fixed',termMonths:'24',facilities:[facility]};
   const r=api.saveOrder(input,undefined,true);assert.equal(r.ok,true,product);assert.equal(api.termLabel(api.orders().find(o=>o.id===r.id)),'24 månader');
   assert.equal(api.saveOrder({...input,termMonths:'0'},undefined,true).ok,false);
   assert.equal(api.saveOrder({...input,termType:'rolling',termMonths:''},undefined,true).ok,true);
  }
 }
});
test('inline customer creation and cancel preserve unsaved order',()=>{
 P.go('order-list');doc.querySelector('[data-ow-order]').click();
 doc.querySelector('[name="startDate"]').value='2027-02-01';doc.querySelector('[data-field="annualKwh"]').value='54321';
 doc.querySelector('[data-ow-create-inline]').click();doc.querySelector('[data-ow-cancel]').click();
 assert.equal(doc.querySelector('[name="startDate"]').value,'2027-02-01');assert.equal(doc.querySelector('[data-field="annualKwh"]').value,'54321');
 doc.querySelector('[data-ow-create-inline]').click();const f=doc.querySelector('#ow-customer-form');f.elements.name.value='Fiktiv ny kund i order';f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(doc.querySelector('[name="customerId"] option:checked').textContent,'Fiktiv ny kund i order');assert.equal(doc.querySelector('[data-field="annualKwh"]').value,'54321');doc.querySelector('[data-ow-cancel]').click();
});
test('same area navigation remains first on reference pages and preserves partner',()=>{
 for(const route of ['overview','product-facts','support','order-list']){P.go(route);const nav=doc.querySelector('#view').firstElementChild;assert.ok(nav.classList.contains('ow-tabs'));assert.equal(nav.querySelector('[aria-current="page"]').dataset.go,route==='order-list'?'overview':route==='product-facts'?'products':route);assert.equal(P.partner,'syd');}
});
test('save failure rolls back only new mutation and keeps typed dialog',()=>{const before=JSON.stringify(P.state);const save=P.save;P.save=()=>false;assert.equal(api.saveCustomer({...customer,type:'company'}).ok,false);assert.equal(api.setStatus(businessOrder,'withdrawn').ok,false);assert.equal(JSON.stringify(P.state),before);P.save=save;});
const saved=w.localStorage.getItem('partnerlabb.portal.v2');
test('legacy switch preserves data and old home; proposal can be restored',()=>{doc.querySelector('[data-ow-legacy]').click();assert.equal(doc.querySelectorAll('.partner-start-choice').length,4);assert.equal(w.localStorage.getItem('partnerlabb.portal.v2'),saved);api.enable(true);P.previewPartner('vast');assert.ok(api.orders().some(o=>o.id===oid));assert.equal(JSON.stringify({records:P.state.records,training:P.state.training,commercial:P.state.commercial,crm:P.state.crmRecords}),original);});
const reload=await boot('https://portal.example/?proposal=orders&workspace=vast',saved);
test('reload preserves customers and order history',()=>{assert.equal(reload.P.orderWorkspace.orders().find(o=>o.id===oid).status,'lost_before_start');assert.equal(reload.P.orderWorkspace.customers().find(c=>c.id===cid).postalAddress,customer.postalAddress);});
test('concurrent-tab mutation fails without overwriting other tab',()=>{const before=JSON.stringify(reload.P.state);reload.w.localStorage.setItem('partnerlabb.portal.v2','{"records":[],"otherTab":true}');assert.equal(reload.P.orderWorkspace.saveCustomer(customer).ok,false);assert.equal(JSON.stringify(reload.P.state),before);assert.match(reload.w.localStorage.getItem('partnerlabb.portal.v2'),/otherTab/);});
const oldState=JSON.parse(saved);oldState.orderWorkspace.orders=oldState.orderWorkspace.orders.filter(r=>r.examplePack!=='flow2026');oldState.orderWorkspace.customers=oldState.orderWorkspace.customers.filter(r=>!r.id.startsWith('flow-2026-'));delete oldState.orderWorkspace.samplePacks;
const oldRows=JSON.stringify(oldState.orderWorkspace.orders),upgraded=await boot('https://portal.example/?workspace=vast',JSON.stringify(oldState));
test('sample migration is additive, idempotent and leaves old orders byte-equivalent',()=>{assert.equal(upgraded.P.orderWorkspace.orders().filter(r=>r.examplePack==='flow2026').length,90);assert.equal(JSON.stringify(upgraded.P.state.orderWorkspace.orders.filter(r=>r.examplePack!=='flow2026')),oldRows);const snapshot=JSON.stringify(upgraded.P.state);upgraded.P.orderWorkspace.installExamples();assert.equal(JSON.stringify(upgraded.P.state),snapshot);});
upgraded.dom.window.close();
const broken=JSON.parse(saved);broken.orderWorkspace={version:1,customers:'unreadable',orders:[]};const bad=await boot('https://portal.example/?proposal=orders&workspace=vast',JSON.stringify(broken));
test('damaged order data is preserved rather than reseeded',()=>{assert.equal(bad.P.orderWorkspace.healthy(),false);assert.equal(bad.P.orderWorkspace.saveCustomer(customer).ok,false);assert.equal(bad.P.state.orderWorkspace.customers,'unreadable');});
const demo=await boot('https://portal.example/?demo=inflyttning&proposal=orders&workspace=vast',saved);
test('separate customer demo does not read normal orders',()=>{assert.equal(demo.P.orderWorkspace.orders().some(o=>o.id===oid),false);});
const standard=await boot('https://portal.example/');
test('ordinary existing partner selection defaults to status cards without opt-in',()=>{
 assert.equal(standard.P.role,'internal');assert.equal(standard.doc.querySelector('#ow-login'),null);
 for(const id of ['syd','vast']){standard.P.previewPartner(id);assert.equal(standard.doc.querySelectorAll('[data-ow-status]').length,11);assert.ok(standard.doc.querySelector('#ow-order-list'));}
 standard.P.returnInternal();standard.P.commercial.selectPartner('syd','partner-detail');
 standard.doc.querySelector('[data-ow-partner]').click();assert.equal(standard.P.partner,'syd');assert.equal(standard.P.role,'partner');
 assert.equal(standard.doc.querySelectorAll('[data-ow-status]').length,11);
});
const direct=await boot('https://portal.example/?workspace=vast');
test('existing workspace deep link opens orders; explicit legacy URL still restores previous view',()=>{assert.equal(direct.doc.querySelectorAll('[data-ow-status]').length,11);});
const legacy=await boot('https://portal.example/?proposal=legacy&workspace=vast');
test('explicit legacy link retains rollback and data',()=>{assert.equal(legacy.doc.querySelectorAll('.partner-start-choice').length,4);});
standard.dom.window.close();direct.dom.window.close();legacy.dom.window.close();
for(const ctx of [dom,reload.dom,bad.dom,demo.dom])ctx.window.close();
console.log(`${checks} order proposal checks passed.`);

const restricted=await boot();
const r=restricted.P,rc=r.productCatalog,ra=r.orderWorkspace,rd=restricted.doc;
const lockedDraft=ra.saveOrder({customerId:ra.customers()[0].id,category:'consumer',product:'Rörligt månadspris',priceListId:'standard-demo-v1',facilities:[facility]});
assert.equal(lockedDraft.ok,true);
const lockedHistory=JSON.stringify(r.state.orderWorkspace);r.role='internal';
assert.equal(r.partnerSetup.saveProfile({name:r.getPartner('vast').name,partnerType:'sales',crmMode:r.getPartner('vast').crmMode,salesAudiences:['consumer'],catalogAccess:{products:[rc.key('consumer','Kraftringen Opti')],priceLists:['face2face-demo-v1']}},'vast').ok,true);
const restrictedSaved=restricted.w.localStorage.getItem('partnerlabb.portal.v2');
r.previewPartner('vast');r.go('overview');
const reloadedAccess=await boot(undefined,restrictedSaved);
test('catalog configuration reloads; revoked draft and historical prices stay unchanged',()=>{
 assert.equal(JSON.stringify(r.state.orderWorkspace),lockedHistory);
 assert.deepEqual(Array.from(reloadedAccess.P.productCatalog.availableProducts('consumer')),['Kraftringen Opti']);
 assert.deepEqual(Array.from(reloadedAccess.P.productCatalog.lists(),l=>l.id),['face2face-demo-v1']);
 const row=ra.orders().find(o=>o.id===lockedDraft.id);assert.equal(ra.saveOrder(row,row.id).ok,false);assert.equal(JSON.stringify(r.state.orderWorkspace),lockedHistory);
 r.state.partnerProfiles.vast.catalogAccess={};assert.equal(rc.availableProducts('consumer').length,0);assert.equal(rc.lists().length,0);
});
restricted.dom.window.close();reloadedAccess.dom.window.close();

const compat=await boot(),cp=compat.P,ca=cp.orderWorkspace;
ca.saveCustomer({name:'Historiktest',type:'private'});
const legacyRow=cp.state.orderWorkspace.orders.find(r=>r.partner==='vast'&&r.status==='confirmed');
legacyRow.status='awaiting_start';legacyRow.registeredAt='2026-09-08';legacyRow.createdAt='2026-09-07';legacyRow.approvedAt='2026-09-10';legacyRow.confirmedAt='2026-09-15';legacyRow.statusHistory=[{status:'confirmed',at:'2026-09-15'},{status:'awaiting_start',at:'2026-09-16'}];cp.save();
const legacySaved=compat.w.localStorage.getItem('partnerlabb.portal.v2'),legacyReload=await boot(undefined,legacySaved);
test('merged binding/waiting state preserves legacy rows, dates, commission and history across reload',()=>{
 const before=JSON.stringify(cp.state.orderWorkspace),r=ca.orders().find(o=>o.id===legacyRow.id);
 assert.equal(r.status,'confirmed');assert.equal(legacyReload.P.orderWorkspace.orders().find(o=>o.id===legacyRow.id).status,'confirmed');assert.equal(legacyRow.status,'awaiting_start');
 assert.equal(ca.orders().filter(o=>o.id===legacyRow.id).length,1);assert.equal(cp.face2faceCommission.calculate([r],'2026-09').amount,1500);assert.equal(cp.face2faceCommission.calculate([legacyRow],'2026-09').amount,1500);
 assert.deepEqual(Array.from(ca.historyFor(r),h=>h.status),['registered','approved','confirmed','awaiting_start']);assert.equal(JSON.stringify(cp.state.orderWorkspace),before);
 assert.equal(ca.setStatus(r.id,'awaiting_start').ok,false);const save=cp.save;cp.save=()=>false;assert.equal(ca.setStatus(r.id,'active').ok,false);assert.equal(JSON.stringify(cp.state.orderWorkspace),before);cp.save=save;
 assert.equal(ca.setStatus(r.id,'active').ok,true);const after=ca.orders().find(o=>o.id===r.id);assert.equal(after.confirmedAt,'2026-09-15');assert.ok(ca.historyFor(after).some(h=>h.status==='awaiting_start'&&h.at==='2026-09-16'));
});
test('all loss filters live under the relevant stage and still filter current statuses',()=>{
 cp.go('overview');for(const [column,status] of [['approved','rejected'],['confirmation_sent','withdrawn'],['confirmed','lost_before_start'],['active','lost_after_start']]){
  const button=compat.doc.querySelector(`[data-ow-column="${column}"] .ow-loss-branch [data-ow-status="${status}"]`);assert.ok(button);button.click();assert.equal(compat.doc.querySelector('[data-ow-filter="status"]').value,status);
 }
 assert.equal(compat.doc.querySelectorAll('.ow-loss-branch').length,4);assert.equal(compat.doc.querySelectorAll('[data-ow-status]').length,11);assert.equal(compat.doc.querySelector('[data-ow-stage="awaiting_start"]'),null);
});
compat.dom.window.close();legacyReload.dom.window.close();
