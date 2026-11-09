import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://portal.example/?workspace=vast',runScripts:'outside-only'}),w=dom.window;
await new Promise(r=>w.addEventListener('load',r,{once:true}));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const name of ['vendor/exceljs-4.4.0.min','partner-setup','app','partner-crm','commercial','product-facts','partner','partner-commission','commission-invoice','product-catalog','partner-orders','prototype-users','customer-services'])w.eval(fs.readFileSync(`dist/${name}.js`,'utf8'));
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const P=w.Portal,A=P.prototypeUsers,I=P.commissionInvoice,C=P.face2faceCommission;
const sign=id=>assert.equal(A.signIn(id).ok,true);
for(const user of ['demo-vast-seller-1','demo-customer','demo-syd-manager']){sign(user);assert.equal(I.allowed(),false);assert.throws(()=>I.buildWorkbook(),/endast/);}
sign('demo-vast-manager');P.go('order-commission');assert.ok(w.document.querySelector('#oc-export'));assert.ok(I.allowed());assert.match(I.panel(C.calculate([{status:'approved'}],'2026-10'),false,false),/disabled/,'missing dates block export');
const dataset=w.document.querySelector('#oc-dataset');dataset.value='new';dataset.dispatchEvent(new w.Event('change'));
const month=w.document.querySelector('#oc-month');month.value='2026-10';month.dispatchEvent(new w.Event('change'));
assert.equal(w.document.querySelector('#oc-export').disabled,false);
const {book,report,filename}=I.buildWorkbook();assert.ok(report.rows.every(r=>r.partner==='vast'&&r.examplePack==='flow2026'));assert.match(filename,/2026-10_urval.xlsx/);
assert.equal(book.getWorksheet('Fakturaunderlag').getCell('D9').value.result,4500);
assert.deepEqual(['A5','A6','A7'].map(a=>book.getWorksheet('Fakturaunderlag').getCell(a).value),['Godkända avtal','Bindande avtal som täcks av förskott','Bindande avtal utöver förskotten']);
assert.equal(book.getWorksheet('Inställningar').getCell('B4').value,null,'partner does not receive internal cost');
assert.equal(book.getWorksheet('Månadsöversikt').columnCount,7);
const buffer=await book.xlsx.writeBuffer(),copy=new w.ExcelJS.Workbook();await copy.xlsx.load(buffer);
assert.equal(copy.getWorksheet('Fakturaunderlag').getCell('D9').value.result,4500);assert.match(copy.getWorksheet('Fakturaunderlag').getCell('D9').value.formula,/D5\+D7/);
assert.ok(copy.getWorksheet('Avräkning').getCell('K5').value.formula.includes('MAX('));
const state=JSON.stringify(P.state);I.buildWorkbook();assert.equal(JSON.stringify(P.state),state,'export never mutates orders or statuses');
w.document.querySelector('#oc-example').click();assert.equal(w.document.querySelector('#oc-export').disabled,true);assert.throws(()=>I.buildWorkbook(),/Välj partnerns/);
w.document.querySelector('#oc-example').click();
sign('demo-internal');P.previewPartner('vast');P.go('order-commission');const ds=w.document.querySelector('#oc-dataset');ds.value='new';ds.dispatchEvent(new w.Event('change'));
assert.equal(I.buildWorkbook().book.getWorksheet('Inställningar').getCell('B4').value,39);
const single=[{partner:'vast',approvedAt:'2026-01-10',confirmedAt:'2026-02-20'}];const c=C.calculate(single,'2026-02');assert.equal(c.outside,1);assert.equal(c.covered,0);assert.equal(c.extra,300);
const rows=C.example();for(const [m,covered,outside]of [['01',20,0],['02',60,0],['03',30,10],['04',5,5]]){const c=C.calculate(rows,'2026-'+m);assert.equal(c.covered,covered);assert.equal(c.outside,outside);assert.equal(c.covered+c.outside,c.confirmed);}
// Export context refreshes after switching partners: no stale Face2face data.
sign('demo-syd-manager');assert.throws(()=>I.buildWorkbook(),/endast/);
console.log('PASS invoice export: real XLSX roundtrip, formulas/cached totals, roles, partner scope, missing dates, sample distinction, partial coverage and read-only state');
dom.window.close();
