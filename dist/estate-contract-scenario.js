/* Explicit, isolated fictional example. Nothing is written to Portal.state or sent. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./estate-contracts.js'));
  else root.EstateContractScenario = factory(root.EstateContracts);
})(typeof globalThis === 'object' ? globalThis : this, C => {
  'use strict';
  const mappings = [{id:'map-test-a1',state:'verified',sourceSystem:'dynamics365',sourceEnvironment:'test',
    meteringPointId:'000000000000000001',partnerId:'estate1',unitId:'a1',validFrom:'2026-01-01',validTo:null}];
  function event(id, kind, holder, startsOn, endsOn, day, revision = 1) {
    const time=day+'T10:00:00Z';
    return {schemaVersion:'1.0',eventId:`${id}-r${revision}`,eventType:'contract.snapshot',sourceSystem:'dynamics365',sourceEnvironment:'test',
      sourceRecordId:id,sourceRevision:String(revision),occurredAt:time,mappingRef:'map-test-a1',
      contract:{sourceContractId:id,kind,meteringPointId:'000000000000000001',lifecycle:endsOn?'termination_scheduled':'active',
        startsOn,endsOn,holderRef:holder,holderRole:holder==='landlord'?'landlord':'tenant',payerRef:holder,
        sourceUpdatedAt:time,updatedAt:time,verification:{state:'verified',originSystem:kind==='network'?'nätägare-test-via-crm':'gazelle-test-via-crm',
          originRecordId:'business-'+id+'-'+revision,verifiedAt:time,evidenceType:'business-confirmation'}}};
  }
  const steps = [
    {day:'2026-11-24',title:'Hyresgästens avtal är aktiva',occupancy:'Bebodd enligt förvaltaren',requests:'Inga beställningar.',events:[
      event('trade-t1','trade','tenant-1','2026-01-01',null,'2026-11-24'),event('network-t1','network','tenant-1','2026-01-01',null,'2026-11-24')]},
    {day:'2026-11-25',title:'Olika slutdatum bekräftas',requests:'Ingen visningsel startas av uppsägningen.',events:[
      event('trade-t1','trade','tenant-1','2026-01-01','2026-11-30','2026-11-25',2),event('network-t1','network','tenant-1','2026-01-01','2026-12-02','2026-11-25',2)]},
    {day:'2026-11-26',title:'Visningsel beställs från 1 december',requests:'Visningsel beställd från 1 december. Överlapp med hyresgästens nätavtal 1–2 december måste hanteras. Inga avtalsfakta ändras.',events:[]},
    {day:'2026-11-28',title:'Ägarens elhandel bekräftas i förväg',requests:'Visningsel: elhandel bekräftad från 1 december; nät inväntar besked. Fortsatt inkoppling är endast önskad.',events:[
      event('trade-owner','trade','landlord','2026-12-01',null,'2026-11-28')]},
    {day:'2026-11-30',title:'Hyresgästens sista handelsdag',events:[]},
    {day:'2026-12-01',title:'Utflyttning bekräftas separat',occupancy:'Ledig från 1 december enligt förvaltaren',events:[]},
    {day:'2026-12-02',title:'Nätägaren bekräftar 3 december',requests:'Visningsel: handel från 1 december, nät från 3 december bekräftat. Fortsatt inkoppling bekräftad i ett separat nätbesked.',events:[
      event('network-owner','network','landlord','2026-12-03',null,'2026-12-02')]},
    {day:'2026-12-03',title:'Båda ägaravtalen gäller',requests:'Visningsel: båda avtalen gäller nu. Betalare är fastighetsägaren enligt separata bekräftelser.',events:[]},
    {day:'2026-12-05',title:'Ny hyresgäst anmäls till 15 december',requests:'Inflyttning beställd till 15 december. Ägarens avtal gäller fortfarande; ingen fysisk inflyttning är bekräftad.',events:[]},
    {day:'2026-12-10',title:'Ny elhandel bekräftas',requests:'Inflyttning: handel från 15 december bekräftad; nät inväntar besked.',events:[
      event('trade-owner','trade','landlord','2026-12-01','2026-12-14','2026-12-10',2),event('trade-t2','trade','tenant-2','2026-12-15',null,'2026-12-10')]},
    {day:'2026-12-12',title:'Nytt nätavtal bekräftas',requests:'Inflyttning: båda avtalen bekräftade från 15 december. Ägaravtalens sista dag är 14 december.',events:[
      event('network-owner','network','landlord','2026-12-03','2026-12-14','2026-12-12',2),event('network-t2','network','tenant-2','2026-12-15',null,'2026-12-12')]},
    {day:'2026-12-15',title:'Ny hyresgäst flyttar in',occupancy:'Bebodd från 15 december enligt förvaltaren',requests:'De nya avtalen gäller. Faktisk inflyttning har bekräftats separat av förvaltaren.',events:[]}
  ];
  function at(index) {
    if (!Number.isInteger(index) || index < 0 || index >= steps.length) throw new Error('Invalid scenario step');
    let state=C.empty(),occupancy,requests;
    for (const step of steps.slice(0,index+1)) {
      for (const e of step.events) {
        const result=C.ingest(state,e,mappings,{asOf:step.day,receivedAt:step.day+'T10:01:00Z'});
        if(result.outcome!=='applied')throw new Error(result.code || result.outcome);
        state=result.state;
      }
      occupancy=step.occupancy || occupancy;requests=step.requests || requests;
    }
    const step=steps[index], now=step.day+'T12:00:00Z';
    return {...step,occupancy,requests,state,...C.project(state,{partnerId:'estate1',unitId:'a1',asOf:step.day,now,lastSuccessfulSyncAt:now})};
  }
  return {steps,mappings,event,at};
});
