import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://portal.example/',runScripts:'outside-only'}),w=dom.window,d=w.document;
await new Promise(r=>w.addEventListener('load',r,{once:true}));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const n of ['partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','product-catalog','partner-orders','prototype-users','customer-services','internal-sales'])w.eval(fs.readFileSync('dist/'+n+'.js','utf8'));
d.dispatchEvent(new w.Event('DOMContentLoaded'));
const P=w.Portal,A=P.prototypeUsers,I=P.internalSales,O=P.orderWorkspace;

const S=P.periodSet;
assert.deepEqual(Array.from(S.range('week','2026-W53')),['2026-12-28','2027-01-03']);
assert.equal(S.range('week','2026-W54'),null);assert.equal(S.range('day','2026-02-30'),null);
assert.deepEqual(Array.from(S.range('month','2028-02')),['2028-02-01','2028-02-29']);
for(const [mode,values,yes,no] of [['year',['2024','2026'],'2026-08-01','2025-08-01'],['week',['2026-W01','2026-W53'],'2027-01-01','2026-07-01'],['day',['2026-07-01','2026-07-03'],'2026-07-03','2026-07-02']]){assert.equal(S.matches(yes,mode,values),true);assert.equal(S.matches(no,mode,values),false);}
const change=(q,value)=>{const el=d.querySelector(q);assert.ok(el,q);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
const add=(key,value)=>{change(`[data-period-input="${key}"]`,value);d.querySelector(`[data-period-add="${key}"]`).click();};
const keep=(key,values)=>{for(const b of [...d.querySelectorAll(`[data-period-remove="${key}"]`)])if(!values.includes(b.dataset.periodValue))d.querySelector(`[data-period-remove="${key}"][data-period-value="${b.dataset.periodValue}"]`).click();};
A.signIn('demo-internal');const before=JSON.stringify(P.state.orderWorkspace);
for(const [mode,values] of [['year',['2025','2026']],['week',['2026-W28','2026-W37']],['day',['2026-07-07','2026-09-07']]]){
 P.go('overview');change('[data-is-filter="mode"]',mode);values.forEach(v=>add('internal',v));keep('internal',values);
 const expected=I.all().filter(r=>r.status!=='draft'&&S.matches(I.entryDate(r),mode,values));assert.deepEqual(Array.from(I.cohort(),r=>r.id),Array.from(expected,r=>r.id));
 const count=d.querySelectorAll('[data-period-remove="internal"]').length;add('internal',values[0]);assert.equal(d.querySelectorAll('[data-period-remove="internal"]').length,count);
 d.querySelector('[data-is-slice="cohort"]').click();assert.equal(d.querySelectorAll('[data-is-order]').length,expected.length);
}
A.signIn('demo-vast-seller-1');P.go('overview');
for(const [mode,values] of [['year',['2025','2026']],['week',['2026-W28','2026-W37']],['day',['2026-07-10','2026-09-10']]]){
 change('[data-ow-filter="mode"]',mode);values.forEach(v=>add('orders',v));keep('orders',values);const rows=O.orders();
 assert.equal(d.querySelectorAll('[data-ow-filter="mode"]').length,1);assert.equal(d.querySelectorAll('[data-pu-period]').length,0);
 assert.equal(Number(d.querySelector('.pu-total').textContent),rows.filter(r=>S.matches(A.bindingDate(r),mode,values)).length);
 assert.equal(d.querySelectorAll('[data-ow-row]').length,rows.filter(r=>S.matches(r.registeredAt||r.createdAt,mode,values)).length);
}
assert.equal(JSON.stringify(P.state.orderWorkspace),before);
// Historical reports: union of rows, stock at latest date, no summed churn bases.
for(const n of ['partner-results-data','savera-data'])w.eval(fs.readFileSync('dist/'+n+'.js','utf8'));
const R=P.partnerSalesData.forPartner('syd'),f={mode:'month',value:'2026-07',values:['2026-07','2026-09']};
const ids=new Set(['2026-07','2026-09'].flatMap(value=>R.query({mode:'month',value}).map(r=>r.id)));
assert.deepEqual(Array.from(R.query(f),r=>r.id).sort(),[...ids].sort());
assert.equal(R.summary(f).activeCount,R.summary({mode:'month',value:'2026-09'}).activeCount);
assert.equal(R.insights(f).churn.rate,null);assert.equal(R.period?R.period(f).daysObserved:P.partnerSalesData.period(f).daysObserved,61);
console.log('PASS all period types, ISO year boundary, leap dates, gaps, deduplication, scoped drilldown, stock and read-only state');dom.window.close();
