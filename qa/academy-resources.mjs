import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const w=new JSDOM('<main id="view"></main>',{runScripts:'outside-only',url:'https://portal.example/'}).window;
let courseBindings=0,legacyBindings=0,stops=0,callBindings=0;
const P=w.Portal={page:'academy',partner:'vast',state:{learningProgram:{people:{seller:{grid:{score:3}}}}},e:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),routes:{academy:{render:()=>'<h1>Kurser</h1>',bind:()=>courseBindings++},'academy-library':{render:()=>'<h1>Äldre material</h1>',bind:()=>legacyBindings++}},register(k,v){this.routes[k]=v;},go(k){this.page=k;this.render();},render(){w.document.querySelector('#view').innerHTML=this.routes[this.page].render();this.routes[this.page].bind();},learningFilms:{stop:()=>stops++},b2cCalls:{eligible:()=>true,render:()=>'<div id="b2c-call-library">Inspelningar</div>',bind:()=>callBindings++}};
w.PartnerLearningContent={sources:{one:['Källa','https://example.org/']}};
w.eval(readFileSync('dist/academy-resources.js','utf8'));
const before=JSON.stringify(P.state);P.render();assert.equal(courseBindings,1);
const open=id=>w.document.querySelector(`[data-ar-page="${id}"]`).click();
open('films');assert.equal(P.page,'academy-library');assert.equal(w.document.querySelectorAll('a[href*="#lesson/"]').length,18);assert(!w.document.body.textContent.includes('[object Object]'));assert.equal(w.document.querySelectorAll('a[href$=".pptx"]').length,1);
open('calls');assert.equal(callBindings,1);assert.match(w.document.body.textContent,/Fiktivt dialogexempel/);
open('scripts');assert.match(w.document.body.textContent,/övningsmanus/);
open('invoice');w.document.querySelector('[data-ar-invoice="1"]').click();assert.match(w.document.querySelector('#ar-invoice-explain').textContent,/rörligt påslag/);assert.match(w.document.body.textContent,/560 kr/);
open('links');assert.equal(w.document.querySelector('a').href,'https://example.org/');open('films');w.document.querySelector('[data-ar-legacy]').click();assert.equal(legacyBindings,1);open('courses');assert.equal(courseBindings,2);assert.equal(JSON.stringify(P.state),before);assert(stops>0);
w.eval(readFileSync('dist/academy-film-visuals.js','utf8'));for(const id of ['grid','balance','market','price','hedge','individual','pool','direct','stable','advice']){for(let i=0;i<5;i++){const html=P.learningIllustration(id,i);assert.match(html,/role="img"/);assert.match(html,/<figcaption>/);assert(!html.includes('undefined'));}}
console.log('PASS resource navigation, 18 retained films, legacy access, calls, invoice interaction, untouched approvals and 50 accessible illustrations');w.close();
