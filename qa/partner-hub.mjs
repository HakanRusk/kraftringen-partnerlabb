import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://demo.example/',runScripts:'outside-only'});
const w=dom.window, d=w.document;
await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.HTMLDialogElement.prototype.close=function(){this.open=false};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
for(const script of d.querySelectorAll('script[src]')) {
  if(!script.getAttribute('src').startsWith('vendor/'))w.eval(fs.readFileSync('dist/'+script.getAttribute('src'),'utf8'));
}
d.dispatchEvent(new w.Event('DOMContentLoaded'));
const P=w.Portal, click=selector=>{const button=d.querySelector(selector);assert.ok(button,selector);button.click()};
const expected=['Översikt','Tjänster','Resultat & ersättning','Kunskap & support','Vårt samarbete'];
for(const [user,service] of [['demo-vast-seller-1','order-list'],['demo-syd-manager','order-list'],['demo-estate-manager','estate-home']]){
  assert.ok(P.prototypeUsers.signIn(user).ok);
  assert.deepEqual(Array.from(d.querySelectorAll('#nav button'),b=>b.textContent.trim()),expected);
  click('#nav [data-go="partner-hub-services"]');
  assert.equal(P.page,service);
}
P.prototypeUsers.signIn('demo-vast-manager');click('#nav [data-go="partner-hub-results"]');assert.equal(P.page,'order-commission');assert.ok(d.querySelector('.oc-monthly-table'));click('#nav [data-go="partner-hub-learning"]');assert.equal(P.page,'academy');assert.ok(d.querySelector('#view [data-go="academy-library"]'));P.prototypeUsers.signIn('demo-estate-manager');click('#nav [data-go="partner-hub-results"]');assert.equal(P.page,'property-results');
P.go('overview');assert.ok(d.querySelector('[data-unit-search]'));click('[data-estate-unit="a1"]');
assert.equal(P.page,'estate-portfolio');
const form=d.querySelector('#estate-change');
assert.ok(form);
form.elements.name.value='Hyresgäst Exempel'; form.elements.email.value='test@kund.example';
form.elements.date.value=form.elements.date.min; form.elements.authority.value='TEST-34';
form.elements.valid.checked=true;
w.fetch=async()=>({ok:true,json:async()=>({accepted:true,recipient:'test@demo.example'})});
form.requestSubmit();
await new Promise(resolve=>setTimeout(resolve,0));
const row=P.state.estateEvents.estate1.a1[0];
click('[data-go="estate-cases"]');click('[data-event="'+row.id+'"]');
assert.ok(d.getElementById('estate-event-'+row.id).querySelector('details').open);
assert.equal(P.state.estateEvents.estate1.a1.length,1);
click('[data-estate-back]');
const search=d.querySelector('[data-unit-search]');search.value='Parkvägen';search.oninput();
assert.equal(d.querySelectorAll('[data-unit-address]:not([hidden])').length,1);
P.prototypeUsers.signIn('demo-admin');P.go('partners');
click('[data-is-partner="estate1"]');click('[data-is-tab="services"]');click('[data-is-preview-services="estate1"]');
assert.equal(P.page,'estate-home');
assert.ok(d.querySelector('[data-unit-search]'));
dom.window.close();
console.log('PASS gemensam meny, tre tjänster, samma inflyttning och ärende, beståndssökning och intern förhandsvisning');
