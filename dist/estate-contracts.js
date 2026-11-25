/* Pure contract projection shared by the portal and offline adapter tests.
 * No transport, authentication or production storage is implemented here. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EstateContracts = factory();
})(typeof globalThis === 'object' ? globalThis : this, () => {
  'use strict';
  const kinds = ['trade', 'network'];
  const lifecycles = ['active', 'termination_scheduled', 'ended', 'withdrawn', 'cancelled'];
  const copy = value => JSON.parse(JSON.stringify(value));
  const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 256;
  const safeKey = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(v) && !['constructor','prototype','__proto__'].includes(v);
  const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
  const timestamp = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v) && date(v.slice(0,10)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v.replace(/Z$/, v.includes('.') ? 'Z' : '.000Z');
  const localDate = (instant = new Date()) => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(instant);
  const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]])) : v);
  const key = event => JSON.stringify([event.sourceSystem,event.sourceEnvironment,event.eventId]);
  const recordKey = event => JSON.stringify([event.sourceSystem,event.sourceEnvironment,event.sourceRecordId]);
  const contractId = event => 'contract:' + encodeURIComponent(JSON.stringify([event.sourceSystem,event.sourceEnvironment,event.contract.kind,event.contract.sourceContractId]));
  const empty = () => ({version:1, inbox:[], history:[], records:[], quarantine:[]});

  function validate(event) {
    if (!event || event.schemaVersion !== '1.0' || event.eventType !== 'contract.snapshot' ||
        !['eventId','sourceSystem','sourceEnvironment','sourceRecordId','mappingRef'].every(k => text(event[k])) ||
        (typeof event.sourceRevision !== 'string' || !/^\d{1,20}$/.test(event.sourceRevision)) || !timestamp(event.occurredAt)) return 'SCHEMA_INVALID';
    const c = event.contract;
    if (!c || !kinds.includes(c.kind) || !text(c.sourceContractId) || !/^\d{18}$/.test(c.meteringPointId || '') ||
        !date(c.startsOn) || !(c.endsOn === null || date(c.endsOn)) ||
        (c.endsOn !== null && c.endsOn < c.startsOn) || !timestamp(c.updatedAt) || !timestamp(c.sourceUpdatedAt) ||
        !text(c.holderRef) || !['tenant','landlord'].includes(c.holderRole) || !text(c.payerRef)) return 'SCHEMA_INVALID';
    if (!lifecycles.includes(c.lifecycle)) return 'STATUS_UNMAPPED';
    if ((c.lifecycle === 'active' && c.endsOn !== null) ||
        (['termination_scheduled','ended'].includes(c.lifecycle) && c.endsOn === null) ||
        (c.lifecycle === 'ended' && c.endsOn >= localDate(new Date(event.occurredAt)) )) return 'STATUS_DATE_CONFLICT';
    if (c.lifecycle === 'cancelled' && c.startsOn <= localDate(new Date(event.occurredAt))) return 'STATUS_DATE_CONFLICT';
    const v = c.verification;
    if (!v || v.state !== 'verified' || v.evidenceType !== 'business-confirmation' ||
        !text(v.originSystem) || !text(v.originRecordId) || !timestamp(v.verifiedAt)) return 'BUSINESS_EVIDENCE_MISSING';
    return null;
  }

  // Caller supplies a trusted mapping catalogue. This resolver is not an access-control boundary.
  function resolve(event, mappings, asOf) {
    const c = event.contract;
    const candidates = mappings.filter(m => m.id === event.mappingRef && m.state === 'verified' &&
      m.sourceSystem === event.sourceSystem && m.sourceEnvironment === event.sourceEnvironment &&
      m.meteringPointId === c.meteringPointId && safeKey(m.partnerId) && safeKey(m.unitId) &&
      date(m.validFrom) && m.validFrom <= asOf && (m.validTo === null || (date(m.validTo) && asOf <= m.validTo)));
    if (!candidates.length) return {code:'MAPPING_MISSING'};
    if (candidates.length !== 1) return {code:'MAPPING_AMBIGUOUS'};
    const mapping = candidates[0];
    const overlaps = mappings.filter(m => m.state === 'verified' && m.partnerId === mapping.partnerId &&
      m.unitId === mapping.unitId && date(m.validFrom) && m.validFrom <= asOf &&
      (m.validTo === null || (date(m.validTo) && asOf <= m.validTo)));
    if (new Set(overlaps.map(m => m.meteringPointId)).size > 1) return {code:'MULTIPLE_METERING_POINTS'};
    // A point cannot be linked to two units, even if the incoming mappingRef disambiguates one row.
    if (mappings.some(m => m !== mapping && m.state === 'verified' && m.meteringPointId === mapping.meteringPointId &&
        date(m.validFrom) && m.validFrom <= asOf && (m.validTo === null || (date(m.validTo) && asOf <= m.validTo)) &&
        (m.unitId !== mapping.unitId || m.partnerId !== mapping.partnerId))) return {code:'MAPPING_AMBIGUOUS'};
    return {mapping};
  }

  // A successful result is a NEW value. The host must persist it atomically before acknowledging.
  // Quarantined envelopes can be replayed explicitly after correcting the trusted mapping catalogue.
  function ingest(state, event, mappings, {asOf, receivedAt, replayQuarantined = false} = {}) {
    if (!date(asOf) || !timestamp(receivedAt)) throw new Error('A valid test/host clock is required');
    const next = copy(state), identity = key(event || {}), fingerprint = stable(event);
    const previous = next.inbox.find(row => row.key === identity);
    const reject = code => {
      next.quarantine.push({key:identity,code,event:copy(event ?? null),receivedAt});
      if (!previous) next.inbox.push({key:identity,fingerprint,outcome:'quarantined',receivedAt});
      return {state:next,outcome:'quarantined',code};
    };
    if (previous && previous.fingerprint !== fingerprint) return reject('EVENT_ID_COLLISION');
    if (previous && !(replayQuarantined && previous.outcome === 'quarantined')) return {state,outcome:'duplicate'};
    const invalid = validate(event);
    if (invalid) return reject(invalid);
    const resolved = resolve(event, mappings, asOf);
    if (resolved.code) return reject(resolved.code);
    const rkey = recordKey(event), old = next.records.find(r => r.recordKey === rkey), c = event.contract;
    const id = contractId(event), m = resolved.mapping;
    if (old && (old.contractId !== id || old.partnerId !== m.partnerId || old.unitId !== m.unitId || old.meteringPointId !== c.meteringPointId)) return reject('IDENTITY_CHANGED');
    const finish = outcome => {
      if (previous) Object.assign(previous,{outcome,receivedAt});
      else next.inbox.push({key:identity,fingerprint,outcome,receivedAt});
      return {state:next,outcome};
    };
    if (old && BigInt(event.sourceRevision) < BigInt(old.sourceRevision)) return finish('ignored');
    if (old && BigInt(event.sourceRevision) === BigInt(old.sourceRevision)) {
      if (stable(c) !== stable(old.contract)) return reject('REVISION_COLLISION');
      return finish('unchanged');
    }
    if (old && (Date.parse(c.updatedAt) < Date.parse(old.contract.updatedAt) || Date.parse(c.sourceUpdatedAt) < Date.parse(old.contract.sourceUpdatedAt))) return reject('TIME_REGRESSION');
    const correction = event.change?.type === 'correction' && text(event.change.reason);
    if (old && ['withdrawn','cancelled'].includes(old.contract.lifecycle) && !correction) return reject('CORRECTION_REQUIRED');
    if (old && old.contract.endsOn && (c.endsOn === null || c.endsOn > old.contract.endsOn)) {
      const retract = event.change?.type === 'termination_withdrawn' && text(event.change.reason) && asOf <= old.contract.endsOn && c.endsOn === null;
      if (!correction && !retract) return reject('CORRECTION_REQUIRED');
    }
    const row = {recordKey:rkey,contractId:id,partnerId:m.partnerId,unitId:m.unitId,meteringPointId:c.meteringPointId,
      mappingRef:m.id,sourceRevision:event.sourceRevision,contract:copy(c),receivedAt};
    next.records = next.records.filter(r => r.recordKey !== rkey).concat(row);
    next.history.push({event:copy(event),contractId:id,mappingRef:m.id,receivedAt});
    return finish('applied');
  }

  function project(state, {partnerId, unitId, asOf, now, lastSuccessfulSyncAt = null, staleAfterMs = 15*60*1000}) {
    if (!safeKey(partnerId) || !safeKey(unitId) || !date(asOf) || !timestamp(now)) throw new Error('Invalid projection scope or clock');
    const facts = {}, metadata = {};
    for (const kind of kinds) {
      const rows = state.records.filter(r => r.partnerId === partnerId && r.unitId === unitId && r.contract.kind === kind && r.contract.startsOn <= asOf);
      const current = rows.filter(r => !['withdrawn','cancelled'].includes(r.contract.lifecycle) && (!r.contract.endsOn || r.contract.endsOn >= asOf));
      const ended = rows.filter(r => !['withdrawn','cancelled'].includes(r.contract.lifecycle) && r.contract.endsOn && r.contract.endsOn < asOf)
        .sort((a,b) => b.contract.endsOn.localeCompare(a.contract.endsOn));
      const withdrawn = rows.filter(r => r.contract.lifecycle === 'withdrawn');
      const meta = metadata[kind] = {quality:'missing',projectedAt:now,lastSuccessfulSyncAt,originSystem:null};
      // Never silently fall back to a previous contract after an explicit withdrawal.
      if (current.length > 1 || (current.length === 0 && ended.length > 1 && ended[0].contract.endsOn === ended[1].contract.endsOn)) {meta.quality='conflict';continue;}
      const chosen = current[0] || ended[0];
      if (withdrawn.some(r => !chosen || r.contract.startsOn >= chosen.contract.startsOn)) {meta.quality='withdrawn';continue;}
      if (!chosen) continue;
      const c = chosen.contract;
      facts[kind] = {contractId:chosen.contractId,status:c.endsOn ? (asOf > c.endsOn ? 'ended' : 'termination_scheduled') : 'active',endsOn:c.endsOn,updatedAt:c.updatedAt};
      Object.assign(meta,{quality:'verified',originSystem:c.verification.originSystem,verificationRef:c.verification.originRecordId,
        sourceUpdatedAt:c.sourceUpdatedAt,holderRole:c.holderRole,payerRef:c.payerRef,startsOn:c.startsOn,
        currentContractVerified:!!current.length,
        stale:!timestamp(lastSuccessfulSyncAt) || Date.parse(now)-Date.parse(lastSuccessfulSyncAt)>staleAfterMs});
    }
    return {facts,metadata};
  }

  function describe(fact, {at, meta = {}, legacy = false} = {}) {
    const missing = {label:'Underlag saknas',source:'unknown'};
    if (meta.quality === 'conflict') return {...missing,label:'Motstridigt avtalsunderlag – behöver verifieras'};
    if (meta.quality === 'withdrawn') return {...missing,label:'Avtalsunderlaget har återkallats – behöver verifieras'};
    if (meta.quality && meta.quality !== 'verified') return missing;
    if (!date(at) || !fact || !text(fact.contractId) || !timestamp(fact.updatedAt)) return missing;
    if (!['active','termination_scheduled','ended'].includes(fact.status)) return missing;
    const end = fact.endsOn;
    if (!(end === null || date(end)) || (fact.status !== 'active' && !date(end)) ||
        (!legacy && fact.status === 'active' && end !== null) || (fact.status === 'ended' && at <= end)) return missing;
    if (meta.startsOn && (!date(meta.startsOn) || meta.startsOn > at)) return missing;
    const label = end ? (at > end ? 'Avslutat '+end : 'Uppsagt · gäller till '+end) : 'Aktivt avtal';
    return {label,source:legacy?'legacy':'facts',contractId:fact.contractId,updatedAt:fact.updatedAt,stale:meta.stale === true};
  }

  return {empty,ingest,project,describe,date,timestamp,localDate,contractId,validate};
});
