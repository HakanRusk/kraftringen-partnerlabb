'use strict';
// Round three: stale audio dialogs in real tabs and malformed persisted quiz flags.
// Synthetic silent WAV only. No course data or customer recordings are changed.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');
const BASE = process.env.PARTNERLABB_QA_URL || 'http://127.0.0.1:4193';
const OUT = process.env.PARTNERLABB_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'round3-learning-'));
fs.mkdirSync(OUT, { recursive: true });
const course = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/elakademin-data.json')));
const key = 'kraftringen.elakademin.full.v1.' + String(course.meta.version).replace(/[^a-z0-9._-]/gi, '-');
const checks = [], errors = [];
function check(name, ok, evidence) {
  checks.push({ name, passed: !!ok, evidence });
  if (!ok) throw Error(name);
}
function wav() {
  const size = 16000, b = Buffer.alloc(44 + size);
  b.write('RIFF'); b.writeUInt32LE(36 + size, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(size, 40);
  return b;
}
const library = p => p.waitForFunction(() => document.querySelector('#b2c-call-results')?.getAttribute('aria-busy') === 'false');
const closed = p => p.waitForFunction(() => !document.querySelector('#portal-dialog').open);
async function close(p) { await p.keyboard.press('Escape'); await closed(p); }
async function editor(p, id) {
  await p.locator('[data-b2c-edit="' + id + '"]').click();
  await p.locator('#b2c-call-title').waitFor({ state: 'visible' });
}
async function save(p) { await p.locator('#b2c-call-submit').click(); await closed(p); await library(p); }
async function rows(p) {
  return p.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('partnerlabb.b2cCallExamples.v1');
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    try {
      const records = await new Promise((resolve, reject) => {
        const r = db.transaction('calls').objectStore('calls').getAll();
        r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
      });
      return await Promise.all(records.map(async ({ audio, ...row }) => ({
        ...row, audioSize: audio.size,
        audioHash: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await audio.arrayBuffer())), v => v.toString(16).padStart(2, '0')).join('')
      })));
    } finally { db.close(); }
  });
}
async function conflict(p) {
  await p.locator('#b2c-call-form-error').waitFor({ state: 'visible' });
  return /ändrats i en annan flik/.test(await p.locator('#b2c-call-form-error').innerText());
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PARTNERLABB_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ locale: 'sv-SE', viewport: { width: 1440, height: 900 } });
    await context.route('https://**/*', r => r.abort());
    const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
    const lesson = course.lessons[0], question = lesson.quiz[0], answerKey = 'lesson-' + lesson.id + ':' + question.id;
    await p.goto(BASE + '/elakademin.html#lesson/' + lesson.id);
    await p.locator('#course-app').waitFor({ state: 'visible' });
    await p.locator('#lesson-notes').fill('Bevara anteckningen när en sparad testflagga är felaktig.');
    await p.locator('#save-notes').click();
    await p.locator('#bookmark-lesson').click(); await p.locator('#complete-lesson').click();
    await p.evaluate(() => localStorage.setItem('round3-unrelated-key', 'keep'));
    for (const flag of ['false', 'true', 1, false, true]) {
      // Leave the chapter before writing the fixture; its unload note flush
      // correctly saves the current in-memory answers while a chapter is open.
      await p.evaluate(() => location.hash = '#overview');
      await p.locator('#view-overview').waitFor({ state: 'visible' });
      await p.evaluate(({ key, answerKey, value, flag }) => {
        const state = JSON.parse(localStorage.getItem(key));
        state.answers[answerKey] = { value, checked: flag, reason: 'Bevarat svar.' };
        localStorage.setItem(key, JSON.stringify(state));
      }, { key, answerKey, value: question.correct, flag });
      await p.reload(); await p.locator('#course-app').waitFor({ state: 'visible' });
      await p.evaluate(id => location.hash = '#lesson/' + id, lesson.id);
      await p.locator('#view-lesson').waitFor({ state: 'visible' });
      const form = p.locator('#lesson-content .quiz-card').first(), checked = flag === true;
      check('Full course only accepts boolean checked: ' + JSON.stringify(flag), await form.locator('.quiz-feedback').isVisible() === checked);
      check('Full course summary uses the same boolean rule: ' + JSON.stringify(flag), (await p.locator('#lesson-content [data-quiz-status]').innerText()).startsWith((checked ? '1' : '0') + ' av '));
      check('Full course preserves saved selection: ' + JSON.stringify(flag), await form.locator('input[value="' + question.correct + '"]').isChecked());
    }
    check('Malformed test flags preserve notes and completion/bookmark', await p.locator('#lesson-notes').inputValue() === 'Bevara anteckningen när en sparad testflagga är felaktig.' && await p.locator('#bookmark-lesson').getAttribute('aria-pressed') === 'true' && await p.locator('#complete-lesson').getAttribute('aria-pressed') === 'true');
    check('Course repair preserves unrelated browser data', await p.evaluate(() => localStorage.getItem('round3-unrelated-key')) === 'keep');
    await p.goto(BASE + '/?workspace=vast#academy'); await library(p);
    const oldQuestion = await p.evaluate(() => { const q = PartnerElakademin.modules[0].quiz[0]; return { id: q.id, correctIndex: q.correctIndex }; });
    await p.evaluate(q => {
      const key = 'partnerlabb.portal.v2', state = JSON.parse(localStorage.getItem(key));
      state.training ||= {}; state.training.vast ||= {};
      state.training.vast.selfTests = { elakademin: { [q.id]: { selectedIndex: q.correctIndex, checked: 'false' } } };
      localStorage.setItem(key, JSON.stringify(state));
    }, oldQuestion);
    await p.reload(); await library(p); await p.locator('[data-ac-course=elakademin]').first().click();
    const oldForm = p.locator('[data-ac-quiz="' + oldQuestion.id + '"]');
    check('Earlier Academy course rejects string checked=false', !(await oldForm.locator('[data-ac-feedback]').isVisible()));
    check('Earlier Academy course keeps selection and excludes malformed flag from count', await oldForm.locator('input[value="' + oldQuestion.correctIndex + '"]').isChecked() && /0 frågor kontrollerade/.test(await p.locator('#ac-self-test-progress').innerText()));
    await oldForm.locator('button[type=submit]').click();
    check('Real Academy answer check still shows correct feedback', await oldForm.locator('[data-ac-feedback]').isVisible() && /Rätt svar/.test(await oldForm.locator('[data-ac-feedback]').innerText()));
    await close(p); await p.reload(); await library(p); await p.locator('[data-ac-course=elakademin]').first().click();
    check('Legitimate Academy check persists after reload', await p.locator('[data-ac-feedback="' + oldQuestion.id + '"]').isVisible());
    await close(p);

    const audioContext = await browser.newContext({ locale: 'sv-SE', viewport: { width: 1440, height: 900 } });
    await audioContext.route('https://**/*', r => r.abort());
    // Equal timestamps exercise metadata comparisons even within one clock tick.
    await audioContext.addInitScript(() => {
      const RealDate = Date, fixed = RealDate.parse('2026-10-11T10:00:00.000Z');
      window.Date = class extends RealDate {
        constructor(...args) { if (args.length) super(...args); else super(fixed); }
        static now() { return fixed; }
      };
    });
    const a = await audioContext.newPage(), b = await audioContext.newPage();
    for (const page of [a, b]) page.on('pageerror', e => errors.push(e.message));
    const url = BASE + '/?workspace=vast#academy';
    await a.goto(url); await library(a); await a.locator('#b2c-call-upload').click();
    await a.locator('#b2c-call-title').fill('Syntetiskt original'); await a.locator('#b2c-call-note').fill('Tyst WAV för samtidig redigering.');
    const audio = wav();
    await a.locator('#b2c-call-file').setInputFiles({ name: 'synthetic.wav', mimeType: 'audio/wav', buffer: audio });
    await a.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
    await a.locator('#b2c-call-form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await closed(a); await library(a);
    const original = await rows(a), id = original[0]?.id;
    check('Rapid repeated submit saves exactly one complete synthetic recording', original.length === 1 && original[0].audioSize === audio.length);
    await b.goto(url); await library(b);
    for (const [field, value] of [['title', 'Nyare titel från flik B'], ['note', 'Nyare lärotips från flik B.'], ['category', 'objections']]) {
      await a.reload(); await library(a); await editor(a, id);
      await b.reload(); await library(b); await editor(b, id);
      const input = b.locator('#b2c-call-form [name="' + field + '"]');
      if (field === 'category') await input.selectOption(value); else await input.fill(value);
      await save(b); const newer = await rows(b);
      check('Concurrent metadata update really saves with equal timestamp: ' + field, newer[0][field] === value && newer[0].updatedAt === original[0].updatedAt);
      await a.locator('#b2c-call-title').fill('Stale dialog must not overwrite ' + field);
      await a.locator('#b2c-call-submit').click();
      check('Stale edit reports conflict and retains dialog: ' + field, await conflict(a) && await a.locator('#portal-dialog').evaluate(d => d.open));
      await a.waitForFunction(() => !document.querySelector('#b2c-call-submit').disabled);
      check('Stale edit preserves newer metadata and audio bytes: ' + field, JSON.stringify(await rows(a)) === JSON.stringify(newer));
      await close(a);
    }
    await a.locator('[data-b2c-delete="' + id + '"]').click(); await a.locator('#b2c-call-confirm-delete').waitFor({ state: 'visible' });
    await b.reload(); await library(b); await editor(b, id); await b.locator('#b2c-call-note').fill('Samtalet uppdaterat efter att raderingsdialogen öppnades.'); await save(b);
    const beforeDelete = await rows(b); await a.locator('#b2c-call-confirm-delete').click();
    check('Stale deletion reports conflict instead of removing changed recording', await conflict(a));
    await a.waitForFunction(() => !document.querySelector('#b2c-call-confirm-delete').disabled);
    check('Rejected stale deletion preserves complete latest record', JSON.stringify(await rows(a)) === JSON.stringify(beforeDelete));
    check('Concurrent edits preserve original audio hash and partner scope', beforeDelete[0].audioHash === original[0].audioHash && beforeDelete[0].scope === 'normal' && beforeDelete[0].partner === 'vast');
    await close(a); await a.reload(); await library(a); await editor(a, id);
    check('Reopening editor retrieves latest committed metadata', await a.locator('#b2c-call-note').inputValue() === beforeDelete[0].note);
    await a.locator('#b2c-call-title').fill('Bekräftad ändring efter omladdning'); await save(a);
    check('Fresh editor can still save normally after conflict', (await rows(a))[0].title === 'Bekräftad ändring efter omladdning');
    await a.locator('[data-b2c-listen="' + id + '"]').click(); await a.locator('#b2c-call-player').waitFor({ state: 'visible' });
    await a.locator('#b2c-call-player').evaluate(async player => { await player.play(); });
    check('Preserved audio remains playable after concurrent updates', await a.locator('#b2c-call-player').evaluate(player => !player.paused && player.duration > 0));
    await close(a); await a.locator('[data-b2c-delete="' + id + '"]').click(); await a.locator('#b2c-call-confirm-delete').waitFor({ state: 'visible' });
    await a.locator('#b2c-call-confirm-delete').evaluate(button => { button.click(); button.click(); });
    await closed(a); await library(a);
    check('Fresh confirmed deletion still succeeds exactly once', (await rows(a)).length === 0);
    await a.reload(); await library(a);
    check('Completed deletion survives reload', await a.locator('[data-b2c-listen]').count() === 0);
    check('No uncaught JavaScript errors', errors.length === 0, errors);
    fs.writeFileSync(path.join(OUT, 'round3-learning-results.json'), JSON.stringify({ status: 'passed', checks, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, passed: checks.length, errors }));
  } finally { await browser.close(); }
})().catch(error => {
  fs.writeFileSync(path.join(OUT, 'round3-learning-results.json'), JSON.stringify({ status: 'failed', checks, errors, error: error.message }, null, 2));
  console.error(error.message.split('\n')[0]); process.exit(1);
});
