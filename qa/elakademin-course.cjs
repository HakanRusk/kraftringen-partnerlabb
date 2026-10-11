const{chromium}=require('playwright');const fs=require('fs');const path=require('path');const os=require('os');
const OUTPUT=process.env.PARTNERLABB_QA_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'partnerlabb-elakademin-qa-'));fs.mkdirSync(OUTPUT,{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/elakademin-data.json'),'utf8'));
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PARTNERLABB_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--lang=sv-SE']});const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'sv-SE'});const page=await context.newPage();const errors=[],checks=[];
page.on('response',r=>{if(r.status()>=400)console.log(JSON.stringify({http_error:r.status(),url:r.url()}))});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
function check(name,ok){checks.push({name,passed:!!ok});if(!ok)throw Error(name);}
const base=process.env.PARTNERLABB_QA_URL||'http://127.0.0.1:4186';const response=await page.goto(base+'/elakademin.html?track=all#overview');await page.locator('#course-app').waitFor({state:'visible'});
check('course served',response.status()===200);check('18 full chapters',await page.locator('.chapter-card').count()===18);check('four material links',await page.locator('.resource-link').count()===4);
await page.evaluate(()=>localStorage.setItem('partnerlabb.portal.v2','{"qa":"unrelated"}'));
await page.screenshot({path:path.join(OUTPUT,'course-desktop.png'),fullPage:true});
for(const[track,count]of[['business',15],['consumer',12],['all',18]]){await page.locator('[data-track='+track+']').click();check('track '+track,await page.locator('.chapter-card').count()===count);}
async function go(hash){await page.evaluate(h=>{location.hash=h},hash);await page.waitForFunction(h=>location.hash===h||location.hash===h.replace('#',''),hash);await page.waitForTimeout(20);}
async function answerQuestion(form,q,value){if(q.type==='mcq')await form.locator('input[value="'+value+'"]').check();else await form.locator('[name=answer]').fill(String(value));await form.locator('button[type=submit]').click();}
for(const lesson of data.lessons){
 await go('#lesson/'+lesson.id);await page.locator('#lesson-title').filter({hasText:lesson.title}).waitFor();
 check('chapter complete '+lesson.id,await page.locator('#lesson-content .example-card').count()===lesson.examples.length&&await page.locator('#lesson-content .quiz-card').count()===4&&await page.locator('#case-answer').count()===1);
 const forms=page.locator('#lesson-content .quiz-card');
 for(let i=0;i<lesson.quiz.length;i++){
  const q=lesson.quiz[i];const form=forms.nth(i);await answerQuestion(form,q,q.type==='short'?'Jag avgränsar prisdel, volym, period och kvarvarande risk.':q.correct);
  check('facit '+q.id,(await form.locator('.quiz-feedback').innerText()).includes(q.type==='short'?'Bedöm ditt svar':'Rätt svar'));
 }
}
await go('#lesson/energi-effekt');await page.locator('#bookmark-lesson').click();await page.locator('#lesson-notes').fill('Kom ihåg enheterna: 1 MWh = 1000 kWh.');await page.locator('#case-answer').fill('Visa rätt period, enhet och omfattning.');await page.locator('#complete-lesson').click();await go('#lesson/elhandel-elnat');await go('#lesson/energi-effekt');
check('notes survive navigation',(await page.locator('#lesson-notes').inputValue()).includes('1000 kWh'));
await page.reload();await page.locator('#course-app').waitFor({state:'visible'});check('completion/bookmark/notes survive reload',await page.locator('#complete-lesson').getAttribute('aria-pressed')==='true'&&await page.locator('#bookmark-lesson').getAttribute('aria-pressed')==='true'&&(await page.locator('#lesson-notes').inputValue()).includes('1000 kWh'));
check('checked answers survive reload',await page.locator('#lesson-content .quiz-feedback:visible').count()===4);
await page.locator('#lesson-search').fill('zzzznomatch');check('chapter empty search',await page.locator('#chapter-list .empty-state').count()===1);await page.locator('#lesson-search').fill('');
for(const track of ['business','consumer']){await go('#assessment/'+track);await page.locator('#assessment-track').selectOption(track);check('twenty final questions '+track,await page.locator('#assessment-content .quiz-card').count()===20);for(let i=0;i<20;i++){const q=data.final_assessment[track][i],form=page.locator('#assessment-content .quiz-card').nth(i);await answerQuestion(form,q,q.type==='short'?'Mitt resonemang anger prisets omfattning, volymgrund, risk och nödvändiga uppgifter.':q.correct);check('final facit '+q.id,(await form.locator('.quiz-feedback').innerText()).includes(q.type==='short'?'Bedöm ditt svar':'Rätt svar'));}}
await go('#glossary');check('65 terms',await page.locator('.glossary-card').count()===65);await page.locator('#glossary-search').fill('EPAD');check('glossary finds EPAD',await page.locator('.glossary-card').count()>0);await page.locator('#glossary-search').fill('');
await go('#tools');check('weighted 80',/80/.test(await page.locator('#weighted-result strong').innerText()));check('hedge 64',/64/.test(await page.locator('#hedge-result strong').innerText()));
await page.locator('#winter-price').fill('-50');await page.locator('#weighted-form button').click();check('negative price allowed',/(−|-)?10/.test(await page.locator('#weighted-result strong').innerText()));
await page.locator('#winter-volume').fill('0');await page.locator('#summer-volume').fill('0');await page.locator('#weighted-form button').click();check('zero total guarded',await page.locator('#weighted-result .error-text').count()===1);
await page.locator('#winter-volume').fill('1e308');await page.locator('#summer-volume').fill('1e308');await page.locator('#weighted-form button').click();check('overflow guarded',await page.locator('#weighted-result .error-text').count()===1);
await page.locator('#winter-volume').fill('600000');await page.locator('#summer-volume').fill('400000');await page.locator('#winter-price').fill('100');await page.locator('#weighted-form button').click();
await page.locator('#actual-volume').fill('60');await page.locator('#hedge-form button').click();check('overhedge 133.33',(await page.locator('#hedge-result strong').innerText()).includes('133,33'));
for(const width of[320,390,1440]){await page.setViewportSize({width,height:900});for(const hash of['#overview','#lesson/kraftringen-stabil','#assessment/consumer','#glossary','#tools']){await go(hash);check('no overflow '+width+' '+hash,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
await page.setViewportSize({width:390,height:844});await go('#overview');await page.screenshot({path:path.join(OUTPUT,'course-mobile.png'),fullPage:true});await go('#lesson/kraftringen-stabil');await page.screenshot({path:path.join(OUTPUT,'course-lesson-mobile.png'),fullPage:true});
check('unrelated portal data retained',await page.evaluate(()=>localStorage.getItem('partnerlabb.portal.v2'))==='{"qa":"unrelated"}');
const fail=await browser.newContext();await fail.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('QA unavailable storage')}});const failPage=await fail.newPage();await failPage.goto(base+'/elakademin.html#lesson/energi-effekt');await failPage.locator('#complete-lesson').click();check('save failure honestly reported',(await failPage.locator('#storage-status').innerText()).includes('kunde inte spara'));await fail.close();
if(errors.length)console.log(JSON.stringify({browser_errors:errors}));check('no browser errors',errors.length===0);
fs.writeFileSync(path.join(OUTPUT,'full-course-qa-results.json'),JSON.stringify({status:'passed',checks,errors,data_scope:'All 18 canonical chapters and 40 final questions; video playback checked separately'},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.passed).length,errors}));await browser.close();
})().catch(e=>{console.error(e.message.split('\n')[0]);process.exit(1)});
