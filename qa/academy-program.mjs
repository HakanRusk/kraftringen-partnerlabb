import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function boot(saved){const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://portal.example/',runScripts:'outside-only'}),w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};if(saved)w.localStorage.setItem('partnerlabb.portal.v2',saved);
for(const name of ['partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','product-catalog','partner-orders','prototype-users','academy','academy-program-data','academy-program'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));return dom;}
const dom=boot(),w=dom.window,P=w.Portal,L=P.learningProgram,A=P.prototypeUsers,O=P.orderWorkspace;
const sign=id=>assert.equal(A.signIn(id).ok,true);
const answers={grid:{g1:[1,2],g2:'60',g3:[1]},balance:{b1:[0,2],b2:'15',b3:[0]},market:{m1:[1,2],m2:'96',m3:[1]},price:{p1:'125',p2:'560',p3:[0,1,3]},hedge:{h1:'64',h2:'80',h3:[1,2]},individual:{i1:[1,2],i2:'80',i3:[1]},pool:{o1:[0,2],o2:'100',o3:[1]},direct:{d1:[0],d2:[0,2],d3:'50'},stable:{s1:[0,1],s2:'4000',s3:[0]},advice:{a1:[0,1],a2:[1],a3:[0,1,3]}};
sign('demo-vast-seller-1');P.go('academy');assert.match(w.document.querySelector('#view').textContent,/0 av 10/);assert.equal(L.start('price').ok,false);
const beforeOrders=JSON.stringify(P.state.orderWorkspace),legacy=JSON.stringify(P.state.training);
const customer=O.customers().find(c=>c.type==='private'),input={customerId:customer.id,category:'consumer',product:'Kraftringen Opti',facilities:[{installationId:'',annualKwh:'',area:'SE4'}]};
assert.equal(O.saveOrder(input).ok,false);assert.equal(JSON.stringify(P.state.orderWorkspace),beforeOrders);
let t=L.start('grid');let r=L.submit(t.token,{...answers.grid,g2:'30'});assert.equal(r.score,2);assert.equal(r.passed,false);assert.equal(L.passed('grid'),false);assert.equal(L.start('balance').ok,false);
t=L.start('grid');assert.equal(L.submit(t.token,{...answers.grid,g1:[1,1]}).passed,false,'duplicate selections cannot pass');
t=L.start('grid');const oldSave=P.save;P.save=()=>false;assert.equal(L.submit(t.token,answers.grid).ok,false);assert.equal(L.passed('grid'),false);P.save=oldSave;
assert.equal(L.submit(t.token,answers.grid).passed,true);assert.equal(L.submit(t.token,answers.grid).ok,false,'attempt can only be submitted once');
t=L.start('balance');sign('demo-vast-seller-2');assert.equal(L.submit(t.token,answers.balance).ok,false);assert.equal(L.passed('grid'),false);sign('demo-vast-seller-1');
for(const id of ['balance','market','price','hedge']){t=L.start(id);assert.equal(t.ok,true,id);assert.equal(L.submit(t.token,answers[id]).passed,true,id);}
assert.equal(L.check('consumer','Kraftringen Opti').ok,true);assert.equal(L.check('business','Kraftringen Stabil').ok,false);const savedOrder=O.saveOrder(input);assert.equal(savedOrder.ok,true);
for(const id of ['individual','pool','direct','stable','advice']){t=L.start(id);assert.equal(t.ok,true,id);assert.equal(L.submit(t.token,answers[id]).passed,true,id);}
assert.equal(L.check('business','Kraftringen Stabil').ok,true);assert.equal(JSON.stringify(P.state.training),legacy,'old progress preserved');
assert.equal(L.configure('consumer','Kraftringen Opti',[]).ok,false);sign('demo-vast-manager');assert.equal(L.check('consumer','Kraftringen Opti').ok,false,'manager has own requirements');assert.equal(L.configure('consumer','Kraftringen Opti',[]).ok,false);
let calls=0;w.fetch=async()=>{calls++;throw Error('no network expected');};const ownDraft=O.orders().find(r=>r.status==='draft');if(ownDraft){assert.equal((await O.sendMail(ownDraft.id)).ok,false);assert.equal(calls,0);}
sign('demo-internal');assert.equal(L.check('business','Kraftringen Stabil').ok,true);assert.equal(L.configure('consumer','Kraftringen Opti',[]).ok,false);
sign('demo-admin');assert.equal(L.configure('consumer','Kraftringen Opti',['stable']).ok,true);assert.deepEqual(Array.from(L.required('consumer','Kraftringen Opti')),['grid','balance','market','price','hedge','stable']);const original=JSON.stringify(P.state.learningProgram);P.save=()=>false;assert.equal(L.configure('consumer','Kraftringen Opti',[]).ok,false);assert.equal(JSON.stringify(P.state.learningProgram),original);P.save=oldSave;
assert.equal(L.configure('consumer','Kraftringen Opti',[]).ok,true);sign('demo-vast-manager');assert.equal(L.check('consumer','Kraftringen Opti').ok,true);
sign('demo-customer');assert.equal(L.start('grid').ok,false);assert.equal(L.check('consumer','Kraftringen Opti').ok,false);P.go('academy');assert.notEqual(P.page,'academy');
const reloaded=boot(w.localStorage.getItem('partnerlabb.portal.v2'));reloaded.window.Portal.prototypeUsers.signIn('demo-vast-seller-1');assert.equal(reloaded.window.Portal.learningProgram.passed('advice'),true,'persisted and user scoped after reload');reloaded.window.PartnerLearningContent.modules[0].version++;assert.equal(reloaded.window.Portal.learningProgram.passed('advice'),false,'version change invalidates dependent approvals');reloaded.window.Portal.state.learningProgram={schema:999};assert.equal(reloaded.window.Portal.learningProgram.check('business','Kraftringen Stabil').ok,false,'corrupt state fails closed');
reloaded.window.Portal.state.learningProgram={schema:1,people:{},policies:{'consumer|Kraftringen Opti':['missing-module']},audit:[]};assert.equal(reloaded.window.Portal.learningProgram.check('consumer','Kraftringen Opti').ok,false,'unknown policy modules fail closed');
reloaded.window.close();dom.window.close();console.log('PASS academy: 30 applied questions, all-correct threshold, prerequisites, identity isolation, persistence/versioning, order/mail gates, admin policy and rollback');
