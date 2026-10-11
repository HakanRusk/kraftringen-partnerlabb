'use strict';
// Regression for product facts → full lesson → the actual originating workspace.
// External media fail deliberately: this tests navigation and existing local progress.
const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const os=require('os');
const BASE=process.env.PARTNERLABB_QA_URL||'http://127.0.0.1:8014';
const OUT=process.env.PARTNERLABB_QA_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'audit3-learning-'));
fs.mkdirSync(OUT,{recursive:true});
const course=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/elakademin-data.json')));
const courseKey='kraftringen.elakademin.full.v1.'+String(course.meta.version).replace(/[^a-z0-9._-]/gi,'-');
const checks=[],errors=[];
function check(name,ok,evidence){checks.push({name,passed:!!ok,evidence});if(!ok)throw Error(name)}
async function portalReady(p){await p.locator('#view h1').waitFor({state:'visible'})}
async function courseReady(p){await p.locator('#course-app').waitFor({state:'visible'})}
(async()=>{const b=await chromium.launch({executablePath:process.env.PARTNERLABB_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const c=await b.newContext({locale:'sv-SE',viewport:{width:1440,height:900}});await c.route('https://**/*',r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(BASE+'/?workspace=syd#product-facts');await portalReady(p);
 await p.evaluate(()=>{const P=Portal;P.state.partnerProfiles['qa-audit3-mixed']={id:'qa-audit3-mixed',name:'Blandad säljpartner Exempel',type:'sales',salesAudiences:['business','consumer']};P.state.partnerProfiles['qa-audit3-property']={id:'qa-audit3-property',name:'Fastighetsbolag Exempel',type:'property'};P.save();P.syncPartnerRegistry()});
 const scenarios=[
  {name:'intern företag',role:'internal',partner:'syd',segment:'business'},
  {name:'intern konsument',role:'internal',partner:'vast',segment:'consumer'},
  {name:'intern demo',role:'internal',partner:'estate1',segment:'business',demo:true},
  {name:'B2B partner',role:'partner',partner:'syd',segment:'business'},
  {name:'B2C partner',role:'partner',partner:'vast',segment:'consumer'},
  {name:'blandad B2B',role:'partner',partner:'qa-audit3-mixed',segment:'business'},
  {name:'blandad B2C',role:'partner',partner:'qa-audit3-mixed',segment:'consumer'},
  {name:'fastighetsbolag',role:'partner',partner:'estate1',segment:'consumer'},
  {name:'nytt fastighetsbolag',role:'partner',partner:'qa-audit3-property',segment:'consumer'},
  {name:'fastighetsdemo',role:'partner',partner:'estate2',segment:'consumer',demo:true}
 ];
 for(const scenario of scenarios){
  // Keep fixtures explicitly scoped to each portal storage surface.
  await p.goto(BASE+'/?'+(scenario.demo?'demo=inflyttning&':'')+(scenario.role==='partner'?'workspace='+scenario.partner:'')+'#product-facts');await portalReady(p);
  await p.evaluate(s=>{const P=Portal;if(s.role==='internal'){P.role='internal';P.selectedPartnerId=s.partner;P.go('product-facts')}},scenario);
  await p.locator('[data-fact-segment="'+scenario.segment+'"]').click();
  const count=await p.locator('.product-facts article').count();
  const before=await p.evaluate(()=>JSON.stringify(Portal.state));
  await p.locator('.product-facts details').first().evaluate(n=>n.open=true);
  await p.locator('.product-facts a').filter({hasText:'Se film:'}).first().click();await courseReady(p);
  const origin=new URL(p.url());
  check(scenario.name+' carries facts/segment origin',origin.searchParams.get('returnView')==='product-facts'&&origin.searchParams.get('returnSegment')===scenario.segment);
  const originalLesson=origin.hash;await p.locator('[data-track="all"]').click();await p.reload();await courseReady(p);
  check(scenario.name+' retains lesson and origin on track/reload',new URL(p.url()).hash===originalLesson&&new URL(p.url()).searchParams.get('returnView')==='product-facts');
  await p.locator('#portal-link').click();await portalReady(p);
  const actual=await p.evaluate(()=>({role:Portal.role,partner:Portal.partner,selected:Portal.selectedPartnerId,page:Portal.page,demo:Portal.demoMode,state:JSON.stringify(Portal.state)}));
  check(scenario.name+' returns to facts in the correct perspective',actual.page==='product-facts'&&actual.role===scenario.role&&(scenario.role==='partner'?actual.partner===scenario.partner:actual.selected===scenario.partner),actual);
  check(scenario.name+' preserves demo isolation',actual.demo===!!scenario.demo);
  check(scenario.name+' restores the originating product segment',await p.locator('[data-fact-segment="'+scenario.segment+'"]').getAttribute('aria-pressed')==='true'&&await p.locator('.product-facts article').count()===count);
  check(scenario.name+' leaves all portal business/training state unchanged',actual.state===before);
  await p.reload();await portalReady(p);const afterReload=await p.evaluate(()=>({role:Portal.role,partner:Portal.partner,selected:Portal.selectedPartnerId,page:Portal.page,demo:Portal.demoMode}));
  check(scenario.name+' also survives reload of the returned facts page',afterReload.page==='product-facts'&&afterReload.role===scenario.role&&(scenario.role==='partner'?afterReload.partner===scenario.partner:afterReload.selected===scenario.partner)&&afterReload.demo===!!scenario.demo,afterReload);
 }
 // Existing shared course key and saved chapter progress remain untouched by the fix.
 await p.goto(BASE+'/elakademin.html?workspace=syd&track=business&returnView=product-facts&returnSegment=business#lesson/energi-effekt');await courseReady(p);
 await p.locator('#bookmark-lesson').click();await p.locator('#complete-lesson').click();await p.locator('#lesson-notes').fill('Syntetisk anteckning om enheter.');await p.locator('#save-notes').click();const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),courseKey);await p.reload();await courseReady(p);const reloaded=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),courseKey);
 check('Original course progress key and chapter notes survive reload',JSON.stringify(reloaded.bookmarks)===JSON.stringify(saved.bookmarks)&&JSON.stringify(reloaded.completed)===JSON.stringify(saved.completed)&&JSON.stringify(reloaded.notes)===JSON.stringify(saved.notes)&&await p.locator('#bookmark-lesson').getAttribute('aria-pressed')==='true'&&await p.locator('#complete-lesson').getAttribute('aria-pressed')==='true'&&await p.locator('#lesson-notes').inputValue()==='Syntetisk anteckning om enheter.');
 for(const parameters of ['returnView=https%3A%2F%2Foutside.example&returnRole=internal','returnView=%2F%2Foutside.example&returnRole=internal','returnView=product-facts&returnRole=outside&returnSegment=%3Cscript%3E']){
  await p.goto(BASE+'/elakademin.html?workspace=syd&track=business&'+parameters+'#overview');await courseReady(p);const back=new URL(await p.locator('#portal-link').getAttribute('href'));
  check('Untrusted return values stay in known local portal routes '+parameters,back.origin===new URL(BASE).origin&&['#academy','#product-facts'].includes(back.hash)&&back.searchParams.get('factSegment')===null&&back.searchParams.get('workspace')==='syd',back.href);
 }
 check('All eighteen original chapters are still present',await p.locator('[data-track="all"]').click().then(()=>p.locator('.chapter-card').count())===course.lessons.length&&course.lessons.length===18);
 // Wait for actual audio progress, rather than assuming playback starts within 100 ms.
 const rate=8000,size=rate*3*2,audio=Buffer.alloc(44+size);audio.write('RIFF');audio.writeUInt32LE(36+size,4);audio.write('WAVE',8);audio.write('fmt ',12);audio.writeUInt32LE(16,16);audio.writeUInt16LE(1,20);audio.writeUInt16LE(1,22);audio.writeUInt32LE(rate,24);audio.writeUInt32LE(rate*2,28);audio.writeUInt16LE(2,32);audio.writeUInt16LE(16,34);audio.write('data',36);audio.writeUInt32LE(size,40);
 await p.goto(BASE+'/?workspace=vast#academy');await p.waitForFunction(()=>document.querySelector('#b2c-call-results')?.getAttribute('aria-busy')==='false');await p.locator('#b2c-call-upload').click();await p.locator('#b2c-call-title').fill('Syntetisk ljudkontroll');await p.locator('#b2c-call-note').fill('Tyst WAV för att verifiera native uppspelning.');await p.locator('#b2c-call-file').setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:audio});await p.waitForFunction(()=>!document.querySelector('#b2c-call-submit').disabled);await p.locator('#b2c-call-submit').click();await p.waitForFunction(()=>!document.querySelector('#portal-dialog').open);await p.waitForFunction(()=>document.querySelector('#b2c-call-results')?.getAttribute('aria-busy')==='false');await p.locator('[data-b2c-listen]').first().click();const player=await p.locator('#b2c-call-player').elementHandle();await player.evaluate(async a=>{a.muted=true;await a.play()});await p.waitForFunction(()=>{const a=document.querySelector('#b2c-call-player');return a&&!a.paused&&a.currentTime>=.15},null,{timeout:5000});
 check('Saved synthetic WAV playback actually advances',await player.evaluate(a=>!a.paused&&a.currentTime>=.15));await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#portal-dialog').open);await p.waitForFunction(a=>a.paused,player,{timeout:5000});check('Closing the native WAV player pauses playback',await player.evaluate(a=>a.paused));
 check('No uncaught JavaScript errors',errors.length===0,errors);
 fs.writeFileSync(path.join(OUT,'audit3-learning-results.json'),JSON.stringify({status:'passed',checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.length,errors}));
}finally{await b.close()}})().catch(e=>{fs.writeFileSync(path.join(OUT,'audit3-learning-results.json'),JSON.stringify({status:'failed',checks,errors,error:e.message},null,2));console.error(e.message.split('\n')[0]);process.exit(1)});
