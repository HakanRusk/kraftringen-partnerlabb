import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/partner-setup.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, crypto: webcrypto });
vm.runInContext(source, context);
const H = context.window.PartnerSetupRegistry;
const plain = value => JSON.parse(JSON.stringify(value));
const basePartners = () => [
  { id: 'syd', name: 'Savera', type: 'sales', audience: 'business', salesAudiences: ['business'] },
  { id: 'vast', name: 'Face2face', type: 'field', audience: 'consumer', salesAudiences: ['consumer'] },
  { id: 'estate1', name: 'Exempelfastigheter AB', type: 'property', audience: 'movein' },
];
function fixture() {
  const registry = basePartners();
  const partners = Object.fromEntries(registry.map(partner => [partner.id, partner.name]));
  const P = {
    partnerRegistry: registry,
    partners,
    state: {
      records: [{ id: 'old-record', company: 'Fiktiv kund', partner: 'syd' }],
      offers: [{ id: 'old-offer' }],
      moveins: [{ id: 'old-movein', partner: 'estate1', serviceRequested: true }],
      consumerSales: [{ id: 'old-consumer', partner: 'vast', segment: 'consumer' }],
      partnerProfiles: {}
    },
    role: 'internal',
    getPartner: id => registry.find(partner => partner.id === id),
    save: () => true,
    e: String,
    icon: () => '',
  };
  P.syncPartnerRegistry = () => H.apply(registry, partners, P.state.partnerProfiles);
  H.hydrate({}, registry, partners);
  H.init(P);
  return P;
}

let checks = 0;
function test(name, run) { run(); checks++; console.log(`PASS ${name}`); }

test('new B2B, B2C and mixed partners persist segment arrays without manufacturing business results', () => {
  const P = fixture();
  const originalRecords = JSON.stringify(P.state.records);
  const originalOffers = JSON.stringify(P.state.offers);
  for (const [name, salesAudiences] of [['B2B Exempel', ['business']], ['B2C Exempel', ['consumer']], ['Båda Exempel', ['business', 'consumer']]]) {
    const result = P.partnerSetup.saveProfile({ name, salesAudiences });
    assert.equal(result.ok, true);
    assert.match(result.id, /^partner-[a-z0-9-]+$/);
    assert.deepEqual(plain(P.getPartner(result.id).salesAudiences), salesAudiences);
    assert.equal(P.getPartner(result.id).audience, salesAudiences.length === 2 ? 'mixed' : salesAudiences[0]);
    assert.equal(P.partners[result.id], name);
  }
  assert.equal(JSON.stringify(P.state.records), originalRecords);
  assert.equal(JSON.stringify(P.state.offers), originalOffers);
  assert.equal(P.state.commercial, undefined);
});

test('property and employee channels persist their own type with no sales segment or manufactured results', () => {
  const P = fixture();
  const existingData = JSON.stringify({ records: P.state.records, offers: P.state.offers, moveins: P.state.moveins, consumerSales: P.state.consumerSales });
  for (const [partnerType, name, audience] of [['property', 'Nytt fastighetsbolag', 'movein'], ['employee', 'Arbetsgivare med personalavtal', 'employee']]) {
    const result = P.partnerSetup.saveProfile({ name, partnerType, salesAudiences: ['business', 'consumer'] });
    assert.equal(result.ok, true);
    assert.equal(P.getPartner(result.id).type, partnerType);
    assert.equal(P.getPartner(result.id).audience, audience);
    assert.deepEqual(plain(P.getPartner(result.id).salesAudiences), []);
    assert.equal(P.partners[result.id], name);
    assert.equal(P.partnerSetup.canEdit(result.id), true);
  }
  assert.equal(JSON.stringify({ records: P.state.records, offers: P.state.offers, moveins: P.state.moveins, consumerSales: P.state.consumerSales }), existingData);
  assert.equal(P.state.commercial, undefined);
});

test('explicit sales creation retains all three segment choices and omitted partner type remains compatible', () => {
  const P = fixture();
  for (const [name, salesAudiences] of [['Explicit B2B', ['business']], ['Explicit B2C', ['consumer']], ['Explicit both', ['business', 'consumer']]]) {
    const result = P.partnerSetup.saveProfile({ name, partnerType: 'sales', salesAudiences });
    assert.equal(result.ok, true);
    assert.equal(P.getPartner(result.id).type, 'sales');
    assert.deepEqual(plain(P.getPartner(result.id).salesAudiences), salesAudiences);
  }
  const legacyCall = P.partnerSetup.saveProfile({ name: 'Legacy caller', salesAudiences: ['business'] });
  assert.equal(P.getPartner(legacyCall.id).type, 'sales');
});

test('all channel types and renamed seed property reload without changing stored customer or service data', () => {
  const P = fixture();
  const property = P.partnerSetup.saveProfile({ name: 'Ny fastighet', partnerType: 'property' });
  const employee = P.partnerSetup.saveProfile({ name: 'Ny arbetsgivare', partnerType: 'employee' });
  assert.equal(P.partnerSetup.saveProfile({ name: 'Exempelfastigheter Nytt AB' }, 'estate1').ok, true);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Ny fastighet ändrad' }, property.id).ok, true);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Ny arbetsgivare ändrad' }, employee.id).ok, true);
  const data = JSON.stringify({ records: P.state.records, moveins: P.state.moveins, consumerSales: P.state.consumerSales });
  const reloaded = fixture();
  reloaded.state.partnerProfiles = H.hydrate(plain(P.state.partnerProfiles), reloaded.partnerRegistry, reloaded.partners);
  assert.equal(reloaded.getPartner('estate1').name, 'Exempelfastigheter Nytt AB');
  assert.equal(reloaded.getPartner('estate1').type, 'property');
  assert.equal(reloaded.getPartner(property.id).name, 'Ny fastighet ändrad');
  assert.equal(reloaded.getPartner(employee.id).name, 'Ny arbetsgivare ändrad');
  assert.equal(reloaded.getPartner(employee.id).audience, 'employee');
  assert.equal(JSON.stringify({ records: reloaded.state.records, moveins: reloaded.state.moveins, consumerSales: reloaded.state.consumerSales }), data);
});

test('editing never reclassifies existing sales, field, property or employee history', () => {
  const P = fixture();
  const employee = P.partnerSetup.saveProfile({ name: 'Arbetsgivare', partnerType: 'employee' });
  const before = plain(P.state);
  for (const [id, partnerType] of [['syd', 'property'], ['vast', 'employee'], ['estate1', 'sales'], [employee.id, 'property']]) {
    const result = P.partnerSetup.saveProfile({ name: 'Försök ändra kanal', partnerType, salesAudiences: ['business'] }, id);
    assert.equal(result.ok, false);
    assert.equal(result.field, 'partnerType');
  }
  assert.deepEqual(plain(P.state), before);
  assert.equal(P.getPartner('syd').type, 'sales');
  assert.equal(P.getPartner('vast').type, 'field');
  assert.equal(P.getPartner('estate1').type, 'property');
  assert.equal(P.getPartner(employee.id).type, 'employee');
});

test('renaming a seeded partner and freeing its former name survives profile insertion order on reload', () => {
  const P = fixture();
  const added = P.partnerSetup.saveProfile({ name: 'Framtida partner', salesAudiences: ['consumer'] });
  assert.equal(P.partnerSetup.saveProfile({ name: 'Savera Nytt', salesAudiences: ['business', 'consumer'] }, 'syd').ok, true);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Savera', salesAudiences: ['consumer'] }, added.id).ok, true);
  const reloaded = fixture();
  reloaded.state.partnerProfiles = H.hydrate(JSON.parse(JSON.stringify(P.state.partnerProfiles)), reloaded.partnerRegistry, reloaded.partners);
  assert.equal(reloaded.getPartner('syd').name, 'Savera Nytt');
  assert.equal(reloaded.getPartner(added.id).name, 'Savera');
  assert.equal(reloaded.partners[added.id], 'Savera');
  assert.deepEqual(plain(reloaded.getPartner('syd').salesAudiences), ['business', 'consumer']);
});

test('duplicate names are rejected across case, whitespace and Unicode compatibility forms', () => {
  const P = fixture();
  for (const name of [' savera ', 'SAVERA', 'Ｓａｖｅｒａ']) {
    const result = P.partnerSetup.saveProfile({ name, salesAudiences: ['business'] });
    assert.equal(result.ok, false);
    assert.equal(result.field, 'name');
  }
  assert.equal(P.partnerRegistry.length, 3);
  assert.deepEqual(P.state.partnerProfiles, {});
});

test('existing Face2face channel type is preserved while changing its selected segments', () => {
  const P = fixture();
  assert.equal(P.partnerSetup.saveProfile({ name: 'Face2face', salesAudiences: ['consumer', 'business', 'invalid'] }, 'vast').ok, true);
  assert.equal(P.getPartner('vast').type, 'field');
  assert.equal(P.getPartner('vast').audience, 'mixed');
  assert.deepEqual(plain(P.getPartner('vast').salesAudiences), ['business', 'consumer']);
});

test('storage failure rolls back both new and edited profiles and keeps registry identity', () => {
  const P = fixture();
  const previousProfiles = P.state.partnerProfiles;
  const previousRegistry = P.partnerRegistry;
  const previousNames = P.partners;
  P.save = () => false;
  assert.equal(P.partnerSetup.saveProfile({ name: 'Osparad partner', salesAudiences: ['business'] }).ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Osparad Savera', salesAudiences: ['consumer'] }, 'syd').ok, false);
  assert.equal(P.state.partnerProfiles, previousProfiles);
  assert.equal(P.partnerRegistry, previousRegistry);
  assert.equal(P.partners, previousNames);
  assert.equal(P.getPartner('syd').name, 'Savera');
  assert.equal(P.partnerRegistry.length, 3);
  P.save = () => { throw new Error('storage failure'); };
  assert.equal(P.partnerSetup.saveProfile({ name: 'Exception partner', salesAudiences: ['business'] }).ok, false);
  assert.equal(P.state.partnerProfiles, previousProfiles);
});

test('property and employee storage failures preserve existing profiles, containers and source history', () => {
  const P = fixture();
  const employee = P.partnerSetup.saveProfile({ name: 'Sparad arbetsgivare', partnerType: 'employee' });
  const beforeState = JSON.stringify(P.state);
  const beforeRegistry = JSON.stringify(P.partnerRegistry);
  const previousProfiles = P.state.partnerProfiles;
  P.save = () => false;
  for (const [payload, id] of [
    [{ name: 'Osparat fastighetsbolag', partnerType: 'property' }, undefined],
    [{ name: 'Osparat personalavtal', partnerType: 'employee' }, undefined],
    [{ name: 'Osparad fastighet' }, 'estate1'],
    [{ name: 'Osparad arbetsgivare' }, employee.id]
  ]) assert.equal(P.partnerSetup.saveProfile(payload, id).ok, false);
  assert.equal(P.state.partnerProfiles, previousProfiles);
  assert.equal(JSON.stringify(P.state), beforeState);
  assert.equal(JSON.stringify(P.partnerRegistry), beforeRegistry);
  delete P.state.partnerProfiles;
  assert.equal(P.partnerSetup.saveProfile({ name: 'Missing profile property', partnerType: 'property' }).ok, false);
  assert.equal(own(P.state, 'partnerProfiles'), false);
});

test('reset removes local partner configuration and restores seeded partners in the same shared containers', () => {
  const P = fixture();
  const registry = P.partnerRegistry;
  const names = P.partners;
  const added = P.partnerSetup.saveProfile({ name: 'Ny partner', salesAudiences: ['consumer'] });
  P.partnerSetup.saveProfile({ name: 'Savera ändrad', salesAudiences: ['business', 'consumer'] }, 'syd');
  P.state.partnerProfiles = {};
  P.syncPartnerRegistry();
  assert.equal(P.partnerRegistry, registry);
  assert.equal(P.partners, names);
  assert.equal(P.getPartner('syd').name, 'Savera');
  assert.deepEqual(plain(P.getPartner('syd').salesAudiences), ['business']);
  assert.equal(P.getPartner(added.id), undefined);
  assert.equal(added.id in names, false);
});

test('malformed saved profiles cannot convert property partners or add unsupported segments or unsafe keys', () => {
  const P = fixture();
  const malicious = JSON.parse('{"estate1":{"name":"Bostäder ändrade","type":"sales","salesAudiences":["business"]},"constructor":{"name":"Unsafe","type":"sales","salesAudiences":["consumer"]},"new-a":{"name":"Wrong","type":"sales","salesAudiences":["fiber"]},"new-b":{"name":"Good","type":"sales","salesAudiences":["consumer"]},"new-c":{"name":"Good","type":"sales","salesAudiences":["business"]}}');
  const profiles = H.hydrate(malicious, P.partnerRegistry, P.partners);
  assert.deepEqual(plain(profiles), {});
  assert.equal(P.getPartner('estate1').type, 'property');
  assert.equal(P.getPartner('estate1').name, 'Exempelfastigheter AB');
  assert.equal(own(P.partners, 'constructor'), false);
});

test('saved channel profiles reject seeded type conversion and normalize non-sales audiences', () => {
  const P = fixture();
  const input = {
    syd: { name: 'Omklassificerad Savera', type: 'employee', salesAudiences: [] },
    vast: { name: 'Omklassificerad Face2face', type: 'property', salesAudiences: [] },
    estate1: { name: 'Fastighetens nya namn', type: 'property', salesAudiences: ['consumer'], audience: 'consumer' },
    'new-property': { name: 'Fastighetsexempel', type: 'property', salesAudiences: ['business'] },
    'new-employee': { name: 'Arbetsgivarexempel', type: 'employee', salesAudiences: ['business', 'consumer'] },
    'new-wrong': { name: 'Okänd kanal', type: 'affiliate', salesAudiences: ['business'] }
  };
  const profiles = H.hydrate(input, P.partnerRegistry, P.partners);
  assert.deepEqual(Object.keys(profiles).sort(), ['estate1', 'new-employee', 'new-property']);
  assert.equal(P.getPartner('syd').name, 'Savera');
  assert.equal(P.getPartner('vast').name, 'Face2face');
  assert.equal(P.getPartner('estate1').name, 'Fastighetens nya namn');
  assert.equal(P.getPartner('estate1').audience, 'movein');
  assert.equal(P.getPartner('new-employee').audience, 'employee');
  assert.deepEqual(plain(P.getPartner('new-employee').salesAudiences), []);
  assert.deepEqual(plain(P.getPartner('new-property').salesAudiences), []);
});

test('duplicate names across channel types are rejected and conflicting stored profiles do not depend on order', () => {
  const P = fixture();
  const added = P.partnerSetup.saveProfile({ name: 'Gemensamt namn', partnerType: 'property' });
  assert.equal(P.partnerSetup.saveProfile({ name: ' gemensamt NAMN ', partnerType: 'employee' }).ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Gemensamt namn', partnerType: 'sales', salesAudiences: ['consumer'] }).ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Exempelfastigheter Nytt AB' }, 'estate1').ok, true);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Exempelfastigheter AB' }, added.id).ok, true);
  const reloaded = fixture();
  reloaded.state.partnerProfiles = H.hydrate(plain(P.state.partnerProfiles), reloaded.partnerRegistry, reloaded.partners);
  assert.equal(reloaded.getPartner('estate1').name, 'Exempelfastigheter Nytt AB');
  assert.equal(reloaded.getPartner(added.id).name, 'Exempelfastigheter AB');
});

test('property renaming is allowed while invalid names, missing sales segment and partner-view mutations are rejected', () => {
  const P = fixture();
  assert.equal(P.partnerSetup.saveProfile({ name: 'Bostäder' }, 'estate1').ok, true);
  assert.equal(P.getPartner('estate1').name, 'Bostäder');
  assert.equal(P.getPartner('estate1').type, 'property');
  assert.deepEqual(plain(P.getPartner('estate1').salesAudiences), []);
  for (const name of ['', '   ', 'x'.repeat(91)]) assert.equal(P.partnerSetup.saveProfile({ name, salesAudiences: ['business'] }).ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Giltigt namn', salesAudiences: [] }).ok, false);
  P.role = 'partner';
  assert.equal(P.partnerSetup.saveProfile({ name: 'Otillåten demovy', salesAudiences: ['business'] }).ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Savera', salesAudiences: ['consumer'] }, 'syd').ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Bostäder ändrade' }, 'estate1').ok, false);
  assert.equal(P.partnerSetup.saveProfile({ name: 'Personalavtal', partnerType: 'employee' }).ok, false);
  assert.equal(P.partnerRegistry.length, 3);
});

test('unknown partner ids and unsupported explicit channel choices do not mutate the registry', () => {
  const P = fixture();
  const before = JSON.stringify(P.state);
  for (const partnerType of ['affiliate', 'field', '', [], {}]) {
    assert.equal(P.partnerSetup.saveProfile({ name: 'Nytt samarbete', partnerType, salesAudiences: ['business'] }).ok, false);
  }
  assert.equal(P.partnerSetup.saveProfile({ name: 'Okänd partner', partnerType: 'property' }, 'does-not-exist').ok, false);
  assert.equal(P.partnerSetup.canEdit('does-not-exist'), false);
  assert.equal(JSON.stringify(P.state), before);
});

function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
console.log(`${checks} partner registry checks passed`);
