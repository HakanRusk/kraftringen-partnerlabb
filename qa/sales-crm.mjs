import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const partners = {
  portal: { id: 'portal', name: 'Portalpartner', type: 'sales', salesAudiences: ['business', 'consumer'], salesWorkMode: 'portal' },
  external: { id: 'external', name: 'Externpartner', type: 'sales', salesAudiences: ['business'], salesWorkMode: 'external' }
};
const P = {
  role: 'partner', partner: 'portal', state: { untouched: { value: 7 } }, routes: {},
  getPartner(id = P.partner) { return partners[id]; },
  register(id, route) { P.routes[id] = route; },
  save() { return true; },
  e: String, escape: String, icon: name => `<i>${name}</i>`, date: value => value
};
const context = vm.createContext({ window: { Portal: P }, crypto: webcrypto, structuredClone, console, Object, Date });
vm.runInContext(fs.readFileSync(new URL('../dist/sales-crm.js', import.meta.url), 'utf8'), context);

assert.equal(P.salesCrm.isPortalPartner(), true);
assert.match(P.routes['sales-crm'].render(), /Kundarbete/);
assert.equal(P.salesCrm.saveRecord({ customer: 'Fel', segment: 'business', email: 'real@example.com', status: 'new', next: 'Ring' }).ok, false);
assert.equal(P.salesCrm.saveRecord({ customer: 'Fel segment', segment: 'fiber', email: 'fiber@kund.example', status: 'new', next: 'Ring' }).ok, false);
assert.equal(P.salesCrm.saveRecord({ customer: 'Fel datum', segment: 'business', email: 'datum@kund.example', status: 'new', next: 'Ring', nextDate: '2026-02-30' }).ok, false);

const created = P.salesCrm.saveRecord({ customer: ' Exempelkund   AB ', segment: 'business', contact: 'Kim Exempel', email: 'KIM@KUND.EXAMPLE', status: 'active', next: ' Boka   behovssamtal ', nextDate: '2026-10-20', note: 'Fiktivt underlag' });
assert.equal(created.ok, true);
assert.equal(P.salesCrm.rows().length, 1);
assert.equal(P.salesCrm.rows()[0].customer, 'Exempelkund AB');
assert.equal(P.salesCrm.rows()[0].email, 'kim@kund.example');
assert.equal(P.salesCrm.rows()[0].next, 'Boka behovssamtal');
assert.deepEqual(P.state.untouched, { value: 7 });

const updated = P.salesCrm.saveRecord({ customer: 'Exempelkund AB', segment: 'consumer', contact: 'Kim Exempel', email: 'kim@kund.example', status: 'waiting', next: 'Invänta fiktivt svar', nextDate: '', note: '' }, created.id);
assert.equal(updated.ok, true);
assert.equal(P.salesCrm.rows()[0].status, 'waiting');
assert.equal(P.salesCrm.rows()[0].segment, 'consumer');

P.partner = 'external';
assert.equal(P.salesCrm.isPortalPartner(), false);
assert.equal(P.salesCrm.rows().length, 0);
assert.match(P.routes['sales-crm'].render(), /inte aktiverat/);
assert.equal(P.salesCrm.saveRecord({ customer: 'Extern', segment: 'business', email: 'extern@kund.example', status: 'new', next: 'Ring' }).ok, false);
assert.equal(P.state.salesCrmRecords.length, 1);

P.partner = 'portal';
const before = JSON.stringify(P.state);
P.save = () => false;
const failed = P.salesCrm.saveRecord({ customer: 'Osparad', segment: 'business', email: 'osparad@kund.example', status: 'new', next: 'Ring' });
assert.equal(failed.ok, false);
assert.equal(JSON.stringify(P.state), before);
assert.equal(P.salesCrm.rows().length, 1);

partners.portal.salesWorkMode = 'external';
assert.equal(P.salesCrm.isPortalPartner(), false);
assert.equal(P.state.salesCrmRecords.length, 1);
partners.portal.salesWorkMode = 'portal';
assert.equal(P.salesCrm.rows().length, 1);

console.log('PASS sales CRM mode, validation, partner isolation, history preservation and storage rollback');
