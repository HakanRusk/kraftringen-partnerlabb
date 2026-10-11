'use strict';
// Round two: regression for reload segment drift and cancelled, queued audio writes.
// Uses actual IndexedDB transactions and synthetic silent audio, never customer calls.
const fs=require('fs');const path=require('path');const os=require('os');const {chromium}=require('playwright');
const BASE=process.env.PARTNERLABB_QA_URL||'http://127.0.0.1:4192';
const OUT=process.env.PARTNERLABB_QA_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'round2-learning-'));
fs.mkdirSync(OUT,{recursive:true});
const course=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/elakademin-data.json')));
const key='kraftringen.elakademin.full.v1.'+String(course.meta.version).replace(/[^a-z0-9._-]/gi,'-');
const checks=[],errors=[];
function check(name,ok,evidence){checks.push({name,passed:!!ok,evidence});if(!ok)throw Error(name)}
function wav(){const size=16000,b=Buffer.alloc(44+size);b.write('RIFF');b.writeUInt32LE(36+size,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(size,40);return b}
const audio=wav();
async function courseReady(p){await p.locator('#course-app').waitFor({state:'visible'})}
async function library(p){await p.waitForFunction(()=>document.querySelector('#b2c-call-results')?.getAttribute('aria-busy')==='false')}
async function closed(p){await p.waitForFunction(()=>!document.querySelector('#portal-dialog').open)}
async function goLesson(p,id){await p.evaluate(id=>location.hash='#lesson/'+id,id);await p.waitForFunction(title=>document.querySelector('#lesson-title')?.textContent===title,course.lessons.find(l=>l.id===id).title);await p.locator('#view-lesson').waitFor({state:'visible'})}
async function dbRows(p){return p.evaluate(async()=>{const d=await new Promise((resolve,reject)=>{const r=indexedDB.open('partnerlabb.b2cCallExamples.v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=d.transaction('calls').objectStore('calls').getAll();r.onsuccess=async()=>{const out=[];for(const {audio,...row} of r.result){const hash=await crypto.subtle.digest('SHA-256',await audio.arrayBuffer());out.push({...row,audioSize:audio.size,audioHash:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')})}resolve(out)};r.onerror=()=>reject(r.error)})}finally{d.close()}})}
async function holdWrites(p){await p.evaluate(async()=>{const d=await new Promise((resolve,reject)=>{const r=indexedDB.open('partnerlabb.b2cCallExamples.v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});window.round2Hold=true;window.round2Held=false;window.round2Released=false;const until=Date.now()+15000;const t=d.transaction('calls','readwrite'),s=t.objectStore('calls');function pump(){const r=s.get('__synthetic_blocker__');r.onsuccess=()=>{round2Held=true;if(round2Hold&&Date.now()<until)pump()}}pump();t.oncomplete=()=>{round2Released=true;d.close()};t.onabort=()=>{round2Released=true;d.close()}});await p.waitForFunction(()=>window.round2Held)}
async function releaseWrites(p){await p.evaluate(()=>window.round2Hold=false);await p.waitForFunction(()=>window.round2Released);return dbRows(p)}
async function prepareUpload(p,title){await p.locator('#b2c-call-upload').click();await p.locator('#b2c-call-title').fill(title);await p.locator('#b2c-call-note').fill('Syntetiskt tyst test för lagring och avbrytning.');await p.locator('#b2c-call-file').setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:audio});await p.waitForFunction(()=>!document.querySelector('#b2c-call-submit').disabled)}
async function submitBlocked(p){await holdWrites(p);await p.locator('#b2c-call-submit').click();await p.waitForFunction(()=>document.querySelector('#b2c-call-submit')?.textContent==='Sparar…')}
(async()=>{const b=await chromium.launch({executablePath:process.env.PARTNERLABB_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const c=await b.newContext({locale:'sv-SE',viewport:{width:1440,height:900}});await c.route('https://**/*',r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(BASE+'/elakademin.html?track=business&workspace=syd#assessment/business');await courseReady(p);
 const businessQ=course.final_assessment.business[0],consumerQ=course.final_assessment.consumer[0];
 await p.locator('#assessment-content .quiz-card').first().locator('input[value="'+businessQ.correct+'"]').check();await p.locator('#assessment-content .quiz-card').first().locator('button[type=submit]').click();
 await p.locator('[data-track=consumer]').click();
 check('Global track change canonicalizes current final-test hash',await p.evaluate(()=>location.hash)==='#assessment/consumer');
 check('Global track change shows the selected final-test segment',await p.locator('#assessment-track').inputValue()==='consumer');
 await p.locator('#assessment-content .quiz-card').first().locator('input[value="'+consumerQ.correct+'"]').check();await p.locator('#assessment-content .quiz-card').first().locator('button[type=submit]').click();
 await p.reload();await courseReady(p);
 check('Reload retains final-test segment and course track',await p.locator('#assessment-track').inputValue()==='consumer'&&await p.locator('[data-track=consumer]').getAttribute('aria-pressed')==='true');
 check('Reload retains checked consumer answer',await p.locator('#assessment-content .quiz-card').first().locator('.quiz-feedback').isVisible());
 await p.locator('[data-track=business]').click();check('Changing back restores separate business answer',await p.locator('#assessment-content .quiz-card').first().locator('.quiz-feedback').isVisible());
 await p.locator('[data-track=all]').click();await p.locator('#assessment-track').selectOption('consumer');await p.reload();await courseReady(p);check('All-chapters final-test dropdown also survives reload',await p.locator('#assessment-track').inputValue()==='consumer');
 await goLesson(p,'energi-effekt');await p.locator('#lesson-notes').evaluate(n=>{n.value='Anteckning innan fältet lämnas.';n.dispatchEvent(new Event('input',{bubbles:true}))});await p.locator('#case-answer').evaluate(n=>{n.value='Pågående kundfallsresonemang.';n.dispatchEvent(new Event('input',{bubbles:true}))});await goLesson(p,'elhandel-elnat');await goLesson(p,'energi-effekt');
 check('Hash navigation preserves pending note and case draft',await p.locator('#lesson-notes').inputValue()==='Anteckning innan fältet lämnas.'&&await p.locator('#case-answer').inputValue()==='Pågående kundfallsresonemang.');
 await p.reload();await courseReady(p);check('Reload retains note and case draft',await p.locator('#lesson-notes').inputValue()==='Anteckning innan fältet lämnas.'&&await p.locator('#case-answer').inputValue()==='Pågående kundfallsresonemang.');
 await p.locator('#bookmark-lesson').click();await p.locator('#complete-lesson').click();await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.notes=['synthetic malformed notes container'];localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('round2-unrelated-key','keep')},key);await p.reload();await courseReady(p);
 check('Malformed notes container does not lose valid completion/bookmark',await p.locator('#bookmark-lesson').getAttribute('aria-pressed')==='true'&&await p.locator('#complete-lesson').getAttribute('aria-pressed')==='true');
 check('Malformed notes container retains valid case answer',await p.locator('#case-answer').inputValue()==='Pågående kundfallsresonemang.');
 check('Course reload leaves unrelated browser data intact',await p.evaluate(()=>localStorage.getItem('round2-unrelated-key'))==='keep');
 await p.goto(BASE+'/?workspace=vast#academy');await library(p);
 for(const ending of ['cancel','navigate','switch-partner']){
  await prepareUpload(p,'Avbrutet exempel '+ending);await submitBlocked(p);
  check('Native audio write really remains queued '+ending,await p.evaluate(()=>window.round2Hold&&window.round2Held&&!window.round2Released));
  if(ending==='cancel')await p.locator('#b2c-call-cancel').click();
  else if(ending==='navigate')await p.evaluate(()=>Portal.go('overview'));
  else await p.evaluate(()=>Portal.previewPartner('syd'));
  await closed(p);const after=await releaseWrites(p);check('Leaving pending save adds no stale recording '+ending,after.length===0);
  await p.evaluate(()=>{Portal.previewPartner('vast');Portal.go('academy')});await library(p);
 }
 await p.reload();await library(p);check('Cancelled queued saves remain absent after reload',await p.locator('[data-b2c-listen]').count()===0);
 await prepareUpload(p,'Originalt syntetiskt exempel');await p.locator('#b2c-call-submit').click();await closed(p);await library(p);
 const before=await dbRows(p),id=before[0].id;check('Normal save after cancellation still works exactly once',before.length===1&&before[0].audioSize===audio.length);
 await p.locator('[data-b2c-edit="'+id+'"]').click();await p.locator('#b2c-call-form').waitFor({state:'visible'});await p.locator('#b2c-call-title').fill('Ändring som ska avbrytas');await submitBlocked(p);await p.locator('#b2c-call-cancel').click();await closed(p);const afterEdit=await releaseWrites(p);
 check('Cancel queued edit retains original metadata and audio',JSON.stringify(afterEdit)===JSON.stringify(before));
 await p.reload();await library(p);await p.locator('[data-b2c-delete="'+id+'"]').click();await p.locator('#b2c-call-confirm-delete').waitFor({state:'visible'});await holdWrites(p);await p.locator('#b2c-call-confirm-delete').click();check('Native delete is pending before cancellation',await p.locator('#b2c-call-confirm-delete').isDisabled());await p.locator('#b2c-call-cancel-delete').click();await closed(p);const afterDelete=await releaseWrites(p);
 check('Cancel queued delete retains original complete recording',JSON.stringify(afterDelete)===JSON.stringify(before));
 await p.reload();await library(p);check('Reload retains recording after cancelled edit/delete',await p.locator('[data-b2c-listen="'+id+'"]').count()===1);
 await p.locator('[data-b2c-edit="'+id+'"]').click();await p.locator('#b2c-call-form').waitFor({state:'visible'});await p.locator('#b2c-call-title').fill('Bekräftad ändring efter avbrytning');await p.locator('#b2c-call-submit').click();await closed(p);await library(p);check('Successful edit still works after cancelled transaction',(await dbRows(p))[0].title==='Bekräftad ändring efter avbrytning');
 await p.locator('[data-b2c-delete="'+id+'"]').click();await p.locator('#b2c-call-confirm-delete').click();await closed(p);await library(p);check('Successful delete still works after cancelled transaction',(await dbRows(p)).length===0);
 await p.reload();await library(p);check('Successful deletion remains complete after reload',await p.locator('[data-b2c-listen]').count()===0);
 check('No uncaught JavaScript errors',errors.length===0,errors);
 fs.writeFileSync(path.join(OUT,'round2-learning-results.json'),JSON.stringify({status:'passed',checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.length,errors}));
 }finally{await b.close()}})().catch(e=>{fs.writeFileSync(path.join(OUT,'round2-learning-results.json'),JSON.stringify({status:'failed',checks,errors,error:e.message},null,2));console.error(e.message.split('\n')[0]);process.exit(1)});
