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
sign('demo-vast-manager');P.go('order-commission');assert.ok(w.document.querySelector('[data-oc-export]'));assert.ok(I.allowed());assert.equal(w.document.querySelectorAll('.oc-invoice, #oc-month, .ow-metrics').length,0,'one summary and no second month selector');
const dataset=w.document.querySelector('#oc-dataset');dataset.value='new';dataset.dispatchEvent(new w.Event('change'));
C.selectMonth('2026-10');P.render();
assert.equal(w.document.querySelector('[data-oc-export]').disabled,false);
assert.equal(w.document.querySelectorAll('.oc-monthly-table').length,1);
w.document.querySelector('[data-oc-detail="2026-10"]').click();assert.match(w.document.querySelector('.oc-calculation').textContent,/Avräkning per godkännandemånad/);P.closeDialog();
const snapshot=JSON.stringify(P.state);C.selectMonth('2026-07');
w.document.querySelector('[data-oc-export="2026-10"]').click();
assert.equal(C.selection().month,'2026-10','row export uses its own month, not last inspected month');
assert.equal(JSON.stringify(P.state),snapshot);
const {book,report,filename}=I.buildWorkbook();assert.ok(report.rows.every(r=>r.partner==='vast'&&r.examplePack==='flow2026'));assert.match(filename,/2026-10_urval.xlsx/);
assert.equal(book.getWorksheet('Fakturaunderlag').getCell('D9').value.result,4500);
assert.deepEqual(['A5','A6','A7'].map(a=>book.getWorksheet('Fakturaunderlag').getCell(a).value),['Godkända avtal','Bindande avtal som täcks av förskott','Bindande avtal utöver förskotten']);
assert.equal(book.getWorksheet('Inställningar').getCell('B4').value,null,'partner does not receive internal cost');
assert.equal(book.getWorksheet('Månadsöversikt').columnCount,7);
const buffer=await book.xlsx.writeBuffer(),copy=new w.ExcelJS.Workbook();await copy.xlsx.load(buffer);
assert.equal(copy.getWorksheet('Fakturaunderlag').getCell('D9').value.result,4500);assert.match(copy.getWorksheet('Fakturaunderlag').getCell('D9').value.formula,/D5\+D7/);
assert.ok(copy.getWorksheet('Avräkning').getCell('K5').value.formula.includes('MAX('));
const matrix=copy.getWorksheet('Indata');
assert.ok(matrix);assert.equal(matrix.getCell('A5').value,'2026-07');
assert.deepEqual(['E4','F4','G4','H4'].map(a=>matrix.getCell(a).value),['2026-07','2026-08','2026-09','2026-10']);
assert.deepEqual(['E5','F5','G5','H5'].map(a=>matrix.getCell(a).value.result||0),[15,9,3,0]);
assert.equal(matrix.getCell('B8').value.result,90);assert.equal(matrix.getCell('C8').value.result,78);assert.equal(matrix.getCell('D8').value.result,12);
assert.match(matrix.getCell('E5').value.formula,/COUNTIFS/);assert.equal(copy.getWorksheet('Orderunderlag').getCell('F4').value,'Bindandemånad');
assert.equal(matrix.views[0].xSplit,1);assert.equal(matrix.views[0].ySplit,4);
const originalSelection=C.selection;
C.selection=()=>({month:'2026-02',example:false,subset:false,rows:[
 {id:'cross-year',partner:'vast',status:'confirmed',approvedAt:'2025-12-10',confirmedAt:'2026-02-01'},
 {id:'future',partner:'vast',status:'confirmed',approvedAt:'2025-12-20',confirmedAt:'2026-03-01'},
 {id:'waiting',partner:'vast',status:'approved',approvedAt:'2026-01-01',confirmedAt:''}
]});
const boundary=I.buildWorkbook().book,grid=boundary.getWorksheet('Indata');
assert.deepEqual(['E4','F4','G4'].map(a=>grid.getCell(a).value),['2025-12','2026-01','2026-02']);
assert.equal(grid.getCell('G5').value.result,1);assert.equal(grid.getCell('C7').value.result,1);assert.equal(grid.getCell('D7').value.result,2);
assert.equal(boundary.getWorksheet('Orderunderlag').getCell('F6').value,null,'future binding month is not exported');
C.selection=originalSelection;
const state=JSON.stringify(P.state);I.buildWorkbook();assert.equal(JSON.stringify(P.state),state,'export never mutates orders or statuses');
w.document.querySelector('#oc-example').click();assert.equal(w.document.querySelector('[data-oc-export]').disabled,true);assert.throws(()=>I.buildWorkbook(),/Välj partnerns/);
w.document.querySelector('#oc-example').click();
sign('demo-internal');P.previewPartner('vast');P.go('order-commission');const ds=w.document.querySelector('#oc-dataset');ds.value='new';ds.dispatchEvent(new w.Event('change'));
assert.equal(I.buildWorkbook().book.getWorksheet('Inställningar').getCell('B4').value,39);
const single=[{partner:'vast',approvedAt:'2026-01-10',confirmedAt:'2026-02-20'}];const c=C.calculate(single,'2026-02');assert.equal(c.outside,1);assert.equal(c.covered,0);assert.equal(c.extra,300);
const rows=C.example();for(const [m,covered,outside]of [['01',20,0],['02',60,0],['03',30,10],['04',5,5]]){const c=C.calculate(rows,'2026-'+m);assert.equal(c.covered,covered);assert.equal(c.outside,outside);assert.equal(c.covered+c.outside,c.confirmed);}
// Export context refreshes after switching partners: no stale Face2face data.
sign('demo-syd-manager');assert.throws(()=>I.buildWorkbook(),/endast/);
console.log('PASS invoice export: real XLSX roundtrip, formulas/cached totals, roles, partner scope, missing dates, sample distinction, partial coverage and read-only state');
dom.window.close();
