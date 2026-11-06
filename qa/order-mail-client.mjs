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

const {dom,w,P,doc}=await boot();
w.AbortSignal=globalThis.AbortSignal;
const O=P.orderWorkspace,A=P.prototypeUsers;A.signIn('demo-vast-seller-1');
const c=O.saveCustomer({name:'Fiktiv Mejlkund',type:'private',email:'test@kund.example'});
const r=O.saveOrder({customerId:c.id,category:'consumer',product:'Kraftringen Opti',requiresPowerOfAttorney:true,facilities:[{installationId:'',annualKwh:'',area:'SE4'}]});
let calls=0,payload;w.fetch=async(url,init)=>{calls++;payload=init.body;throw new Error('Tillfälligt avbrott');};
const saved=P.save;P.save=()=>false;assert.equal((await O.sendMail(r.id)).ok,false);assert.equal(calls,0);P.save=saved;
assert.equal((await O.sendMail(r.id)).ok,false);assert.equal(O.orders().find(x=>x.id===r.id).status,'draft');
const first=payload;assert.equal(O.saveOrder({},r.id).ok,false);
w.fetch=async(url,init)=>{assert.equal(init.body,first);return {ok:true,json:async()=>({accepted:true,providerMessageId:'test-mail',acceptedAt:new Date().toISOString(),recipient:'hakan.rusk@kraftringen.se',documents:['order.txt','fullmakt.txt']})};};
assert.equal((await O.sendMail(r.id)).ok,true);
const sent=O.orders().find(x=>x.id===r.id);assert.equal(sent.status,'sent');assert.equal(sent.registeredAt,'');assert.equal(O.reached(sent,'registered'),false);assert.equal(O.flowSummary([sent]).unknown.length,0);assert.equal(O.flowSummary([sent]).sent,1);assert.equal(O.matchesFlow(sent,'sent-history'),true);
assert.equal(O.setStatus(r.id,'registered','complete-demo-receipt').ok,false);
A.signIn('demo-internal');P.previewPartner('vast');assert.equal(O.setStatus(r.id,'registered').ok,false);assert.equal(O.setStatus(r.id,'registered','complete-demo-receipt').ok,true);assert.ok(O.orders().find(x=>x.id===r.id).registeredAt);assert.equal(O.matchesFlow(O.orders().find(x=>x.id===r.id),'sent-history'),true);
dom.window.close();console.log('PASS persisted attempts, no send on save failure, same retry payload, sent/registration separation and role-gated demo receipt');
