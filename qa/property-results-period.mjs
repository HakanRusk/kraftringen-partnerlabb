import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/property-results.js', import.meta.url), 'utf8');
const values = new Map();

function load(demoMode = false, partner = 'estate1') {
  const routes = {};
  const listeners = {};
  const modeButtons = ['year','month'].map(mode => ({
    dataset: {propertyResultsMode: mode},
    addEventListener: (name, callback) => { listeners[`mode:${mode}:${name}`] = callback; },
    focus: () => {}
  }));
  const monthSelect = {
    value: '2026-09',
    addEventListener: (name, callback) => { listeners[`month:${name}`] = callback; },
    focus: () => {}
  };
  const Portal = {
    demoMode, role: 'partner', partner, selectedPartnerId: null,
    partnerResultsData: {months: Array.from({length:10}, (_, index) => `2026-${String(index + 1).padStart(2, '0')}`)},
    partnerKickback: {}, e: value => String(value ?? ''), icon: () => '',
    getPartner: (id = partner) => ['estate1','estate2'].includes(id) ? {id, name: id === 'estate1' ? 'Exempelfastigheter AB' : 'Exempelbo Förvaltning', type: 'property'} : undefined, render: () => {},
    register: (name, route) => { routes[name] = route; }
  };
  const document = {
    querySelectorAll: selector => selector === '[data-property-results-mode]' ? modeButtons : [],
    querySelector: selector => selector === '#property-results-month' ? monthSelect : modeButtons.find(button => selector.includes(button.dataset.propertyResultsMode)) || null
  };
  const sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  vm.runInContext(source, vm.createContext({window:{Portal},document,sessionStorage,Intl,Date,JSON}));
  return {Portal,routes,listeners,monthSelect};
}

let normal = load();
assert.deepEqual(JSON.parse(JSON.stringify(normal.Portal.propertyResults.periodFor('estate1'))), {
  current: normal.Portal.partnerResultsData.months,
  label: '2026 hittills',
  range: '1 januari–7 oktober 2026'
});

normal.routes['property-results'].bind();
normal.listeners['mode:month:click']();
normal.monthSelect.value = '2026-08';
normal.listeners['month:change']({target: normal.monthSelect});
assert.deepEqual(JSON.parse(values.get('partnerlabb.propertyResults.v1.estate1')), {mode:'month',month:'2026-08'});

normal = load();
assert.equal(normal.Portal.propertyResults.periodFor('estate1').label, 'Augusti 2026');
assert.equal(normal.Portal.propertyResults.periodFor('estate2').label, '2026 hittills');

values.set('partnerlabb.demo.propertyResults.v1.estate1', JSON.stringify({mode:'month',month:'2026-10'}));
const demo = load(true);
assert.equal(demo.Portal.propertyResults.periodFor('estate1').label, 'Oktober 2026');
assert.equal(normal.Portal.propertyResults.periodFor('estate1').label, 'Augusti 2026');

values.set('partnerlabb.propertyResults.v1.estate2', '{felaktig json');
const recovered = load(false, 'estate2');
assert.equal(recovered.Portal.propertyResults.periodFor('estate2').label, '2026 hittills');

console.log('PASS fastighetspartnerns periodval bevaras per partner och isoleras från kunddemot');
