import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;
let actor='seller',spoke=[],cancelled=0,timers=[],next=1;
w.Portal={e:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),prototypeUsers:{current:()=>({id:actor})}};
w.setTimeout=fn=>{timers.push({fn,id:next});return next++;};w.clearTimeout=id=>timers=timers.filter(t=>t.id!==id);
for(const f of ['academy-program-data.js','academy-film-data.js','academy-film.js'])w.eval(readFileSync('dist/'+f,'utf8'));
const api=w.Portal.learningFilms,modules=w.PartnerLearningContent.modules;
assert.equal(Object.keys(api.data).length,10);for(const m of modules){assert.equal(api.data[m.id].length,5);assert(api.data[m.id].every(s=>s.length===3&&s[2].length>200));}
function mount(id='grid'){const m=modules.find(m=>m.id===id);w.document.body.innerHTML=api.render(m)+'<section class="lp-assessment"></section>';api.bind(m);return s=>w.document.querySelector(s);}
let $=mount();assert.equal(timers.length,0);$('[data-lf-play]').click();assert.equal(timers.length,1);assert.match($('.lf-status').textContent,/Ingen svensk/);let initial=$('.lf-subtitle').textContent;timers.shift().fn();assert.notEqual($('.lf-subtitle').textContent,initial);$('[data-lf-play]').click();assert.equal(timers.length,0);$('[data-lf-play]').click();for(let i=0;i<200&&timers.length;i++)timers.shift().fn();assert.equal($('[data-lf-exam]').hidden,false);assert.equal($('.lf-progress').value,5);assert.equal(w.Portal.state,undefined);$('[data-lf-play]').click();assert.match($('.lf-kicker').textContent,/1\/5/);
api.stop();assert.equal(timers.length,0);
w.speechSynthesis={getVoices:()=>[{lang:'sv-SE'}],speak:u=>spoke.push(u),cancel:()=>cancelled++};w.SpeechSynthesisUtterance=function(text){this.text=text;};
$=mount('stable');$('[data-lf-play]').click();assert.equal(spoke.length,1);initial=$('.lf-subtitle').textContent;spoke.at(-1).onend();assert.notEqual($('.lf-subtitle').textContent,initial);const stale=spoke.at(-1).onend;$('[data-lf-next]').click();const after=$('.lf-subtitle').textContent;stale();assert.equal($('.lf-subtitle').textContent,after);spoke.at(-1).onerror();assert.equal(timers.length,1);assert.match($('.lf-status').textContent,/Ljudet kunde inte/);api.stop();assert.equal(timers.length,0);
$=mount();$('[data-lf-play]').click();w.document.body.innerHTML='';await Promise.resolve();assert(cancelled>0);assert.equal(timers.length,0);
$=mount();$('[data-lf-play]').click();const before=cancelled;actor='other';w.document.body.appendChild(w.document.createElement('div'));await Promise.resolve();assert(cancelled>before);
console.log('academy-film: 10 scripts/50 scenes, autoplay subtitles, pause, replay, end, speech/error, stale callbacks, navigation/account cleanup; no course certification mutation');dom.window.close();
