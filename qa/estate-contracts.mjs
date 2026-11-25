import assert from 'node:assert/strict';
import C from '../dist/estate-contracts.js';
import S from '../dist/estate-contract-scenario.js';
const clone = value => JSON.parse(JSON.stringify(value));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const clock = {asOf:'2026-11-25',receivedAt:'2026-11-25T12:00:00Z'};
const make = () => S.event('trade-t1','trade','tenant-1','2026-01-01','2026-11-30','2026-11-25',2);
const ingest = (state,event,mappings=S.mappings,options=clock) => C.ingest(state,event,mappings,options);
const projection = (state,day='2026-12-01',extra={}) => C.project(state,{partnerId:'estate1',unitId:'a1',asOf:day,now:day+'T12:00:00Z',lastSuccessfulSyncAt:day+'T11:59:00Z',...extra});
const initial = () => ingest(C.empty(),make()).state;
const label = (p,kind,day) => C.describe(p.facts[kind],{at:day,meta:p.metadata[kind]}).label;

test('separate final days and no implicit network data',()=>{
  let state=initial();
  state=ingest(state,S.event('net-t1','network','tenant-1','2026-01-01','2026-12-02','2026-11-25')).state;
  const p=projection(state);
  assert.equal(label(p,'trade','2026-12-01'),'Avslutat 2026-11-30');
  assert.equal(label(p,'network','2026-12-01'),'Uppsagt · gäller till 2026-12-02');
  assert.deepEqual(Object.keys(state),['version','inbox','history','records','quarantine']);
});
test('inclusive last day and Stockholm midnight',()=>{
  const state=initial();
  const before=C.localDate(new Date('2026-11-30T22:59:59Z')),after=C.localDate(new Date('2026-11-30T23:00:00Z'));
  assert.equal(before,'2026-11-30');assert.equal(after,'2026-12-01');
  assert.equal(projection(state,before).facts.trade.status,'termination_scheduled');
  assert.equal(projection(state,after).facts.trade.status,'ended');
});
test('missing data cannot be interpreted as an absent contract',()=>{
  assert.equal(label(projection(initial()),'network','2026-12-01'),'Underlag saknas');
  assert.equal(projection(initial()).metadata.trade.currentContractVerified,false);
});
test('viewing request does not mutate contracts',()=>{
  assert.deepEqual(S.at(1).state.records,S.at(2).state.records);
  assert.equal(S.at(2).occupancy,S.at(1).occupancy);
  assert.match(S.at(2).requests,/Överlapp/);
});
test('future landlord trade does not replace tenant prematurely',()=>{
  assert.match(S.at(3).facts.trade.contractId,/trade-t1/);
  assert.match(S.at(5).facts.trade.contractId,/trade-owner/);
  assert.match(S.at(5).facts.network.contractId,/network-t1/);
});
test('partial confirmations remain independent',()=>{
  assert.match(S.at(6).facts.network.contractId,/network-t1/);
  assert.match(S.at(7).facts.network.contractId,/network-owner/);
  assert.equal(S.at(5).metadata.trade.holderRole,'landlord');
  assert.equal(S.at(5).metadata.network.holderRole,'tenant');
});
test('new tenant order has no effect on occupancy or agreements',()=>{
  assert.deepEqual(S.at(7).facts,S.at(8).facts);
  assert.equal(S.at(7).occupancy,S.at(8).occupancy);
});
test('new tenant replaces both slots only on confirmed start date',()=>{
  assert.match(S.at(10).facts.trade.contractId,/trade-owner/);
  assert.match(S.at(10).facts.network.contractId,/network-owner/);
  assert.match(S.at(11).facts.trade.contractId,/trade-t2/);
  assert.match(S.at(11).facts.network.contractId,/network-t2/);
  assert.equal(S.at(11).state.records.length,6,'History is retained across tenants');
});
test('duplicate event is a no-op including timestamps',()=>{
  const state=initial(),r=ingest(state,make());
  assert.equal(r.outcome,'duplicate');assert.strictEqual(r.state,state);
  assert.equal(r.state.history.length,1);
});
test('older revision cannot overwrite newer data',()=>{
  const old=S.event('trade-t1','trade','tenant-1','2026-01-01',null,'2026-11-24');
  const r=ingest(initial(),old);assert.equal(r.outcome,'ignored');
  assert.equal(r.state.records[0].contract.endsOn,'2026-11-30');
});
test('event-id collision is quarantined without a fact mutation',()=>{
  const e=make();e.contract.endsOn='2026-12-02';const r=ingest(initial(),e);
  assert.equal(r.code,'EVENT_ID_COLLISION');assert.deepEqual(r.state.records,initial().records);
});
test('same revision with different content is rejected',()=>{
  const e=make();e.eventId='new-id';e.contract.endsOn='2026-12-02';
  assert.equal(ingest(initial(),e).code,'REVISION_COLLISION');
});
test('explicit termination withdrawal clears null instead of retaining stale end',()=>{
  const e=S.event('trade-t1','trade','tenant-1','2026-01-01',null,'2026-11-25',3);
  assert.equal(ingest(initial(),e).code,'CORRECTION_REQUIRED');
  e.change={type:'termination_withdrawn',reason:'Fiktivt återtagande bekräftat'};
  const r=ingest(initial(),e);assert.equal(r.outcome,'applied');
  assert.equal(projection(r.state).facts.trade.endsOn,null);assert.equal(r.state.history.length,2);
});
test('invalid calendar date, end-before-start and missing explicit null fail',()=>{
  for(const end of ['2026-02-30','2025-01-01',undefined]) {
    const e=make();e.contract.endsOn=end;assert.equal(ingest(C.empty(),e).code,'SCHEMA_INVALID');
  }
});
test('unmapped status and transport ACK do not become facts',()=>{
  const e=make();e.contract.lifecycle='accepted';assert.equal(ingest(C.empty(),e).code,'STATUS_UNMAPPED');
  const ack=make();ack.contract.verification.evidenceType='transport-ack';
  assert.equal(ingest(C.empty(),ack).code,'BUSINESS_EVIDENCE_MISSING');
});
test('missing, ambiguous and multiple-point mappings are quarantined',()=>{
  assert.equal(ingest(C.empty(),make(),[]).code,'MAPPING_MISSING');
  assert.equal(ingest(C.empty(),make(),[...S.mappings,...S.mappings]).code,'MAPPING_AMBIGUOUS');
  assert.equal(ingest(C.empty(),make(),[...S.mappings,{...S.mappings[0],id:'another',meteringPointId:'000000000000000002'}]).code,'MULTIPLE_METERING_POINTS');
});
test('same metering point linked to another unit is ambiguous',()=>{
  const maps=[...S.mappings,{...S.mappings[0],id:'another',unitId:'a2'}];
  assert.equal(ingest(C.empty(),make(),maps).code,'MAPPING_AMBIGUOUS');
});
test('projection scopes prevent cross-partner mixing (not authentication)',()=>{
  assert.deepEqual(projection(initial(),'2026-12-01',{partnerId:'estate2'}).facts,{});
  assert.deepEqual(projection(initial(),'2026-12-01',{unitId:'a2'}).facts,{});
});
test('trade and network updates keep both kinds regardless of delivery order',()=>{
  const n=S.event('net-t1','network','tenant-1','2026-01-01','2026-12-02','2026-11-25');
  const a=ingest(ingest(C.empty(),make()).state,n).state;
  const b=ingest(ingest(C.empty(),n).state,make()).state;
  assert.deepEqual(projection(a).facts,projection(b).facts);
});
test('stale sync preserves last known facts without refreshing fact timestamps',()=>{
  const p=projection(initial(),'2026-12-01',{lastSuccessfulSyncAt:'2026-11-30T12:00:00Z'});
  assert.equal(p.metadata.trade.stale,true);assert.equal(p.facts.trade.updatedAt,make().contract.updatedAt);
  assert.equal(projection(initial()).metadata.trade.stale,false);
});
test('JSON persisted state can be reloaded and replayed after missed ACK',()=>{
  const state=clone(initial());const r=ingest(state,make());
  assert.equal(r.outcome,'duplicate');assert.deepEqual(projection(state).facts,projection(r.state).facts);
});
test('explicit withdrawal is unknown, not an inferred end date',()=>{
  const e=make();e.eventId='withdrawn';e.sourceRevision='3';e.contract.lifecycle='withdrawn';
  const r=ingest(initial(),e);assert.equal(r.outcome,'applied');
  const p=projection(r.state);assert.equal(p.facts.trade,undefined);assert.equal(p.metadata.trade.quality,'withdrawn');
});
test('overlapping contracts are a conflict, not last arrival wins',()=>{
  const e=S.event('another-trade','trade','tenant-2','2026-11-25',null,'2026-11-25');
  const r=ingest(initial(),e);const p=projection(r.state,'2026-11-25');
  assert.equal(p.metadata.trade.quality,'conflict');assert.equal(p.facts.trade,undefined);
});
test('future withdrawn contract is never selected',()=>{
  let state=S.at(3).state;
  const e=S.event('trade-owner','trade','landlord','2026-12-01',null,'2026-11-29',2);e.contract.lifecycle='withdrawn';
  state=ingest(state,e,S.mappings,{asOf:'2026-11-29',receivedAt:'2026-11-29T12:00:00Z'}).state;
  assert.match(projection(state,'2026-11-30').facts.trade.contractId,/trade-t1/);
  assert.equal(projection(state).facts.trade,undefined);
});
test('corrected mapping allows explicit replay, retaining quarantine audit',()=>{
  const rejected=ingest(C.empty(),make(),[]);
  const replay=ingest(rejected.state,make(),S.mappings,{...clock,replayQuarantined:true});
  assert.equal(replay.outcome,'applied');assert.equal(replay.state.inbox.length,1);
  assert.equal(replay.state.quarantine.length,1);assert.equal(replay.state.history.length,1);
});
test('untrusted prototype keys cannot become projection/mapping keys',()=>{
  assert.throws(()=>projection(initial(),'2026-12-01',{partnerId:'__proto__'}));
  assert.equal(ingest(C.empty(),make(),[{...S.mappings[0],unitId:'constructor'}]).code,'MAPPING_MISSING');
});
test('mapping expiry blocks later ingestion and identity changes are explicit',()=>{
  assert.equal(ingest(C.empty(),make(),[{...S.mappings[0],validTo:'2026-11-24'}]).code,'MAPPING_MISSING');
  const e=make();e.sourceRevision='3';e.eventId='identity-change';e.contract.sourceContractId='different';
  assert.equal(ingest(initial(),e).code,'IDENTITY_CHANGED');
});
test('clock restart reprojects without creating business commands',()=>{
  const s=S.at(10).state,before=JSON.stringify(s),p=projection(s,'2026-12-15');
  assert.equal(JSON.stringify(s),before);assert.match(p.facts.trade.contractId,/trade-t2/);
  assert.equal(p.facts.trade.updatedAt,'2026-12-10T10:00:00Z');
});
test('strict descriptor and explicitly labelled legacy compatibility',()=>{
  const f={contractId:'legacy',status:'active',endsOn:'2026-11-30',updatedAt:'2026-11-25T10:00:00Z'};
  assert.equal(C.describe(f,{at:'2026-11-25'}).label,'Underlag saknas');
  assert.equal(C.describe(f,{at:'2026-11-25',legacy:true}).source,'legacy');
  assert.equal(C.describe({...f,endsOn:null},{at:'2026-11-25',meta:{quality:'missing'}}).label,'Underlag saknas');
  assert.equal(C.describe({...f,status:'nonsense'},{at:'2026-11-25',legacy:true}).label,'Underlag saknas');
});
test('retroactive reopening requires correction and timestamp regression fails',()=>{
  const e=S.event('trade-t1','trade','tenant-1','2026-01-01',null,'2026-12-03',3);
  e.change={type:'termination_withdrawn',reason:'Test'};
  const options={asOf:'2026-12-03',receivedAt:'2026-12-03T12:00:00Z'};
  assert.equal(ingest(initial(),e,S.mappings,options).code,'CORRECTION_REQUIRED');
  e.change={type:'correction',reason:'Källans verifierade rättning'};
  assert.equal(ingest(initial(),e,S.mappings,options).outcome,'applied');
  e.contract.updatedAt='2026-01-01T00:00:00Z';assert.equal(ingest(initial(),e,S.mappings,options).code,'TIME_REGRESSION');
});
test('cancelled future agreement leaves the existing agreement intact',()=>{
  const old=S.event('old','trade','tenant-1','2026-01-01',null,'2026-11-25');
  let state=ingest(C.empty(),old).state;
  const future=S.event('future','trade','tenant-2','2026-12-15',null,'2026-11-25');
  state=ingest(state,future).state;
  const cancel=clone(future);cancel.eventId='future-cancel';cancel.sourceRevision='2';cancel.contract.lifecycle='cancelled';
  state=ingest(state,cancel).state;
  assert.equal(projection(state,'2026-12-15').facts.trade.contractId,C.contractId(old));
});
test('invalid envelope is quarantined rather than throwing',()=>{
  assert.equal(ingest(C.empty(),null).code,'SCHEMA_INVALID');
  const e=make();e.sourceRevision=2;assert.equal(ingest(C.empty(),e).code,'SCHEMA_INVALID');
});
console.log(`${passed} offline contract tests passed; no system connections or production authorization tested.`);
