'use strict';
// Isolated fixtures exercise retained modules without restoring inactive sales routes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const BASE = process.env.PARTNERLABB_QA_URL || 'http://127.0.0.1:4191';
const OUT = process.env.PARTNERLABB_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'partnerlabb-preserved-'));
fs.mkdirSync(OUT, { recursive: true });
const report = { checks: [], errors: [], startedAt: new Date().toISOString() };
const fixture = `<!doctype html><html lang="sv"><head><meta charset="utf-8"></head><body><main id="view"></main><dialog id="fixture-dialog"><h2 id="fixture-title"></h2><div id="fixture-body"></div></dialog><script>
window.fixtureMessages = []; window.fixtureDownloads = []; window.fixtureFailSave = false;
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P = window.Portal = {state:{records:[{id:'record-1',partner:'syd',company:'Exempel & <kund>',kind:'Företag',stage:'lead',events:[],next:'Gammalt steg',date:'2026-11-01'}],offers:[],businessDetails:{},businessDemoSeeded:true,consumerSales:[],unknown:{retain:'sentinel'}},role:'internal',partner:'syd',routes:{},partners:{syd:'Savera',vast:'Face2face'},e:escapeHtml,icon:()=>'',date:v=>v && !Number.isNaN(Date.parse(v)) ? v : 'Ej planerat'};
P.register=(id,route)=>P.routes[id]=route;
P.getRecords=()=>P.state.records.filter(r=>r && typeof r==='object' && (P.role==='internal'||r.partner===P.partner));
P.toast=message=>window.fixtureMessages.push(message);
P.save=()=>{if(window.fixtureFailSave)return false;localStorage.setItem('fixture-preserved',JSON.stringify(P.state));return true;};
P.event=(record,text,visibility='shared')=>record.events.unshift({at:new Date().toISOString(),text,visibility});
P.render=()=>{const route=P.routes[P.page];document.getElementById('view').innerHTML=route.render();route.bind?.();};
P.go=id=>{P.page=id;P.render();};
P.openDialog=(title,html,mount)=>{document.getElementById('fixture-title').textContent=title;document.getElementById('fixture-body').innerHTML=html;const d=document.getElementById('fixture-dialog');if(!d.open)d.showModal();mount?.();};
P.closeDialog=()=>document.getElementById('fixture-dialog').close();
P.download=(filename,content,type)=>fixtureDownloads.push({filename,content,type});
P.validText=input=>{input.setCustomValidity(input.value.trim()?'':'Ange text.');return input.reportValidity();};
</script><script src="/studio.js"></script><script src="/business.js"></script><script src="/consumer.js"></script></body></html>`;
async function check(name, task) {
  try { await task(); report.checks.push({ name, passed: true }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL ' + name + ': ' + error.message); }
}
async function load(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/__qa-preserved.html', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.goto(BASE + '/__qa-preserved.html');
  await page.waitForFunction(() => !!window.Portal?.consumer);
  return { page, context };
}
const state = page => page.evaluate(() => JSON.stringify(window.Portal.state));
async function openOfferReview(page) {
  await page.evaluate(() => {const P=window.Portal;P.state.offers=[{id:'offer-1',partner:'syd',customerId:'record-1',interest:'contract',need:'Fiktivt behov',volume:'12000',start:'2026-12-01',note:'Exempel',documentSteps:{},updatedAt:'2026-10-11'}];P.go('offers');});
  await page.locator('[data-open-offer="offer-1"]').click();
  await page.locator('[name="confirmed"]').check();
}
function consumerRecord(overrides = {}) {
  return { id:'consumer-1',partner:'vast',reference:'F2F-EX-001',name:'Ari Exempel',email:'ari@privatkund.example',address:'Exempelgatan 1',city:'Lund',seller:'Alex Exempel',team:'Team Exempel',channel:'Exempelkanal',next:'Gammalt steg',status:'waiting',events:[], ...overrides };
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true });
  try {
    await check('Studio save failure rolls back offers, customer status and event history', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);const before=await state(page);await page.evaluate(()=>fixtureFailSave=true);await page.locator('#studio-form button[type="submit"]').click();assert.equal(await state(page),before);assert.match(await page.evaluate(()=>fixtureMessages.at(-1)),/kunde inte|Kunde inte/);}finally{await context.close();}
    });
    await check('Studio rejected send remains retryable and does not add a success history', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);const before=await state(page);await page.locator('[data-send-offer="offer-1"]').click();await page.evaluate(()=>fixtureFailSave=true);await page.locator('#studio-confirm-send').click();assert.equal(await state(page),before);assert.equal(await page.locator('#fixture-dialog').evaluate(el=>el.open),true);await page.evaluate(()=>fixtureFailSave=false);await page.locator('#studio-confirm-send').click();assert.equal(await page.evaluate(()=>Portal.state.records[0].events.length),1);assert.ok(await page.evaluate(()=>Portal.state.offers[0].simulatedSentAt));}finally{await context.close();}
    });
    await check('Studio document save failure rolls back document, stage and history', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);await page.evaluate(()=>Portal.go('agreements'));const before=await state(page);await page.evaluate(()=>fixtureFailSave=true);await page.locator('[data-document-step="signing"]').click();assert.equal(await state(page),before);}finally{await context.close();}
    });
    await check('Studio bad saved dates and mixed offers do not crash or erase entries', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.offers=[null,7,{id:'old',partner:'syd',updatedAt:'not-a-date',interest:'removed-interest',need:'Bevara',documentSteps:{}}];Portal.go('documents');});const before=await state(page);assert.match(await page.locator('#view').innerText(),/Inte angivet|Ogiltigt|Okänt/);assert.equal(await state(page),before);await page.evaluate(()=>Portal.go('offers'));await page.locator('[data-open-offer="old"]').click();await page.locator('[data-studio-step="1"]').click();assert.ok(await page.locator('#studio-form').count());}finally{await context.close();}
    });
    await check('Studio malformed offers container is preserved during rendering', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.offers={legacy:'Behåll hela objektet'};Portal.go('documents');});assert.deepEqual(await page.evaluate(()=>Portal.state.offers),{legacy:'Behåll hela objektet'});}finally{await context.close();}
    });
    await check('Studio text export preserves escaped customer name and remains plain text', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);await page.locator('[data-export-offer="offer-1"]').click();const file=await page.evaluate(()=>fixtureDownloads.at(-1));assert.equal(file.type,'text/plain;charset=utf-8');assert.match(file.content,/Kund: Exempel & <kund>/);assert.equal(await page.locator('#view kund').count(),0);}finally{await context.close();}
    });
    await check('Studio rejected save can be retried once with exact persisted state', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);await page.evaluate(()=>fixtureFailSave=true);await page.locator('#studio-form button[type="submit"]').click();await page.evaluate(()=>fixtureFailSave=false);await page.locator('#studio-form button[type="submit"]').click();assert.equal(await page.evaluate(()=>Portal.state.offers.length),1);assert.equal(await page.evaluate(()=>Portal.state.records[0].events.length),1);assert.equal(await page.evaluate(()=>Portal.state.records[0].stage),'offer');assert.equal(await page.evaluate(()=>localStorage.getItem('fixture-preserved')),await state(page));assert.deepEqual(await page.evaluate(()=>Portal.state.unknown),{retain:'sentinel'});}finally{await context.close();}
    });
    await check('Studio real calendar dates reject impossible dates in older review data', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.offers=[{id:'offer-1',partner:'syd',customerId:'record-1',interest:'contract',need:'Exempel',start:'2026-02-31',documentSteps:{}}];Portal.go('offers');});await page.locator('[data-open-offer="offer-1"]').click();await page.locator('[name="confirmed"]').check();const before=await state(page);await page.locator('#studio-form button[type="submit"]').click();assert.equal(await state(page),before);assert.match(await page.evaluate(()=>fixtureMessages.at(-1)),/giltigt datum/);}finally{await context.close();}
    });
    await check('Successful retained document toggles preserve already active customers', async () => {
      const {page,context}=await load(browser);try{await openOfferReview(page);await page.evaluate(()=>{Portal.state.records[0].stage='active';Portal.go('agreements');});await page.locator('[data-document-step="signing"]').click();await page.locator('[data-document-step="signing"]').click();assert.equal(await page.evaluate(()=>Portal.state.records[0].stage),'active');assert.equal(await page.evaluate(()=>Portal.state.records[0].events.length),2);assert.equal(await page.evaluate(()=>Portal.state.offers[0].documentSteps.signing),false);assert.equal(await page.evaluate(()=>localStorage.getItem('fixture-preserved')),await state(page));}finally{await context.close();}
    });
    await check('Business save failure rolls back details, next step and event history', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>Portal.go('business-brief'));const before=await state(page);await page.locator('[name="next"]').fill('Nytt teststeg');await page.evaluate(()=>fixtureFailSave=true);await page.locator('#business-brief-form button[type="submit"]').click();assert.equal(await state(page),before);assert.match(await page.locator('#business-save-status').innerText(),/kunde inte|Kunde inte/);}finally{await context.close();}
    });
    await check('Business initialization tolerates mixed historical records without deleting them', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.records.unshift(null,7);Portal.state.businessDemoSeeded=false;Portal.initBusinessDemo();Portal.go('business-overview');});assert.deepEqual(await page.evaluate(()=>Portal.state.records.slice(0,2)),[null,7]);}finally{await context.close();}
    });
    await check('Business failed save keeps edited form and retries without duplicate history', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>Portal.go('business-brief'));await page.locator('[name="next"]').fill('Nytt teststeg');await page.evaluate(()=>fixtureFailSave=true);await page.locator('#business-brief-form button[type="submit"]').click();assert.equal(await page.locator('[name="next"]').inputValue(),'Nytt teststeg');await page.evaluate(()=>fixtureFailSave=false);await page.locator('#business-brief-form button[type="submit"]').click();assert.equal(await page.evaluate(()=>Portal.state.records[0].events.length),1);assert.equal(await page.evaluate(()=>Portal.state.records[0].next),'Nytt teststeg');assert.equal(await page.evaluate(()=>localStorage.getItem('fixture-preserved')),await state(page));}finally{await context.close();}
    });
    await check('Business invalid containers remain intact during readable preview', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.businessDetails=['Behåll'];Portal.state.offers={retain:true};Portal.go('business-overview');});assert.deepEqual(await page.evaluate(()=>Portal.state.businessDetails),['Behåll']);assert.deepEqual(await page.evaluate(()=>Portal.state.offers),{retain:true});}finally{await context.close();}
    });
    await check('Consumer unknown stored container is not replaced by fictional seeded sales', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>{Portal.state.consumerSales={legacy:'Behåll'};Portal.initConsumerDemo();Portal.go('consumer-overview');});assert.deepEqual(await page.evaluate(()=>Portal.state.consumerSales),{legacy:'Behåll'});}finally{await context.close();}
    });
    await check('Consumer absent or invalid event arrays yield an empty readable timeline', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(row=>Portal.state.consumerSales=[row],consumerRecord({events:{retain:true}}));assert.deepEqual(await page.evaluate(()=>Portal.consumer.activityFor('consumer-1')),[]);assert.deepEqual(await page.evaluate(()=>Portal.state.consumerSales[0].events),{retain:true});}finally{await context.close();}
    });
    await check('Consumer timeline skips malformed entries and sorts missing date without crashing', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(row=>{Portal.state.consumerSales=[null,3,row];Portal.go('consumer-overview');},consumerRecord({events:[null,4,{text:'Utan datum',kind:'feedback',visibility:'shared'},{text:'Daterad',at:'2026-10-11',kind:'feedback',visibility:'internal'}]}));assert.equal(await page.evaluate(()=>Portal.consumer.activityFor('vast').length),2);await page.evaluate(()=>Portal.role='partner');assert.equal(await page.evaluate(()=>Portal.consumer.activityFor('consumer-1').length),1);assert.equal(await page.evaluate(()=>Portal.state.consumerSales[0]),null);}finally{await context.close();}
    });
    await check('Consumer failed feedback keeps status, next step, history and retry form', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(row=>{Portal.state.consumerSales=[row];Portal.go('consumer-overview');Portal.consumer.open(row.id);},consumerRecord());const before=await state(page);await page.locator('[name="activity"]').fill('Fiktiv återkoppling');await page.locator('[name="status"]').selectOption('active');await page.locator('[name="next"]').fill('Nytt nästa steg');await page.evaluate(()=>fixtureFailSave=true);await page.locator('#consumer-activity-form button[type="submit"]').click();assert.equal(await state(page),before);assert.equal(await page.locator('[name="activity"]').inputValue(),'Fiktiv återkoppling');await page.evaluate(()=>fixtureFailSave=false);await page.locator('#consumer-activity-form button[type="submit"]').click();assert.equal(await page.evaluate(()=>Portal.state.consumerSales[0].status),'active');assert.equal(await page.evaluate(()=>Portal.state.consumerSales[0].events.length),1);}finally{await context.close();}
    });
    await check('Consumer rejected new registration does not close or create an unsaved record', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(()=>Portal.consumer.new());await page.locator('#consumer-fill-example').click();await page.locator('[name="demo"]').check();const before=await state(page);await page.evaluate(()=>fixtureFailSave=true);await page.locator('#consumer-record-form button[type="submit"]').click();assert.equal(await state(page),before);assert.equal(await page.locator('#fixture-dialog').evaluate(el=>el.open),true);await page.evaluate(()=>fixtureFailSave=false);await page.locator('#consumer-record-form button[type="submit"]').click();assert.equal(await page.evaluate(()=>Portal.state.consumerSales.length),1);assert.equal(await page.evaluate(()=>Portal.state.consumerSales[0].status),'underlag');}finally{await context.close();}
    });
    await check('Consumer export excludes private history and JSON preserves special characters', async () => {
      const {page,context}=await load(browser);try{await page.evaluate(row=>{Portal.role='partner';Portal.partner='vast';Portal.state.consumerSales=[row];Portal.go('consumer-reports');},consumerRecord({name:'Exempel " & <kund>',events:[{text:'Privat',visibility:'internal'},{text:'Delat',visibility:'shared'}]}));await page.locator('[data-consumer-export]').click();const file=await page.evaluate(()=>fixtureDownloads.at(-1));const data=JSON.parse(file.content);assert.equal(data.consumerSales[0].name,'Exempel " & <kund>');assert.deepEqual(data.consumerSales[0].events.map(e=>e.text),['Delat']);assert.equal(await page.locator('#view kund').count(),0);}finally{await context.close();}
    });
    // This verifies the real portal still rejects the retained routes.
    await check('Actual portal keeps legacy sales routes inactive and preserves stored underlag', async () => {
      const context=await browser.newContext();const page=await context.newPage();try{await page.goto(BASE);await page.waitForFunction(()=>!!Portal?.routes['consumer-sales']);await page.evaluate(()=>{Portal.state.offers=[{id:'preserved',partner:'syd',custom:'Behåll'}];Portal.state.consumerSales=[{id:'preserved',partner:'vast',custom:'Behåll'}];});const before=await page.evaluate(()=>JSON.stringify([Portal.state.offers,Portal.state.consumerSales]));for(const partner of ['syd','vast']){for(const route of ['offers','agreements','documents','business-overview','business-brief','consumer-sales','consumer-followup','consumer-reports']){await page.evaluate(({partner,route})=>{Portal.previewPartner(partner);Portal.go(route);}, {partner,route});assert.equal(await page.evaluate(()=>Portal.page),'overview');}}assert.equal(await page.evaluate(()=>JSON.stringify([Portal.state.offers,Portal.state.consumerSales])),before);assert.equal(await page.locator('#nav [data-go="offers"]').count(),0);}finally{await context.close();}
    });
  } finally {
    await browser.close();report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'preserved-report.json'),JSON.stringify(report,null,2));
    const passed=report.checks.filter(c=>c.passed).length;console.log(`${passed}/${report.checks.length} preserved-module regressions passed; ${report.errors.length} page errors. Report: ${path.join(OUT,'preserved-report.json')}`);
    if(passed!==report.checks.length || report.errors.length)process.exitCode=1;
  }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
