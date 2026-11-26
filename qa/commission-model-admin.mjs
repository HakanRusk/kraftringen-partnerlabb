import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://portal.example/',runScripts:'outside-only'}),w=dom.window,d=w.document;
await new Promise(r=>w.addEventListener('load',r,{once:true}));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const n of ['partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','product-catalog','partner-orders','prototype-users','customer-services','internal-sales','commission-model-admin'])w.eval(fs.readFileSync('dist/'+n+'.js','utf8'));
d.dispatchEvent(new w.Event('DOMContentLoaded'));
const P=w.Portal,A=P.prototypeUsers;
const before=JSON.stringify(P.state.orderWorkspace);
P.go('commission-models');assert.equal(P.page,'demo-login');assert.equal(d.querySelector('iframe'),null);
A.signIn('demo-admin');P.go('commission-models');assert.equal(P.page,'commission-models');assert.ok(d.querySelector('#nav [data-go="commission-models"]'));assert.equal(d.querySelector('iframe').src,'https://portal.example/admin-studio/index.html');assert.equal(d.querySelector('#view a[target="_blank"]'),null);assert.match(d.querySelector('#current-page').textContent,/Provisionsmodeller/);
for(const role of ['demo-internal','demo-vast-manager','demo-vast-seller-1','demo-estate-manager','demo-customer','demo-customer-admin']){
 A.signIn(role);assert.equal(A.allowed('commission-models'),false,role);P.go('commission-models');assert.notEqual(P.page,'commission-models',role);assert.equal(d.querySelector('iframe'),null,role);assert.equal(d.querySelector('#nav [data-go="commission-models"]'),null,role);assert.doesNotMatch(P.routes['commission-models'].render(),/<iframe/,role);
}
A.signIn('demo-admin');P.role='partner';assert.doesNotMatch(P.routes['commission-models'].render(),/<iframe/);P.role='internal';P.go('commission-models');A.signOut();assert.equal(d.querySelector('iframe'),null);assert.equal(JSON.stringify(P.state.orderWorkspace),before);
assert.ok(fs.readFileSync('dist/index.html','utf8').includes('commission-model-admin.js'));
console.log('PASS admin entry; six denied roles; direct route guard; preview restriction; logout removes frame; existing order data preserved. Private remote authentication not simulated by this test.');dom.window.close();
// Direct standalone access must not load data/calculation scripts.
const direct=new JSDOM(fs.readFileSync('dist/admin-studio/index.html','utf8'),{url:'https://portal.example/admin-studio/index.html',runScripts:'outside-only'});
direct.window.eval(fs.readFileSync('dist/admin-studio/gate.js','utf8'));
assert.equal(direct.window.StudioAccess.allowed(),false);
assert.match(direct.window.document.body.textContent,/Öppna via administrationen/);
assert.equal(direct.window.document.querySelector('script[src="model.js"]'),null);
assert.equal(direct.window.document.querySelector('script[src="app.js"]'),null);
direct.window.close();
console.log('PASS direct studio URL does not load demo data or app; no external Site links remain.');
