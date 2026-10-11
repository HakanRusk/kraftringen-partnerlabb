'use strict';
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const BASE = process.env.PARTNERLABB_QA_URL || 'http://127.0.0.1:4183';
const OUT = process.env.PARTNERLABB_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'partnerlabb-b2c-qa-'));
fs.mkdirSync(OUT, { recursive: true });

function wav(seconds = 1.5, frequency = 440) {
  const rate = 16000, count = Math.round(rate * seconds), dataSize = count * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * i / rate) * 4000), 44 + i * 2);
  return buffer;
}
const audioBytes = wav();
const audioHash = crypto.createHash('sha256').update(audioBytes).digest('hex');
const report = { checks: [], errors: [], consoleErrors: [], screenshots: [], startedAt: new Date().toISOString() };
const check = (name, ok, evidence = null) => { report.checks.push({ name, passed: !!ok, evidence }); if (!ok) console.log('FAIL ' + name + ' ' + JSON.stringify(evidence)); };
const assert = (name, ok, evidence = null) => { check(name, ok, evidence); if (!ok) throw new Error(name); };
async function waitLibrary(page) {
  await page.locator('#b2c-call-library').waitFor();
  await page.waitForFunction(() => document.querySelector('#b2c-call-results')?.getAttribute('aria-busy') !== 'true');
}
async function upload(page, title, category = 'needs', note = 'Lyssna på hur säljaren sammanfattar behovet och gör nästa steg tydligt.') {
  await page.locator('#b2c-call-upload').click();
  await page.locator('#b2c-call-form [name="title"]').fill(title);
  await page.locator('#b2c-call-form [name="category"]').selectOption(category);
  await page.locator('#b2c-call-form [name="note"]').fill(note);
  await page.locator('#b2c-call-file').setInputFiles({ name: 'synthetic-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
  await page.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
  await page.locator('#b2c-call-submit').click();
  await page.waitForFunction(() => !document.querySelector('#portal-dialog').open);
  await waitLibrary(page);
  await page.locator('#b2c-call-results').getByText(title, { exact: true }).waitFor();
  const item = page.locator('#b2c-call-results article').filter({ has: page.getByText(title, { exact: true }) });
  return { id: await item.locator('[data-b2c-listen]').getAttribute('data-b2c-listen'), item };
}
async function dbRows(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('partnerlabb.b2cCallExamples.v1', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const rows = await new Promise((resolve, reject) => { const r = db.transaction('calls', 'readonly').objectStore('calls').getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const result = [];
    for (const row of rows) {
      const blobs = Object.entries(row).filter(([, value]) => value instanceof Blob);
      const meta = Object.fromEntries(Object.entries(row).filter(([, value]) => !(value instanceof Blob)));
      const files = [];
      for (const [key, blob] of blobs) {
        const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
        files.push({ key, size: blob.size, type: blob.type, hash: Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('') });
      }
      result.push({ ...meta, files });
    }
    db.close(); return result;
  });
}
async function unrelated(page) {
  return page.evaluate(() => { const keys = ['records', 'offers', 'training', 'sites', 'journey', 'support', 'moveins', 'commercial', 'propertySettings', 'businessDetails', 'consumerSales']; return Object.fromEntries(keys.map(k => [k, JSON.stringify(window.Portal.state[k])])); });
}
async function savedShot(page, name) { const path = `${OUT}/${name}.png`; await page.screenshot({ path, fullPage: true }); report.screenshots.push(path); }

(async () => {
  let browser;
  try {
    const options = { headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] };
    if (process.env.HTTPS_PROXY) options.proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
    browser = await chromium.launch(options);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'sv-SE' });
    await context.route('https://d2ol7oe51mr4n9.cloudfront.net/**', route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('ERR_FAILED')) report.consoleErrors.push(msg.text()); });
    await page.goto(BASE + '/?workspace=vast#academy');
    await waitLibrary(page);
    assert('Face2face B2C library appears in Academy', await page.locator('#b2c-call-library').isVisible());
    check('Library starts without fabricated recordings', await page.locator('[data-b2c-listen]').count() === 0);
    check('Existing five courses remain', (await page.evaluate(() => window.Portal.academyStats())).totalCourses === 5);
    await page.evaluate(() => window.Portal.save());
    const before = await unrelated(page);
    await savedShot(page, 'calls-empty-desktop');

    await page.locator('#b2c-call-upload').click();
    check('Upload dialog has title', await page.locator('#portal-dialog').getAttribute('aria-labelledby') === 'dialog-title');
    const labels = await page.locator('#b2c-call-form').evaluate(form => [...form.querySelectorAll('input:not([type=hidden]),textarea,select')].map(el => ({ name: el.name, labels: [...el.labels].map(l => l.textContent.trim()), type: el.type })));
    check('Upload fields have associated labels', labels.every(l => l.labels.length && l.labels.some(s => s.length)), labels);
    await page.locator('#b2c-call-form [name="title"]').fill('   ');
    await page.locator('#b2c-call-file').setInputFiles({ name: 'empty.wav', mimeType: 'audio/wav', buffer: Buffer.alloc(0) });
    await page.waitForTimeout(180);
    check('Empty audio rejected', await page.locator('#b2c-call-submit').isDisabled() && await page.locator('#b2c-call-form-error').isVisible());
    await page.locator('#b2c-call-file').setInputFiles({ name: 'document.txt', mimeType: 'text/plain', buffer: Buffer.from('fiktivt testunderlag') });
    await page.waitForTimeout(180);
    check('Non-audio file rejected', await page.locator('#b2c-call-submit').isDisabled() && await page.locator('#b2c-call-form-error').isVisible());
    await page.locator('#b2c-call-file').setInputFiles({ name: 'fake.wav', mimeType: 'audio/wav', buffer: Buffer.from('This is not a playable WAV.') });
    await page.waitForTimeout(180);
    check('Disguised invalid WAV rejected', await page.locator('#b2c-call-submit').isDisabled() && await page.locator('#b2c-call-form-error').isVisible());
    await page.locator('#b2c-call-file').evaluate(input => { const transfer = new DataTransfer(); transfer.items.add(new File([new Uint8Array(50 * 1024 * 1024 + 1)], 'large.wav', { type: 'audio/wav' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(200);
    check('Over 50 MB audio rejected', await page.locator('#b2c-call-submit').isDisabled() && /50/.test(await page.locator('#b2c-call-form-error').textContent()));
    await page.locator('#b2c-call-file').setInputFiles({ name: 'synthetic-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await page.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
    await page.locator('#b2c-call-form [name="note"]').fill('Fiktivt exempel för att kontrollera validering.');
    await page.locator('#b2c-call-submit').click();
    check('Whitespace-only title is rejected', await page.locator('#b2c-call-form').isVisible());
    check('Invalid selections create no stored record', (await dbRows(page)).length === 0);
    await page.keyboard.press('Escape');

    await page.evaluate(() => {
      window.qaMediaUrls = new Set();
      window.qaOriginalCreateUrl = URL.createObjectURL;
      window.qaOriginalRevokeUrl = URL.revokeObjectURL;
      window.qaOriginalArrayBuffer = Blob.prototype.arrayBuffer;
      URL.createObjectURL = function (...args) { const url = window.qaOriginalCreateUrl.apply(this, args); window.qaMediaUrls.add(url); return url; };
      URL.revokeObjectURL = function (url) { window.qaMediaUrls.delete(url); return window.qaOriginalRevokeUrl.call(this, url); };
      Blob.prototype.arrayBuffer = function (...args) { const result = window.qaOriginalArrayBuffer.apply(this, args); return new Promise((resolve, reject) => setTimeout(() => result.then(resolve, reject), 350)); };
    });
    await page.locator('#b2c-call-upload').click();
    await page.locator('#b2c-call-file').setInputFiles({ name: 'delayed-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(750);
    check('Closing while validation is pending creates no call or surviving media URL', (await dbRows(page)).length === 0 && await page.evaluate(() => !document.querySelector('#portal-dialog').open && window.qaMediaUrls.size === 0));
    await page.locator('#b2c-call-upload').click();
    await page.locator('#b2c-call-file').setInputFiles({ name: 'delayed-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await page.evaluate(() => window.Portal.go('consumer-material'));
    await page.waitForTimeout(750);
    check('Navigation while validation is pending creates no call or surviving media URL', (await dbRows(page)).length === 0 && await page.evaluate(() => !document.querySelector('#portal-dialog').open && window.qaMediaUrls.size === 0));
    await page.evaluate(() => window.Portal.go('academy')); await waitLibrary(page);
    await page.locator('#b2c-call-upload').click();
    await page.locator('#b2c-call-file').setInputFiles({ name: 'delayed-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await page.locator('#b2c-call-file').setInputFiles({ name: 'not-an-audio.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
    await page.waitForTimeout(750);
    check('A newer invalid selection cannot be replaced by an older valid result', await page.locator('#b2c-call-submit').isDisabled() && await page.locator('#b2c-call-form-error').isVisible() && await page.evaluate(() => window.qaMediaUrls.size === 0));
    await page.keyboard.press('Escape');
    await page.evaluate(() => { URL.createObjectURL = window.qaOriginalCreateUrl; URL.revokeObjectURL = window.qaOriginalRevokeUrl; Blob.prototype.arrayBuffer = window.qaOriginalArrayBuffer; delete window.qaOriginalCreateUrl; delete window.qaOriginalRevokeUrl; delete window.qaOriginalArrayBuffer; delete window.qaMediaUrls; });

    const first = await upload(page, 'Tydlig behovsanalys', 'needs');
    let rows = await dbRows(page);
    assert('Audio and metadata are stored atomically', rows.length === 1 && rows[0].files.length === 1 && rows[0].files[0].hash === audioHash, rows);
    check('Audio stored only for normal scope and selected partner', rows[0].scope === 'normal' && rows[0].partner === 'vast', rows[0]);
    check('Upload preserves customer, reporting, and training state', JSON.stringify(await unrelated(page)) === JSON.stringify(before));
    await page.locator(`[data-b2c-listen="${first.id}"]`).click();
    await page.locator('#b2c-call-player').waitFor();
    await page.waitForFunction(() => document.querySelector('#b2c-call-player').readyState >= 1);
    const duration = await page.locator('#b2c-call-player').evaluate(audio => audio.duration);
    check('Stored audio is playable with correct measured duration', Math.abs(duration - 1.5) < 0.04, duration);
    const player = await page.locator('#b2c-call-player').elementHandle();
    await player.evaluate(async audio => { audio.muted = true; await audio.play(); });
    await page.waitForFunction(() => {
      const audio = document.querySelector('#b2c-call-player');
      return audio && !audio.paused && audio.currentTime > 0;
    }, null, { timeout: 5000 });
    check('Audio playback advances', await player.evaluate(audio => !audio.paused && audio.currentTime > 0));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    check('Dialog close pauses audio', await player.evaluate(audio => audio.paused));
    check('Closing returns focus to selected example', await page.evaluate(id => document.activeElement?.dataset.b2cListen === id, first.id));
    await page.reload(); await waitLibrary(page);
    check('Example persists after reload', await page.locator(`[data-b2c-listen="${first.id}"]`).isVisible());
    rows = await dbRows(page);
    check('Reload preserves exact audio bytes', rows.length === 1 && rows[0].files[0].hash === audioHash);

    await page.locator(`[data-b2c-edit="${first.id}"]`).click();
    check('Edit retains prior title', await page.locator('#b2c-call-form [name="title"]').inputValue() === 'Tydlig behovsanalys');
    await page.locator('#b2c-call-form [name="title"]').fill('Tydlig invändningshantering');
    await page.locator('#b2c-call-form [name="category"]').selectOption('objections');
    await page.locator('#b2c-call-form [name="note"]').fill('Fiktivt test: <img src=x onerror="window.qaInjected=true"> Visar varför en lugn följdfråga fungerade.');
    await page.locator('#b2c-call-submit').click();
    await page.waitForFunction(() => !document.querySelector('#portal-dialog').open); await waitLibrary(page);
    check('Edit updates metadata', /Tydlig invändningshantering/.test(await page.locator('#b2c-call-results').textContent()));
    check('Edit returns focus to edited example', await page.evaluate(id => document.activeElement?.dataset.b2cEdit === id, first.id));
    rows = await dbRows(page);
    check('Metadata edit retains exact audio', rows.length === 1 && rows[0].files[0].hash === audioHash);
    await page.locator(`[data-b2c-listen="${first.id}"]`).click();
    await page.locator('#b2c-call-player').waitFor();
    check('Training note is escaped as plain text', !(await page.evaluate(() => window.qaInjected)) && await page.locator('#dialog-body img').count() === 0 && (await page.locator('#dialog-body').textContent()).includes('<img'));
    await page.keyboard.press('Escape');

    const second = await upload(page, 'En varm öppning', 'opening', 'Fiktivt ljudexempel: säljaren presenterar syftet kort och ställer en öppen fråga.');
    await page.locator('#b2c-call-search').fill('invändningshantering');
    check('Search returns matching example only', await page.locator('[data-b2c-listen]').count() === 1 && await page.locator(`[data-b2c-listen="${first.id}"]`).isVisible());
    await page.locator('#b2c-call-search').fill('finnsinte123');
    check('No-result search has usable empty state', await page.locator('[data-b2c-listen]').count() === 0 && (await page.locator('#b2c-call-results').textContent()).trim().length > 0);
    await page.locator('#b2c-call-search').fill('');
    await page.locator('#b2c-call-category').selectOption('opening');
    check('Category filter returns selected category only', await page.locator('[data-b2c-listen]').count() === 1 && await page.locator(`[data-b2c-listen="${second.id}"]`).isVisible());
    await page.locator('#b2c-call-category').selectOption('all');
    await page.locator(`[data-b2c-delete="${second.id}"]`).click();
    await page.locator('#b2c-call-cancel-delete').click();
    check('Cancelled deletion preserves recording', (await dbRows(page)).some(r => r.id === second.id) && await page.locator(`[data-b2c-listen="${second.id}"]`).isVisible());
    await page.locator(`[data-b2c-delete="${second.id}"]`).click();
    await page.locator('#b2c-call-confirm-delete').click();
    await page.waitForFunction(() => !document.querySelector('#portal-dialog').open); await waitLibrary(page);
    check('Confirmed deletion removes metadata and audio', !(await dbRows(page)).some(r => r.id === second.id) && await page.locator(`[data-b2c-listen="${second.id}"]`).count() === 0);
    check('Deletion returns focus to upload control', await page.evaluate(() => document.activeElement?.id === 'b2c-call-upload'));

    await page.locator('#b2c-call-upload').click();
    await page.locator('#b2c-call-form [name="title"]').fill('Lagringsfel utan halvpost');
    await page.locator('#b2c-call-form [name="note"]').fill('Fiktivt exempel för ett lagringsfel.');
    await page.locator('#b2c-call-file').setInputFiles({ name: 'synthetic-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await page.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
    await page.evaluate(() => { window.qaOriginalAdd = IDBObjectStore.prototype.add; IDBObjectStore.prototype.add = function (...args) { if (this.name === 'calls') throw new DOMException('QA simulated full storage', 'QuotaExceededError'); return window.qaOriginalAdd.apply(this, args); }; });
    await page.locator('#b2c-call-submit').click();
    await page.locator('#b2c-call-form-error').waitFor({ state: 'visible' });
    check('Storage write error is explained without closing form', await page.locator('#b2c-call-form').isVisible() && /spar|lagr|webbläs/i.test(await page.locator('#b2c-call-form-error').textContent()));
    check('Storage failure creates no partial record', (await dbRows(page)).length === 1);
    check('Storage failure preserves entered metadata', await page.locator('#b2c-call-form [name="title"]').inputValue() === 'Lagringsfel utan halvpost');
    await page.evaluate(() => { IDBObjectStore.prototype.add = window.qaOriginalAdd; delete window.qaOriginalAdd; });
    await page.locator('#b2c-call-submit').click();
    await page.waitForFunction(() => !document.querySelector('#portal-dialog').open); await waitLibrary(page);
    check('Retry after storage failure saves one complete record', (await dbRows(page)).length === 2);

    await page.locator(`[data-b2c-listen="${first.id}"]`).click();
    const navPlayer = await page.locator('#b2c-call-player').elementHandle();
    await navPlayer.evaluate(async audio => { audio.muted = true; await audio.play(); });
    await page.evaluate(() => window.Portal.go('consumer-material'));
    check('Navigation stops playing audio and closes modal', await navPlayer.evaluate(audio => audio.paused) && !(await page.locator('#portal-dialog').evaluate(dialog => dialog.open)));
    await page.evaluate(() => window.Portal.go('academy')); await waitLibrary(page);
    await savedShot(page, 'calls-filled-desktop');
    check('Desktop has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.setViewportSize({ width: 390, height: 844 });
    check('Mobile has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await savedShot(page, 'calls-filled-mobile');
    await page.locator(`[data-b2c-listen="${first.id}"]`).click();
    check('Mobile player dialog has no horizontal overflow', await page.locator('#portal-dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth + 1));
    await savedShot(page, 'calls-player-mobile');
    const focus = [];
    for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); focus.push(await page.evaluate(() => ({ tag: document.activeElement.tagName, inDialog: !!document.activeElement.closest('dialog[open]') }))); }
    check('Modal keyboard stays out of background controls', focus.every(f => f.inDialog || f.tag === 'BODY'), focus);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.evaluate(() => { const P = window.Portal; P.state.partnerProfiles = { ...P.state.partnerProfiles, vast: { id: 'vast', name: 'Ringteam Exempel', type: 'field', salesAudiences: ['consumer'] }, 'qa-mixed': { id: 'qa-mixed', name: 'Blandteam Exempel', type: 'sales', salesAudiences: ['business', 'consumer'] }, 'qa-consumer': { id: 'qa-consumer', name: 'Konsumentteam Exempel', type: 'sales', salesAudiences: ['consumer'] } }; P.save(); P.syncPartnerRegistry(); P.render(); });
    await waitLibrary(page);
    check('Renaming Face2face retains eligible library and recordings', await page.locator('#b2c-call-library').isVisible() && await page.locator(`[data-b2c-listen="${first.id}"]`).isVisible());
    await page.evaluate(() => { window.Portal.previewPartner('qa-mixed'); window.Portal.go('academy'); }); await waitLibrary(page);
    check('Mixed partner is eligible based on salesAudiences', await page.locator('#b2c-call-library').isVisible());
    check('Mixed partner cannot see other partner recordings', await page.locator('[data-b2c-listen]').count() === 0);
    const mixed = await upload(page, 'Blandpartnerns eget exempel', 'next-step');
    check('Mixed partner owns its new example', (await dbRows(page)).find(r => r.id === mixed.id)?.partner === 'qa-mixed');
    await page.evaluate(() => { window.Portal.previewPartner('qa-consumer'); window.Portal.go('academy'); }); await waitLibrary(page);
    check('New named consumer partner is eligible', await page.locator('#b2c-call-library').isVisible());
    check('New consumer partner begins with isolated empty library', await page.locator('[data-b2c-listen]').count() === 0);
    await page.evaluate(() => { window.Portal.previewPartner('syd'); window.Portal.go('academy'); });
    check('Business-only partner has no B2C library', await page.locator('#b2c-call-library').count() === 0);
    check('Savera courses remain usable', (await page.evaluate(() => window.Portal.academyStats())).totalCourses === 5 && await page.locator('[data-ac-course="elakademin"]').count() > 0);
    await page.evaluate(() => { window.Portal.previewPartner('estate1'); window.Portal.go('academy'); });
    check('Property partner has no B2C library or Academy route', await page.locator('#b2c-call-library').count() === 0 && await page.evaluate(() => window.Portal.page) === 'overview');
    await page.evaluate(() => { window.Portal.previewPartner('vast'); window.Portal.go('academy'); }); await waitLibrary(page);
    check('Returning to original partner preserves its own examples', await page.locator(`[data-b2c-listen="${first.id}"]`).isVisible() && await page.locator(`[data-b2c-listen="${mixed.id}"]`).count() === 0);
    const normalRows = await dbRows(page);

    await page.goto(BASE + '/?demo=inflyttning&workspace=vast#academy'); await waitLibrary(page);
    check('Customer demo sees separate empty B2C library', await page.evaluate(() => window.Portal.demoMode) && await page.locator('[data-b2c-listen]').count() === 0);
    const demo = await upload(page, 'Kunddemots eget ljudexempel', 'opening');
    check('Customer demo audio stored with separate scope', (await dbRows(page)).find(r => r.id === demo.id)?.scope === 'customer-demo');
    await page.goto(BASE + '/?workspace=vast#academy'); await waitLibrary(page);
    check('Normal library excludes demo example', await page.locator(`[data-b2c-listen="${demo.id}"]`).count() === 0 && await page.locator(`[data-b2c-listen="${first.id}"]`).isVisible());
    check('Demo upload leaves normal recording rows unchanged', JSON.stringify((await dbRows(page)).filter(r => r.scope === 'normal')) === JSON.stringify(normalRows.filter(r => r.scope === 'normal')));
    // Course dialogs and tests should still work after library usage.
    await page.locator('[data-ac-course="elakademin"]').last().click();
    check('Elakademin still opens six chapters and playable video element', await page.locator('[data-ac-lesson]').count() === 6 && await page.locator('[data-ac-video]').count() === 1);
    await page.keyboard.press('Escape');
    const beforeCancelledReset = { rows: await dbRows(page), state: await page.evaluate(() => JSON.stringify(window.Portal.state)) };
    page.once('dialog', dialog => dialog.dismiss());
    const cancelledReset = await page.evaluate(() => window.Portal.resetScope(false));
    check('Cancelled reset preserves recordings and portal state', cancelledReset === false && JSON.stringify(await dbRows(page)) === JSON.stringify(beforeCancelledReset.rows) && await page.evaluate(() => JSON.stringify(window.Portal.state)) === beforeCancelledReset.state);
    await page.evaluate(() => { window.qaOriginalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function (key, value) { if (key === 'partnerlabb.portal.v2') throw new DOMException('QA failed reset save', 'QuotaExceededError'); return window.qaOriginalSetItem.call(this, key, value); }; });
    page.once('dialog', dialog => dialog.accept());
    const failedResetSave = await page.evaluate(() => window.Portal.resetScope(false));
    check('Failed reset state save never clears recordings', failedResetSave === false && JSON.stringify(await dbRows(page)) === JSON.stringify(beforeCancelledReset.rows) && await page.evaluate(() => JSON.stringify(window.Portal.state)) === beforeCancelledReset.state);
    await page.evaluate(() => { Storage.prototype.setItem = window.qaOriginalSetItem; delete window.qaOriginalSetItem; });

    const normalStateBeforeDemoReset = await page.evaluate(() => localStorage.getItem('partnerlabb.portal.v2'));
    await page.goto(BASE + '/?demo=inflyttning&workspace=vast#academy'); await waitLibrary(page);
    page.once('dialog', dialog => dialog.accept());
    const clearedDemo = await page.evaluate(() => window.Portal.resetScope(true));
    const afterDemoClear = await dbRows(page);
    check('Customer demo reset clears only customer demo recordings', clearedDemo === true && afterDemoClear.filter(r => r.scope === 'customer-demo').length === 0 && JSON.stringify(afterDemoClear.filter(r => r.scope === 'normal')) === JSON.stringify(normalRows.filter(r => r.scope === 'normal')));
    check('Demo reset preserves normal localStorage state', await page.evaluate(() => localStorage.getItem('partnerlabb.portal.v2')) === normalStateBeforeDemoReset);
    await page.evaluate(() => { window.Portal.previewPartner('vast'); window.Portal.go('academy'); }); await waitLibrary(page);
    const retainedDemo = await upload(page, 'Demoljud som normal reset ska bevara', 'needs');
    await page.goto(BASE + '/?workspace=vast#academy'); await waitLibrary(page);
    await page.evaluate(() => { window.qaOriginalClear = window.Portal.b2cCalls.clearScope; window.Portal.b2cCalls.clearScope = async () => false; });
    page.once('dialog', dialog => dialog.accept());
    const failedAudioClear = await page.evaluate(() => window.Portal.resetScope(false));
    check('Call clear failure returns false with meaningful warning', failedAudioClear === false && /kunde inte|inte rensa/i.test(await page.locator('#toast').textContent()) && /samtal|ljud/i.test(await page.locator('#toast').textContent()));
    check('Failed call clear keeps recorded audio intact', (await dbRows(page)).filter(r => r.scope === 'normal').length === normalRows.filter(r => r.scope === 'normal').length);
    await page.evaluate(() => { window.Portal.b2cCalls.clearScope = window.qaOriginalClear; delete window.qaOriginalClear; });
    page.once('dialog', dialog => dialog.accept());
    const clearedNormal = await page.evaluate(() => window.Portal.resetScope(false));
    const finalRows = await dbRows(page);
    check('Normal reset clears all normal partner recordings', clearedNormal === true && finalRows.filter(r => r.scope === 'normal').length === 0);
    check('Normal reset preserves customer demo recording', finalRows.some(r => r.id === retainedDemo.id && r.scope === 'customer-demo'));

    const delayedContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'sv-SE' });
    await delayedContext.addInitScript(() => {
      window.qaOriginalOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = function (name, ...args) {
        const request = window.qaOriginalOpen(name, ...args);
        if (name === 'partnerlabb.b2cCallExamples.v1') {
          let handler;
          Object.defineProperty(request, 'onsuccess', { configurable: true, get: () => handler, set: fn => { handler = fn; } });
          request.addEventListener('success', event => setTimeout(() => handler?.call(request, event), 4000));
        }
        return request;
      };
    });
    const delayedPage = await delayedContext.newPage();
    delayedPage.on('pageerror', error => report.errors.push(error.message));
    await delayedPage.goto(BASE + '/?workspace=vast#academy');
    await delayedPage.locator('#b2c-call-upload').click();
    await delayedPage.locator('#b2c-call-form [name="title"]').fill('Ett avbrutet samtalsexempel');
    await delayedPage.locator('#b2c-call-form [name="note"]').fill('Fiktivt exempel som inte ska sparas när användaren lämnar dialogen innan lagringen kan börja.');
    await delayedPage.locator('#b2c-call-file').setInputFiles({ name: 'synthetic-example.wav', mimeType: 'audio/wav', buffer: audioBytes });
    await delayedPage.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
    await delayedPage.locator('#b2c-call-submit').click();
    await delayedPage.evaluate(() => window.Portal.go('consumer-material'));
    await delayedPage.waitForTimeout(4400);
    await delayedPage.evaluate(() => { indexedDB.open = window.qaOriginalOpen; delete window.qaOriginalOpen; });
    check('Leaving while database opens cancels pending save without stale recording', (await dbRows(delayedPage)).length === 0 && await delayedPage.evaluate(() => !document.querySelector('#portal-dialog').open));
    await delayedContext.close();
    check('No uncaught JavaScript errors', report.errors.length === 0, report.errors);
    check('No unexpected console errors', report.consoleErrors.length === 0, report.consoleErrors);
    await context.close();
  } catch (error) { report.fatal = error.stack; console.log('FATAL ' + error.stack); }
  finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(OUT + '/qa-results.json', JSON.stringify(report, null, 2));
    const summary = { checks: report.checks.length, passed: report.checks.filter(c => c.passed).length, failed: report.checks.filter(c => !c.passed), fatal: report.fatal || null, screenshots: report.screenshots, errors: report.errors, consoleErrors: report.consoleErrors };
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.failed.length || summary.fatal ? 1 : 0;
  }
})();
