import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const nodes = new Map();
const node = selector => {
  if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', classList: { remove() {}, add() {} }, setAttribute() {}, addEventListener() {}, querySelectorAll: () => [] });
  return nodes.get(selector);
};
const context = vm.createContext({
  window: { scrollTo() {} }, document: { querySelector: node, querySelectorAll: () => [], addEventListener() {}, body: node('body') },
  localStorage: { getItem: () => null }, location: { search: '', href: 'https://demo.example/' },
  history: { replaceState() {} }, URL, URLSearchParams, structuredClone, console,
});
for (const file of ['app', 'commercial', 'workspace']) vm.runInContext(fs.readFileSync(`dist/${file}.js`, 'utf8'), context);
const P = context.window.Portal;
P.state.consumerSales = [{ id: 'legacy', partner: 'vast', name: 'Fiktiv kund', status: 'waiting', next: 'Gammalt nästa steg' }];
P.state.offers = [{ id: 'legacy-offer', partner: 'syd', draft: 'Bevara' }];
const before = JSON.stringify([P.state.records, P.state.consumerSales, P.state.offers]);
for (const id of ['syd', 'vast']) {
  P.previewPartner(id);
  const home = node('#view').innerHTML;
  assert.deepEqual([...home.matchAll(/data-go="([^"]+)"/g)].map(match => match[1]), ['partner-sales', 'product-facts', 'academy', 'support']);
  assert.doesNotMatch(home, /PARTNERARBETSYTA|En arbetsyta för|Företagsavtal|Konsumentavtal/);
  assert.doesNotMatch(node('#nav').innerHTML, /pipeline|consumer-sales|customers|offers/);
  for (const route of ['pipeline', 'customers', 'business-brief', 'offers', 'consumer-sales', 'consumer-followup']) {
    P.go(route);
    assert.equal(P.page, 'overview');
  }
  assert.equal(P.workbench.tasks({ partnerIds: [id] }).length, 0);
  assert.equal(P.workbench.render({ partnerIds: [id] }), '');
  P.role = 'internal'; P.selectedPartnerId = id;
  const detail = P.routes['partner-detail'].render();
  assert.match(detail, /data-go="partner-sales"/);
  assert.match(detail, /data-go="partner-insights"/);
  assert.match(detail, /Öppna utbildning & stöd/);
  assert.doesNotMatch(detail, /Ansvar & nästa steg|Vad gör partnern|commercial-process-demo/);
  P.go('customers'); assert.equal(P.page, 'partners');
}
P.state.moveins = [{ id: 'property-case', partner: 'estate1', name: 'Fiktiv inflyttare', handoverStatus: 'submitted', events: [] }];
P.partner = 'estate1'; P.role = 'partner';
P.register('property-manual', { render: () => 'manuell registrering' });
P.go('property-manual'); assert.equal(P.page, 'property-manual');
assert.ok(P.workbench.tasks({ channels: ['movein'] }).some(task => task.recordId === 'property-case'));
assert.equal(JSON.stringify([P.state.records, P.state.consumerSales, P.state.offers]), before);
console.log('PASS seller routes and profiles show results/training; property tasks and legacy records remain');
