import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{Portal:{}}};vm.runInNewContext(fs.readFileSync('dist/partner-commission.js','utf8'),context);
const {calculate,example}=context.window.Portal.face2faceCommission,rows=example();
for(const [month,approved,confirmed,advance,extra] of [['01',100,20,120000,0],['02',50,60,60000,0],['03',0,40,0,15000],['04',0,10,0,7500]]){
 const c=calculate(rows,'2026-'+month);assert.equal(c.approved,approved);assert.equal(c.confirmed,confirmed);assert.equal(c.advance,advance);assert.equal(c.extra,extra);assert.equal(c.amount,advance+extra);
}
console.log('PASS late confirmations follow approval cohort and monthly totals reconcile');
const april=calculate(rows,'2026-04');assert.equal(april.cohorts[1].remaining,7500);assert.equal(april.cohorts[1].total,60000);assert.equal(calculate(rows,'2026-05').amount,0);
assert.equal(['01','02','03','04','05'].reduce((s,m)=>s+calculate(rows,'2026-'+m).amount,0),202500);
console.log('PASS guaranteed advance, no cross-month debt and no duplicate supplementary entitlement');
const final=rows.map(r=>({...r,confirmedAt:r.confirmedAt||'2026-06-20'}));assert.equal(calculate(final,'2026-06').extra,22500);assert.equal(calculate(final,'2026-07').extra,0);assert.equal(calculate(final,'2026-06').cohorts.reduce((s,c)=>s+c.total,0),225000);
console.log('PASS later confirmations retain original advance and cap total at all approved agreements');
const legacy=[{id:'old',status:'confirmed',registeredAt:'2026-01-01'}];const missing=calculate(legacy,'2026-01');assert.equal(missing.missing.length,1);assert.equal(missing.amount,0);assert.equal(missing.approved,0);
const invalid=calculate([{approvedAt:'2026-02-30',confirmedAt:'2026-03-10',status:'confirmed'},{approvedAt:'2026-02-10',confirmedAt:'2026-01-10',status:'confirmed'}],'2026-02');assert.equal(invalid.confirmed,0);assert.equal(invalid.missing.length,2);
assert.equal(calculate([{approvedAt:'2026-03-01',confirmedAt:'2026-03-02'}],'2026-02').amount,0);
console.log('PASS missing legacy dates and impossible chronology never use registration as approval');
const before=JSON.stringify(rows);calculate(rows,'2026-03');assert.equal(JSON.stringify(rows),before);
const churned=rows.map(r=>({...r,status:'lost_after_start'}));assert.equal(calculate(churned,'2026-04').amount,7500);
console.log('PASS read-only calculation and preserved event history after status changes');
