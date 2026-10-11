/* Regression tests for confirmed learning/navigation/audio bugs. Synthetic audio only. */
'use strict';
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const BASE = process.env.PARTNERLABB_QA_URL || 'http://127.0.0.1:4191';
const OUT = process.env.PARTNERLABB_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'partnerlabb-learning-bugs-'));
fs.mkdirSync(OUT, {recursive:true});
const course = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/elakademin-data.json')));
// A 0.5 s silent Opus/WebM stream, with deliberately omitted duration metadata.
const streamWebm = Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////EU2bdKtNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggFA7AEAAAAAAABoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjEuNy4xMDNXQYxMYXZmNjEuNy4xMDNEiYhAf0AAAAAAABZUrmvlrgEAAAAAAABc14EBc8WI/g3yMYVIOnecgQAitZyDdW5kiIEAhoZBX09QVVNWqoNjLqBWu4QExLQAg4EC4ZGfgQG1iEC/QAAAAAAAYmSBEGOik09wdXNIZWFkAQE4AUAfAAAAAAASVMNn2HNzn2PAgGfImUWjh0VOQ09ERVJEh4xMYXZmNjEuNy4xMDNzc7NjwItjxYj+DfIxhUg6d2fIokWjh0VOQ09ERVJEh5VMYXZjNjEuMTkuMTAxIGxpYm9wdXMfQ7Z1QUXngQCji4EAAIAIC+Y7I6tgo4qBABWACAissw7Go4qBACmACAissw7Go4qBAD2ACAissw7Go4qBAFGACAissw7Go4qBAGWACAissw7Go4qBAHmACAissw7Go4qBAI2ACAissw7Go4qBAKGACAissw7Go4qBALWACAissw7Go4qBAMmACAissw7Go4qBAN2ACAissw7Go4qBAPGACAissw7Go4qBAQWACAissw7Go4qBARmACAissw7Go4qBAS2ACAissw7Go4qBAUGACAissw7Go4qBAVWACAissw7Go4qBAWmACAissw7Go4qBAX2ACAissw7Go4qBAZGACAissw7Go4qBAaWACAissw7Go4qBAbmACAissw7Go4qBAc2ACAissw7Go4qBAeGACAissw7GoJOhioEB9QAICKyzDsZ1ooQAzf5g', 'base64');
function wav(seconds=3) {
  const rate=8000, size=rate*seconds*2, b=Buffer.alloc(44+size);
  b.write('RIFF'); b.writeUInt32LE(36+size,4); b.write('WAVE',8); b.write('fmt ',12);
  b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22); b.writeUInt32LE(rate,24);
  b.writeUInt32LE(rate*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(size,40); return b;
}
const checks=[], errors=[];
function check(name,ok,evidence) { checks.push({name,passed:!!ok,evidence}); if(!ok) throw Error(name); }
async function ready(p) { await p.locator('#course-app').waitFor({state:'visible'}); }
async function close(p) { await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#portal-dialog').open); }
async function library(p) { await p.waitForFunction(()=>document.querySelector('#b2c-call-results')?.getAttribute('aria-busy')==='false'); }
async function go(p,hash) {
  await p.evaluate(h=>location.hash=h,hash);
  const [view,id]=hash.replace(/^#/, '').split('/');
  await p.locator('#view-'+view).waitFor({state:'visible'});
  if(view==='lesson') await p.waitForFunction(title=>document.querySelector('#lesson-title')?.textContent===title,course.lessons.find(l=>l.id===id).title);
}
async function rows(p) { return p.evaluate(async()=>{const d=await new Promise((resolve,reject)=>{const r=indexedDB.open('partnerlabb.b2cCallExamples.v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});const out=await new Promise((resolve,reject)=>{const r=d.transaction('calls').objectStore('calls').getAll();r.onsuccess=()=>resolve(r.result.map(({audio,...row})=>({...row,audioSize:audio.size})));r.onerror=()=>reject(r.error)});d.close();return out}); }
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.PARTNERLABB_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const ctx=await b.newContext({viewport:{width:1440,height:900},locale:'sv-SE'});
  // All external media deliberately fail here; playback is tested with local synthetic audio below.
  await ctx.route('https://**/*',r=>r.abort());
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE+'/elakademin.html?track=consumer&workspace=qa-consumer&demo=inflyttning#lesson/energi-effekt'); await ready(p);
  const originalHash=await p.evaluate(()=>location.hash);
  await p.locator('.skip-link').evaluate(n=>n.click());
  check('Skip link keeps the open chapter and URL',await p.locator('#view-lesson').isVisible()&&await p.evaluate(()=>location.hash)===originalHash);
  check('Skip link focuses the current chapter heading',await p.evaluate(()=>document.activeElement.id)==='lesson-title');
  await p.locator('[data-jump="chapter-notes"]').click();
  check('Chapter jump moves keyboard focus into the section',await p.evaluate(()=>document.activeElement.closest('#chapter-notes')!==null));
  await p.locator('#lesson-content .media-error').waitFor({state:'visible'});
  check('Failed chapter video source reveals usable fallback',await p.locator('#lesson-content .media-error').isVisible());
  const back=new URL(await p.locator('#portal-link').getAttribute('href'),BASE);
  check('Course retains origin partner and demo in return link',back.searchParams.get('workspace')==='qa-consumer'&&back.searchParams.get('demo')==='inflyttning');
  await p.locator('[data-track="all"]').click();
  check('Changing course track does not change origin partner',new URL(await p.locator('#portal-link').getAttribute('href'),BASE).searchParams.get('workspace')==='qa-consumer');
  await p.locator('.brand').click();
  check('Course brand navigation retains workspace/demo query',await p.evaluate(()=>new URLSearchParams(location.search).get('workspace')==='qa-consumer'&&new URLSearchParams(location.search).get('demo')==='inflyttning'));
  const fixture=JSON.parse(JSON.stringify(course));fixture.lessons[0].media={type:'audio',url:'/qa-learning-tone.wav'};
  await p.route('**/elakademin-data.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
  await p.route('**/qa-learning-tone.wav',r=>r.fulfill({contentType:'audio/wav',body:wav()}));
  await p.goto(BASE+'/elakademin.html#lesson/'+fixture.lessons[0].id);await ready(p);
  await p.evaluate(async()=>{window.qaPlaying=document.querySelector('#lesson-content audio');await qaPlaying.play()});
  check('Synthetic chapter audio really plays',await p.evaluate(()=>!qaPlaying.paused));
  await p.locator('[data-view-link="glossary"]').click();await p.locator('#view-glossary').waitFor({state:'visible'});
  check('Leaving chapter pauses hidden audio immediately',await p.evaluate(()=>qaPlaying.paused));
  await go(p,'#lesson/'+fixture.lessons[0].id);await p.evaluate(async()=>{window.qaPlaying=document.querySelector('#lesson-content audio');await qaPlaying.play()});
  await go(p,'#lesson/'+fixture.lessons[1].id);
  check('Replacing chapter pauses the old media element',await p.evaluate(()=>qaPlaying.paused));
  await p.unroute('**/elakademin-data.json');
  await p.goto(BASE+'/?workspace=vast#academy'); await library(p);
  await p.locator('[data-ac-course="elakademin"]').first().click();
  await p.locator('[data-ac-video-error]').waitFor({state:'visible'});
  check('Older course failed video source reveals fallback',await p.locator('[data-ac-video-error]').isVisible());
  check('Older course full-training link points to current course and partner',(await p.locator('.ac-resources a').first().getAttribute('href')).includes('elakademin.html?track=consumer&workspace=vast'));
  check('Older course does not promise an unsupported training certificate',!(await p.locator('.ac-resources').innerText()).includes('utbildningsintyg'));
  await close(p);
  await p.evaluate(()=>{const P=Portal;P.state.partnerProfiles['qa-consumer']={id:'qa-consumer',name:'Konsumentteam Exempel',type:'sales',salesAudiences:['consumer']};P.save();P.syncPartnerRegistry();P.previewPartner('qa-consumer');P.go('academy')});await library(p);
  check('New consumer partner gets consumer course content',await p.locator('.ac-course h3').filter({hasText:'Kom igång med konsumentförsäljning'}).count()===1);
  check('New consumer partner gets all five existing courses',(await p.evaluate(()=>Portal.academyStats())).totalCourses===5);
  check('New partner does not inherit another partners completed lessons',(await p.evaluate(()=>Portal.academyStats())).completedMoments===0);
  await p.locator('[data-ac-course="intro"]').first().click();
  check('Consumer intro points to available result/training work',/aktiva konsumentförsäljning sker utanför portalen/.test(await p.locator('#academy-dialog-mount').innerText()));
  check('Revised consumer intro retains the three original moments',await p.locator('[data-ac-lesson]').count()===3);
  await close(p);
  const entry=await p.locator('.ac-full-course a').getAttribute('href');
  check('New partner course entry carries configured track and partner',entry.includes('track=consumer')&&entry.includes('workspace=qa-consumer'));
  await p.locator('.ac-full-course a').click();await ready(p);await p.locator('[data-track="business"]').click();await p.locator('#portal-link').click();await library(p);
  check('Round trip returns to the actual originating partner',await p.evaluate(()=>Portal.partner)==='qa-consumer');
  await p.goto(BASE+'/?demo=inflyttning&workspace=vast#academy');await library(p);
  await p.locator('.ac-full-course a').click();await ready(p);await p.locator('#portal-link').click();await library(p);
  check('Demo round trip stays in isolated demo workspace',await p.evaluate(()=>Portal.demoMode&&Portal.partner==='vast'));
  await p.goto(BASE+'/?workspace=syd#academy');
  await p.locator('[data-ac-course="intro"]').first().click();
  check('Business intro points to available result/training work',/aktiva företagsförsäljning sker utanför portalen/.test(await p.locator('#academy-dialog-mount').innerText()));
  check('Revised business intro preserves old example completion state',(await p.evaluate(()=>Portal.academyStats())).completedMoments===4);
  await close(p);
  await p.goto(BASE+'/?workspace=vast#academy');await library(p);
  const persistedBefore=await p.evaluate(()=>localStorage.getItem('partnerlabb.portal.v2'));
  await p.evaluate(()=>{window.qaSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('synthetic quota','QuotaExceededError')}});
  await p.locator('[data-ac-bookmark="dialogue"]').click();
  check('Bookmark failure reports temporary state without successful-save claim',/kunde inte sparas/.test(await p.locator('#toast').innerText())&&!/bokmärkt i denna/.test(await p.locator('#toast').innerText()));
  await p.locator('[data-ac-course="dialogue"]').first().click();await p.locator('#ac-complete').click();
  check('Completion failure does not claim progress was saved',/kunde inte sparas/.test(await p.locator('#toast').innerText())&&!/har sparats/.test(await p.locator('#toast').innerText()));
  await close(p);await p.locator('#ac-webinar').click();
  check('Local signup failure is reported honestly',/kunde inte sparas/.test(await p.locator('#toast').innerText()));
  check('Failed Academy saves preserve previous persisted portal data',await p.evaluate(()=>localStorage.getItem('partnerlabb.portal.v2'))===persistedBefore);
  await p.evaluate(()=>Storage.prototype.setItem=qaSetItem);
  await p.reload();await library(p);
  await p.locator('#b2c-call-upload').click();await p.locator('#b2c-call-title').fill('Syntetiskt WebM-exempel');await p.locator('#b2c-call-note').fill('Tyst ljud för att testa en giltig fil utan durationheader.');
  await p.locator('#b2c-call-file').setInputFiles({name:'synthetic-stream.webm',mimeType:'audio/webm',buffer:streamWebm});await p.waitForFunction(()=>!document.querySelector('#b2c-call-submit').disabled);
  check('Valid streaming WebM is accepted despite infinite initial metadata',/Redo att sparas/.test(await p.locator('#b2c-call-file-status').innerText()));
  await p.locator('#b2c-call-submit').click();await p.waitForFunction(()=>!document.querySelector('#portal-dialog').open);await library(p);
  const uploaded=(await rows(p))[0];check('WebM saves once with finite positive duration and full audio bytes',uploaded.duration>0&&Number.isFinite(uploaded.duration)&&uploaded.audioSize===streamWebm.length);
  await p.locator('[data-b2c-listen]').first().click();await p.locator('#b2c-call-player').evaluate(async a=>{await a.play()});
  check('Saved WebM plays with native audio controls',await p.locator('#b2c-call-player').evaluate(a=>!a.paused));
  await close(p);
  await p.evaluate(async()=>{const d=await new Promise(resolve=>{const r=indexedDB.open('partnerlabb.b2cCallExamples.v1');r.onsuccess=()=>resolve(r.result)});await new Promise(resolve=>{const t=d.transaction('calls','readwrite'),s=t.objectStore('calls'),r=s.getAll();r.onsuccess=()=>{const original=r.result[0];s.put({...original,title:'Q'.repeat(100),createdAt:null});s.put({...original,id:'synthetic-missing-date',title:'Äldre exempel utan datum',createdAt:undefined})};t.oncomplete=resolve});d.close()});
  await p.reload();await library(p);
  check('Older incomplete timestamp cannot hide all valid recordings',await p.locator('[data-b2c-listen]').count()===2);
  check('Reading older metadata preserves both audio blobs',(await rows(p)).every(r=>r.audioSize===streamWebm.length));
  await p.evaluate(()=>{Portal.state.partnerProfiles.vast={id:'vast',name:'Q'.repeat(90),type:'field',salesAudiences:['consumer']};Portal.save();Portal.syncPartnerRegistry();Portal.render()});await library(p);
  for(const width of [320,390,1440]){await p.setViewportSize({width,height:900});check('Academy has no horizontal overflow at '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('[data-b2c-listen]').first().click();await p.locator('#b2c-call-player').waitFor({state:'visible'});check('Audio dialog fits at '+width,await p.locator('#portal-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth));await close(p);}
  const corrupt=await b.newContext();await corrupt.addInitScript(key=>{localStorage.setItem(key,'{synthetic broken JSON');localStorage.setItem('partnerlabb.portal.v2','{"unrelated":"keep"}');},`kraftringen.elakademin.full.v1.${String(course.meta.version).replace(/[^a-z0-9._-]/gi,'-')}`);
  const cp=await corrupt.newPage();await cp.goto(BASE+'/elakademin.html#overview');await ready(cp);check('Malformed course storage still permits reading all chapters',await cp.locator('.chapter-card').count()===18);check('Malformed course storage does not touch portal data',await cp.evaluate(()=>localStorage.getItem('partnerlabb.portal.v2'))==='{"unrelated":"keep"}');await corrupt.close();
  check('No uncaught JavaScript errors',errors.length===0,errors);
  fs.writeFileSync(path.join(OUT,'bug-learning-results.json'),JSON.stringify({checks,errors,status:'passed'},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.length,errors}));
 } finally {await b.close();}
})().catch(e=>{fs.writeFileSync(path.join(OUT,'bug-learning-results.json'),JSON.stringify({checks,errors,error:e.message,status:'failed'},null,2));console.error(e.message.split('\n')[0]);process.exit(1)});
