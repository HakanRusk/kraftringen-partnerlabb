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
const change=(q,value)=>{if(q.includes('filter="mode"')){const key=q.includes('data-is')?'internal':'orders';d.querySelector(`[data-period-mode="${key}"][data-mode="${value}"]`).click();return;}const el=d.querySelector(q);assert.ok(el,q);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
const click=(q)=>{const el=d.querySelector(q);assert.ok(el,q);assert.equal(el.disabled,false,q);el.click();};
const show=(key,v)=>{if(d.querySelector(`[data-period-year="${key}"]`))change(`[data-period-year="${key}"]`,v.slice(0,4));if(d.querySelector(`[data-period-month="${key}"]`))change(`[data-period-month="${key}"]`,v.slice(5,7));};
const choose=(key,a,b)=>{show(key,a);if(b)click(`[data-period-interval="${key}"]`);click(`[data-period-cell="${key}"][data-value="${a}"]`);if(b){show(key,b);click(`[data-period-cell="${key}"][data-value="${b}"]`);}click(`[data-period-apply="${key}"]`);assert.equal(d.querySelector(`[data-period-picker="${key}"]`).open,false);};
assert.deepEqual(Array.from(S.span('month','2026-03','2026-01')),['2026-01','2026-02','2026-03']);
assert.deepEqual(Array.from(S.span('week','2026-W53','2027-W01')),['2026-W53','2027-W01']);
assert.deepEqual(Array.from(S.span('day','2028-02-28','2028-03-01')),['2028-02-28','2028-02-29','2028-03-01']);
assert.equal(S.span('month','2026-01','2026-03',[{value:'2026-01'},{value:'2026-03'}]).length,0);
assert.equal(S.range('day','2026-02-30'),null);
A.signIn('demo-internal');const before=JSON.stringify(P.state.orderWorkspace);
for(const [mode,a,b] of [['year','2025','2026'],['week','2026-W28','2026-W37'],['day','2026-07-07','2026-09-07'],['month','2026-07','2026-09']]){
 P.go('overview');change('[data-is-filter="mode"]',mode);choose('internal',a,b);const values=S.span(mode,a,b);
 const expected=I.all().filter(r=>r.status!=='draft'&&S.matches(I.entryDate(r),mode,values));assert.deepEqual(Array.from(I.cohort(),r=>r.id),Array.from(expected,r=>r.id));
 d.querySelector('[data-is-slice="cohort"]').click();assert.equal(d.querySelectorAll('[data-is-order]').length,expected.length);
}
A.signIn('demo-vast-seller-1');P.go('overview');
for(const [mode,a,b] of [['year','2025','2026'],['week','2026-W28','2026-W37'],['day','2026-07-10','2026-09-10'],['month','2026-07','2026-09']]){
 change('[data-ow-filter="mode"]',mode);choose('orders',a,b);const values=S.span(mode,a,b),rows=O.orders();
 assert.equal(Number(d.querySelector('.pu-total').textContent),rows.filter(r=>S.matches(A.bindingDate(r),mode,values)).length);
 assert.equal(d.querySelectorAll('[data-ow-row]').length,rows.filter(r=>S.matches(r.registeredAt||r.createdAt,mode,values)).length);
 assert.equal(d.querySelector('[data-period-add]'),null);assert.equal(d.querySelector('.period-set-values'),null);
}
choose('orders','2026-12','2027-01');assert.deepEqual(Array.from(O.reportPeriod().multi.month),['2026-12','2027-01']);
assert.equal(d.activeElement.tagName,'SUMMARY');assert.match(d.querySelector('#orders-period-value').textContent,/December 2026 – januari 2027/);
const synthetic=[{status:'confirmed',confirmedAt:'2026-12-31'},{status:'confirmed',confirmedAt:'2027-01-01'},{status:'confirmed',confirmedAt:'2027-02-01'}];
assert.equal(A.salesStats(synthetic,O.reportPeriod()).count,2);
choose('orders','2027-01');assert.deepEqual(Array.from(O.reportPeriod().multi.month),['2027-01']);
assert.equal(A.salesStats(synthetic,O.reportPeriod()).points.length,31);
// Escape discards an unfinished interval and restores focus without changing the report.
click('[data-period-interval="orders"]');click('[data-period-cell="orders"][data-value="2027-03"]');
d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.deepEqual(Array.from(O.reportPeriod().multi.month),['2027-01']);assert.equal(d.activeElement.tagName,'SUMMARY');
// Draft selection and mode change must not affect totals until Visa; cancel restores both.
const saved=JSON.stringify(O.reportPeriod());
click('[data-period-mode="orders"][data-mode="year"]');
click('[data-period-cell="orders"][data-value="2027"]');
assert.equal(JSON.stringify(O.reportPeriod()),saved);
click('[data-period-cancel="orders"]');assert.equal(JSON.stringify(O.reportPeriod()),saved);
choose('orders','2027-02','2027-04');
assert.deepEqual(Array.from(O.reportPeriod().multi.month),['2027-02','2027-03','2027-04']);
assert.equal(JSON.stringify(P.state.orderWorkspace),before);
// Contiguous reporting uses one opening cohort, rather than adding monthly churn bases.
for(const n of ['partner-results-data','savera-data'])w.eval(fs.readFileSync('dist/'+n+'.js','utf8'));
const R=P.partnerSalesData.forPartner('syd'),f={mode:'month',value:'2026-07',values:['2026-07','2026-08','2026-09']};
const ids=new Set(f.values.flatMap(value=>R.query({mode:'month',value}).map(r=>r.id)));
assert.deepEqual(Array.from(R.query(f),r=>r.id).sort(),[...ids].sort());
assert.equal(R.summary(f).activeCount,R.summary({mode:'month',value:'2026-09'}).activeCount);
assert.equal((R.period?R.period(f):P.partnerSalesData.period(f)).multi,false);
assert.equal((R.period?R.period(f):P.partnerSalesData.period(f)).daysObserved,92);
console.log('PASS single periods, contiguous intervals, year boundary, leap day, cancel, draft mode, focus, scoped totals and read-only state');dom.window.close();
