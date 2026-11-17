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
// Shared month UI: cross-year values flow unchanged into order and binding reports.
change('[data-ow-filter="mode"]','month');change('[data-month-year="orders"]','2026');
const tick=(key,v)=>{const el=d.querySelector(`[data-month-check="${key}"][value="${v}"]`);assert.ok(el,v);if(!el.checked)el.click();};
tick('orders','2026-12');
for(const el of [...d.querySelectorAll('[data-month-check="orders"]:checked')])if(el.value!=='2026-12')d.querySelector(`[data-month-check="orders"][value="${el.value}"]`).click();
change('[data-month-year="orders"]','2027');tick('orders','2027-01');
assert.deepEqual(Array.from(O.reportPeriod().multi.month),['2026-12','2027-01']);
assert.equal(d.activeElement.value,'2027-01');assert.equal(d.querySelector('[data-month-picker="orders"]').open,true);
assert.match(d.querySelector('#orders-month-value').textContent,/dec 2026–jan 2027/);
assert.equal(d.querySelector('[data-period-add="orders"]'),null);assert.equal(d.querySelector('.period-set-values'),null);
const synthetic=[{status:'confirmed',confirmedAt:'2026-12-31'},{status:'confirmed',confirmedAt:'2027-01-01'},{status:'confirmed',confirmedAt:'2027-02-01'}];
assert.equal(A.salesStats(synthetic,O.reportPeriod()).count,2);
assert.equal(S.matches('2027-01-31','month',O.reportPeriod().multi.month),true);
assert.equal(S.matches('2026-11-30','month',O.reportPeriod().multi.month),false);
d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(d.querySelector('[data-month-picker="orders"]').open,false);assert.equal(d.activeElement.tagName,'SUMMARY');
d.querySelector('[data-month-quick="orders"][data-month-kind="year"]').click();
assert.equal(O.reportPeriod().multi.month.length,12);assert.ok(O.reportPeriod().multi.month.every(v=>v.startsWith('2027-')));
assert.match(d.querySelector('#orders-month-value').textContent,/jan–dec 2027/);
for(const kind of ['current','quarter','ytd']){
 d.querySelector(`[data-month-quick="orders"][data-month-kind="${kind}"]`).click();
 const now=new Date(),v=O.reportPeriod().multi.month;assert.equal(v.length,kind==='current'?1:kind==='quarter'?3:now.getMonth()+1);
 assert.ok(v.every(m=>m.startsWith(String(now.getFullYear()))));
}
assert.match(S.monthSummary(['2026-01','2026-03','2026-05','2026-07']),/4 månader valda/);
d.querySelector('[data-month-done="orders"]').click();assert.equal(d.querySelector('[data-month-picker="orders"]').open,false);
assert.equal(JSON.stringify(P.state.orderWorkspace),before);
// Historical reports: union of rows, stock at latest date, no summed churn bases.
for(const n of ['partner-results-data','savera-data'])w.eval(fs.readFileSync('dist/'+n+'.js','utf8'));
const R=P.partnerSalesData.forPartner('syd'),f={mode:'month',value:'2026-07',values:['2026-07','2026-09']};
const ids=new Set(['2026-07','2026-09'].flatMap(value=>R.query({mode:'month',value}).map(r=>r.id)));
assert.deepEqual(Array.from(R.query(f),r=>r.id).sort(),[...ids].sort());
assert.equal(R.summary(f).activeCount,R.summary({mode:'month',value:'2026-09'}).activeCount);
assert.equal(R.insights(f).churn.rate,null);assert.equal(R.period?R.period(f).daysObserved:P.partnerSalesData.period(f).daysObserved,61);
console.log('PASS all period types, ISO year boundary, leap dates, gaps, deduplication, scoped drilldown, stock and read-only state');dom.window.close();
