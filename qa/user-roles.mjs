import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
async function boot(saved,identity,url='https://portal.example/?workspace=vast'){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url,runScripts:'outside-only'}),w=dom.window;
 await new Promise(r=>w.addEventListener('load',r,{once:true}));
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);if(identity)w.sessionStorage.setItem('partnerlabb.demo-user.v1',identity);
 for(const name of ['partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','product-catalog','partner-orders','prototype-users'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));return {dom,w,P:w.Portal,doc:w.document};
}
const {dom,w,P,doc}=await boot(),A=P.prototypeUsers,O=P.orderWorkspace;
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const sign=id=>assert.equal(A.signIn(id).ok,true);
test('first entry requires a demo identity; direct routes do not render business data',()=>{assert.equal(P.page,'demo-login');P.go('order-commission');assert.equal(P.page,'demo-login');assert.equal(O.orders().length,0);assert.equal(doc.querySelectorAll('[data-pu-login]').length,10);});
test('seller sees own orders, shared customers and no commission/other partner/direct report routes',()=>{
 sign('demo-vast-seller-1');assert.equal(P.partner,'vast');assert.equal(O.orders().length,37);assert.equal(O.customers().length,110);assert.ok(O.orders().every(r=>A.owner(r)===A.current().id));
 for(const page of ['order-commission','user-admin','settings','partner-sales','partner-insights','crm','kickback']){P.go(page);assert.equal(P.page,'overview');}
 assert.ok([...doc.querySelectorAll('[data-go="order-commission"]')].every(n=>n.hidden));
 P.previewPartner('syd');assert.equal(P.partner,'vast');P.role='internal';P.go('partners');assert.equal(P.role,'partner');assert.equal(P.page,'overview');
 assert.equal(P.partnerSetup.saveProfile({name:'Fiktiv spärrad',salesAudiences:['consumer']}).ok,false);
 assert.equal(O.assignOrder(O.orders()[0].id,'demo-vast-seller-2','Test').ok,false);assert.equal(O.setStatus(O.orders()[0].id,'approved').ok,false);
 P.go('order-customers');assert.match(doc.querySelector('#view').textContent,/Dina ordrar/);
});
test('local HTTP identifier fallback remains unique and UUID-shaped',()=>{const original=w.crypto.randomUUID;w.crypto.randomUUID=undefined;const ids=Array.from({length:20},()=>P.newId());assert.equal(new Set(ids).size,20);assert.ok(ids.every(id=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)));w.crypto.randomUUID=original;});
let draftId;
test('new seller order owns identity; another seller cannot read or mutate it',()=>{
 const c=O.saveCustomer({name:'Fiktiv Rolltest',type:'private',email:'roll@kund.example'});assert.equal(c.ok,true);
 const r=O.saveOrder({customerId:c.id,category:'consumer',product:'Kraftringen Opti',facilities:[{installationId:'',annualKwh:'',area:'SE4'}]});assert.equal(r.ok,true);draftId=r.id;
 assert.equal(O.orders().find(o=>o.id===r.id).sellerId,A.current().id);sign('demo-vast-seller-2');assert.ok(!O.orders().some(o=>o.id===draftId));assert.ok(O.customers().some(x=>x.id===c.id));assert.equal(O.saveOrder({},draftId).ok,false);
});
let correctionId;
test('manager can combine sellers, correct registered order without lifecycle/price changes, and reassign within partner',()=>{
 sign('demo-vast-manager');assert.equal(O.orders().length,111);P.go('overview');
 doc.querySelector('[data-pu-seller="demo-vast-seller-1"]').click();doc.querySelector('[data-pu-seller="demo-vast-seller-2"]').click();assert.equal(O.orders().filter(A.selected).length,75);
 P.go('order-commission');assert.equal(P.page,'order-commission');assert.match(doc.querySelector('#view').textContent,/provision/i);
 const old=O.orders().find(r=>r.id==='flow-2026-07-01');correctionId=old.id;
 const before=JSON.stringify({status:old.status,history:old.statusHistory,approvedAt:old.approvedAt,confirmedAt:old.confirmedAt,registeredAt:old.registeredAt,price:old.priceSnapshot});
 const input={...old,priceListId:old.priceListId||'standard-demo-v1',startDate:'2026-12-01',correctionReason:'Fiktiv rättning av startdatum'};
 assert.equal(O.saveOrder({...input,correctionReason:''},old.id).ok,false);
 assert.equal(O.saveOrder(input,old.id).ok,true);
 const next=O.orders().find(r=>r.id===old.id);assert.equal(JSON.stringify({status:next.status,history:next.statusHistory,approvedAt:next.approvedAt,confirmedAt:next.confirmedAt,registeredAt:next.registeredAt,price:next.priceSnapshot}),before);
 assert.equal(next.events[0].changes.startDate.before,old.startDate);assert.equal(next.events[0].actor,'demo-vast-manager');
 assert.equal(O.assignOrder(draftId,'demo-syd-seller-1','Fel partner').ok,false);
 assert.equal(O.assignOrder(draftId,'demo-vast-seller-2','Fiktiv fördelning').ok,true);
 sign('demo-vast-seller-1');assert.ok(!O.orders().some(r=>r.id===draftId));sign('demo-vast-seller-2');assert.ok(O.orders().some(r=>r.id===draftId));
});
test('date series uses first binding event, not approval/registration, and counts day/ISO week/month/year',()=>{
 const rows=[{id:'a',registeredAt:'2026-01-01',approvedAt:'2026-01-02',confirmedAt:'2026-02-02',status:'active'},{id:'b',status:'confirmed',statusHistory:[{status:'confirmed',at:'2026-02-02T10:00:00Z'},{status:'confirmed',at:'2026-03-01T10:00:00Z'}]},{id:'c',status:'confirmed'},{id:'d',status:'confirmed',confirmedAt:'2027-01-01'}];
 assert.equal(A.salesStats(rows,{mode:'day',day:'2026-02-02'}).count,2);assert.equal(A.salesStats(rows,{mode:'month',day:'2026-01-20'}).count,0);
 assert.equal(A.salesStats(rows,{mode:'month',day:'2026-02-20'}).points.length,28);assert.equal(A.salesStats(rows,{mode:'year',day:'2026-05-01'}).count,2);
 const week=A.salesStats(rows,{mode:'week',day:'2026-12-31'});assert.equal(week.count,1);assert.deepEqual(Array.from(week.range),['2026-12-28','2027-01-03']);assert.equal(week.unknown,1);
});
test('ordinary Kraftringen account handles orders but cannot administer partners/users',()=>{
 sign('demo-internal');P.go('partners');assert.equal(P.page,'partners');assert.equal(P.partnerSetup.saveProfile({name:'Fiktiv spärrad',salesAudiences:['consumer']}).ok,false);assert.equal(A.saveUser({}).ok,false);
 P.go('user-admin');assert.notEqual(P.page,'user-admin');P.previewPartner('vast');assert.equal(O.orders().length,111);const registered=O.orders().find(r=>r.status==='registered');assert.equal(O.setStatus(registered.id,'approved').ok,true);
});
let newUser;
test('admin CRUD validates identities, last admin, active flags, retained ownership and rollback on save failure',()=>{
 sign('demo-admin');P.go('user-admin');assert.ok(doc.querySelector('[data-pu-new]'));
 assert.equal(A.saveUser({...A.current(),active:false},A.current().id).ok,false);
 const input={name:'Fiktiv Ny Säljare',email:'ny@partner.example',role:'seller',partner:'vast',active:true};
 const save=P.save,previous=JSON.stringify(P.state);P.save=()=>false;assert.equal(A.saveUser(input).ok,false);assert.equal(JSON.stringify(P.state),previous);P.save=save;
 const r=A.saveUser(input);assert.equal(r.ok,true);newUser=r.id;assert.equal(A.saveUser(input).ok,false);
 assert.equal(A.saveUser({...A.users().find(u=>u.id==='demo-vast-seller-2'),partner:'syd'},'demo-vast-seller-2').ok,false);
 const orderState=JSON.stringify(P.state.orderWorkspace);const user=A.users().find(u=>u.id==='demo-vast-seller-2');assert.equal(A.saveUser({...user,active:false},user.id).ok,true);assert.equal(JSON.stringify(P.state.orderWorkspace),orderState);assert.equal(A.signIn(user.id).ok,false);
 P.previewPartner('vast');assert.equal(O.assignOrder(correctionId,user.id,'Inaktiv').ok,false);
 const before=JSON.stringify(P.state);P.save=()=>false;assert.equal(O.assignOrder(correctionId,newUser,'Fiktiv').ok,false);assert.equal(JSON.stringify(P.state),before);P.save=save;
});
test('unknown legacy orders remain unassigned and are visible only to manager/internal',()=>{
 P.state.orderWorkspace.orders.push({...P.state.orderWorkspace.orders.find(r=>r.id===correctionId),id:'legacy-without-owner',sellerId:undefined,examplePack:undefined,events:[]});P.save();sign('demo-vast-manager');assert.equal(A.owner(O.orders().find(r=>r.id==='legacy-without-owner')),'');sign('demo-vast-seller-1');assert.ok(!O.orders().some(r=>r.id==='legacy-without-owner'));
});
const persisted=w.localStorage.getItem('partnerlabb.portal.v2');
const reloaded=await boot(persisted,'demo-vast-seller-2');assert.equal(reloaded.P.page,'demo-login');assert.ok(reloaded.P.state.orderWorkspace.orders.some(r=>r.id===draftId));reloaded.dom.window.close();
const active=await boot(persisted,'demo-vast-seller-1','https://portal.example/?workspace=syd#order-commission');assert.equal(active.P.partner,'vast');assert.equal(active.P.page,'overview');active.dom.window.close();
const demo=await boot(undefined,undefined,'https://portal.example/?demo=inflyttning');assert.equal(demo.P.prototypeUsers,undefined);demo.dom.window.close();
sign('demo-vast-seller-1');w.dispatchEvent(new w.StorageEvent('storage',{key:'partnerlabb.portal.v2',newValue:JSON.stringify({...P.state,prototypeAccess:{...P.state.prototypeAccess,users:[]}})}));assert.equal(P.page,'demo-login');assert.equal(A.signIn('demo-admin').ok,false);assert.match(doc.querySelector('#view').textContent,/Ladda om/);
dom.window.close();console.log(`${checks} role scenarios plus persistence, stale links and resident-demo isolation passed.`);
