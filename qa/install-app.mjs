import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync('dist/install-app.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.id, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.prefer_related_applications, false);
for (const size of [180, 192, 512]) {
  const png = fs.readFileSync(`dist/assets/app-icon-${size}.png`);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
  if (size !== 180) assert.ok(manifest.icons.some(icon => icon.sizes === `${size}x${size}`));
}
for (const page of ['index', 'elakademin', 'utbildning-preview']) {
  const html = fs.readFileSync(`dist/${page}.html`, 'utf8');
  assert.match(html, /rel="manifest" href="\.\/manifest.webmanifest" crossorigin="use-credentials"/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180"/);
}

function app(navigator = {}, standalone = false) {
  const listeners = {}, nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, {hidden: true, open: false, textContent: '', disabled: false, listeners: {}, addEventListener(name, fn) {this.listeners[name] = fn;}, click() {return this.listeners.click?.();}});
    return nodes.get(key);
  };
  let html = '', menuOpen = false, menuCloses = 0;
  const mode = {matches: standalone, addEventListener(name, fn) {this.change = fn;}};
  node('#sidebar').classList = {contains: () => menuOpen};
  node('#menu-toggle').click = () => {menuOpen = false; menuCloses++;};
  const window = {
    matchMedia: () => mode,
    addEventListener: (name, fn) => {listeners[name] = fn;},
    Portal: {openDialog(title, text, mount) {
      html = text;
      // Each native dialog rendering creates new nodes.
      for (const key of ['#install-app-confirm', '#install-app-status', '#install-app-guide']) nodes.delete(key);
      node('#portal-dialog').open = true;
      node('#install-app-guide'); mount();
    }},
  };
  const document = {
    querySelector: key => key === '#install-app-guide' ? nodes.get(key) : node(key),
    addEventListener: (name, fn) => {listeners[name] = fn;},
  };
  const context = vm.createContext({window, document, navigator: {userAgent: '', ...navigator}});
  vm.runInContext(script, context); listeners.DOMContentLoaded();
  const native = (outcome = 'accepted', error = false) => {
    let calls = 0, prevented = false;
    const event = {preventDefault: () => {prevented = true;}, prompt: async () => {calls++; if(error) throw Error('Unavailable');}, userChoice: Promise.resolve({outcome})};
    listeners.beforeinstallprompt(event);
    assert.equal(prevented, true);
    return () => calls;
  };
  return {node, listeners, mode, native, html: () => html, menu: () => {menuOpen = true;}, menuCloses: () => menuCloses};
}

for (const navigator of [{userAgent: 'iPhone'}, {platform: 'MacIntel', maxTouchPoints: 5}]) {
  const a = app(navigator); a.menu(); a.node('#install-app').click();
  assert.match(a.html(), /Safari.*Lägg till på hemskärmen/);
  assert.match(a.html(), /Öppna som webbapp/);
  assert.equal(a.node('#install-app-confirm').hidden, true);
  assert.equal(a.menuCloses(), 1);
}
const android = app({userAgent: 'Android'}); android.node('#install-app').click();
assert.match(android.html(), /Chrome.*startskärmen/);
const desktop = app(); desktop.node('#install-app').click();
assert.match(desktop.html(), /Chrome eller Edge/);
assert.match(desktop.html(), /kan vara separata i appen och webbläsaren/);
for (const [outcome, error, text] of [
  ['accepted', false, /sista steg/], ['dismissed', false, /avbröts/], ['accepted', true, /kunde inte öppnas/]
]) {
  const a = app(); const count = a.native(outcome, error);
  assert.equal(count(), 0); // Never prompt without the user's click.
  a.node('#install-app').click(); assert.equal(a.node('#install-app-confirm').hidden, false);
  const pending = a.node('#install-app-confirm').click();
  await a.node('#install-app-confirm').click(); await pending;
  assert.equal(count(), 1);
  assert.match(a.node('#install-app-status').textContent, text);
  assert.equal(a.node('#install-app').hidden, false); // Acceptance is not installation.
  a.listeners.appinstalled(); assert.equal(a.node('#install-app').hidden, true);
}
const standalone = app({}, true); assert.equal(standalone.node('#install-app').hidden, true);
const iosApp = app({standalone: true}); assert.equal(iosApp.node('#install-app').hidden, true);
const dynamic = app(); dynamic.node('#install-app').click(); dynamic.native();
assert.equal(dynamic.node('#install-app-confirm').hidden, false);
dynamic.mode.matches = true; dynamic.mode.change(); assert.equal(dynamic.node('#install-app').hidden, true);

// A late prompt result must leave a newly opened dialog untouched.
const late = app(); let resolve;
late.listeners.beforeinstallprompt({preventDefault() {}, prompt: () => new Promise(r => {resolve = r;}), userChoice: Promise.resolve({outcome: 'dismissed'})});
late.node('#install-app').click(); const pending = late.node('#install-app-confirm').click();
late.node('#install-app').click(); const freshStatus = late.node('#install-app-status');
resolve(); await pending; assert.equal(freshStatus.textContent, '');
console.log('PASS manifest, PNG dimensions, iPhone/iPad/Android/desktop guidance, explicit install, cancel/error, standalone and late response. No storage APIs supplied to install controller.');
