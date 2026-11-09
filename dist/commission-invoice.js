(() => {
  'use strict';
  const P=window.Portal,C=P?.face2faceCommission;if(!C)return;
  const allowed=()=>P.partner==='vast'&&P.prototypeUsers?.commission()&&P.prototypeUsers.scope(P.partner);
  const names=['Godkända avtal','Bindande avtal som täcks av förskott','Bindande avtal utöver förskotten'];
  function panel(c,example,subset){
    if(!allowed())return '';
    const blocked=example||c.missing.length||!c.cohorts.length;
    return `<section class="card oc-invoice" aria-labelledby="oc-invoice-title"><h2 id="oc-invoice-title">Fakturaunderlag · ${P.e(C.monthLabel(c.month))}</h2><p>${subset?'Avgränsat underlag: endast de 90 nya exempelordrarna.':'Hela partnerns lokala försäljningsunderlag, oavsett säljarurval.'} Förskott avräknas mot samma godkännandemånad.</p><div class="table-wrap"><table><thead><tr><th>Underlag</th><th>Antal</th><th>Ersättning exkl. moms</th></tr></thead><tbody><tr><td>${names[0]}</td><td>${c.approved}</td><td>${c.missing.length?'—':C.money(c.advance)} (80 % × 1 500 kr)</td></tr><tr><td>${names[1]}</td><td>${c.missing.length?'—':c.covered}</td><td>Ingår i förskotten</td></tr><tr><td>${names[2]}</td><td>${c.missing.length?'—':c.outside}</td><td>${c.missing.length?'—':C.money(c.extra)}</td></tr><tr><th>Total ersättning för månaden</th><td></td><th>${c.missing.length?'—':C.money(c.amount)}</th></tr></tbody></table></div><p>Om ett avtal bara delvis täcks av förskott räknas det i tredje raden, med ersättning för den återstående delen.</p><button type="button" class="btn btn-primary" id="oc-export"${blocked?' disabled':''}>Ladda ned fakturaunderlag (Excel)</button><p class="oc-export-status" id="oc-export-status" role="status">${example?'Byt till partnerns exempelordrar för att exportera.':c.missing.length?'Export kräver tillförlitliga godkännande- och bindandedatum. Komplettera underlaget eller välj uttryckligen det avgränsade exempelpaketet.':!c.cohorts.length?'Inga daterade godkännanden till och med vald månad.':'Excel innehåller fakturaunderlag, månadsöversikt, avräkning och order-ID:n. Det är ett preliminärt beräkningsunderlag; fakturering och betalningar registreras inte här.'}</p></section>`;
  }
  function currentReport(){
    if(!allowed())throw new Error('Fakturaunderlag visas endast för partnerns säljledare och Kraftringen.');
    if(!P.orderWorkspace?.healthy())throw new Error('Orderunderlaget kan inte läsas.');
    const selected=C.selection();
    if(selected.example)throw new Error('Välj partnerns försäljningsunderlag före export.');
    const c=C.calculate(selected.rows,selected.month);
    if(c.missing.length)throw new Error('Komplettera saknade eller felaktiga händelsedatum före export.');
    if(!c.cohorts.length)throw new Error('Inga daterade godkännanden i underlaget.');
    return {...selected,c,partner:P.partner,partnerName:P.getPartner()?.name||'Face2face',internal:P.prototypeUsers.internal(),actor:P.prototypeUsers.current().id};
  }
  const serial=d=>Math.round((Date.parse(d+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
  function months(first,last){const out=[];let m=first;while(m<=last){out.push(m);if(out.length>1200)throw new Error('Kontrollera datum: underlaget omfattar mer än 100 år.');const [y,n]=m.split('-').map(Number);m=new Date(Date.UTC(y,n,1)).toISOString().slice(0,7);}return out;}
  function buildWorkbook(){
    const report=currentReport(),{c,month,partnerName,internal,subset}=report;
    if(!window.ExcelJS?.Workbook)throw new Error('Excel-exporten kunde inte laddas. Ladda om sidan och försök igen.');
    const book=new window.ExcelJS.Workbook();book.creator='Kraftringen Partnerlabb';book.created=new Date();book.calcProperties.fullCalcOnLoad=true;
    const invoice=book.addWorksheet('Fakturaunderlag'),summary=book.addWorksheet('Månadsöversikt'),detail=book.addWorksheet('Avräkning'),orders=book.addWorksheet('Orderunderlag'),settings=book.addWorksheet('Inställningar');
    const navy='073E56',blue='EAF3F6',yellow='FFF2CC',currency='#,##0.00;(#,##0.00);"–"';
    const cell=(s,a,value)=>{s.getCell(a).value=value;};
    const formula=(s,a,f,result)=>cell(s,a,{formula:f,result});
    function title(s,text,last){s.mergeCells(1,1,1,last);cell(s,'A1',text);s.getRow(1).height=32;s.getCell('A1').font={name:'Arial',size:16,bold:true,color:{argb:navy}};}
    function note(s,row,text,last){s.mergeCells(row,1,row,last);cell(s,`A${row}`,text);s.getRow(row).height=34;s.getCell(`A${row}`).alignment={wrapText:true,vertical:'middle'};}
    function header(s,row,values){s.getRow(row).values=values;s.getRow(row).height=58;values.forEach((_,i)=>{const c=s.getCell(row,i+1);c.fill={type:'pattern',pattern:'solid',fgColor:{argb:navy}};c.font={name:'Arial',size:11,bold:true,color:{argb:'FFFFFF'}};c.alignment={wrapText:true,vertical:'middle',horizontal:'center'};});s.views=[{state:'frozen',ySplit:row}];}
    function stripe(s,row,last){s.getRow(row).height=26;for(let col=1;col<=last;col++){const c=s.getCell(row,col);c.font={name:'Arial',size:11,color:{argb:navy}};if(row%2)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:blue}};}}
    const label=subset?'ENDAST exempelpaket flow2026':'Alla partnerns lokala ordrar';
    title(settings,'Beräkningsinställningar',3);settings.addRow(['Provision per bindande avtal',C.rate]);settings.addRow(['Förskottsandel',C.advanceRate]);settings.getCell('B3').numFmt='0%';
    if(internal)settings.addRow(['Kraftringens merkostnad per bindande avtal',39]);
    settings.getColumn(1).width=55;settings.getColumn(2).width=22;settings.getColumn(3).width=20;
    for(const r of [2,3,...(internal?[4]:[])])settings.getCell(`B${r}`).fill={type:'pattern',pattern:'solid',fgColor:{argb:yellow}};
    settings.getCell('B2').dataValidation={type:'decimal',operator:'greaterThan',formulae:[0],allowBlank:false,showErrorMessage:true,error:'Ange ett belopp större än noll.'};
    settings.getCell('B3').dataValidation={type:'decimal',operator:'between',formulae:[0,1],allowBlank:false,showErrorMessage:true,error:'Ange en andel mellan 0 och 100 %.'};
    note(settings,6,'Exporten är en ögonblicksbild. Ändringar i Excel ändrar inte portalen. Belopp exkl. moms. Fulla beräknade förskott används, inte faktiska betalningar.',3);
    title(orders,partnerName+' · Orderunderlag',5);note(orders,2,label+'. Endast händelser kända till och med '+C.endOfMonth(month)+'. Order-ID är text.',5);
    header(orders,4,['Order-ID','Partner-ID','Godkänd datum','Bindande datum','Godkännandemånad']);
    const data=c.cohorts.flatMap(g=>g.orders).sort((a,b)=>a.approvedAt.localeCompare(b.approvedAt)||a.id.localeCompare(b.id));
    data.forEach((o,i)=>{const r=i+5;orders.getRow(r).values=[String(o.id),String(o.partner),serial(o.approvedAt),C.validDate(o.confirmedAt)&&o.confirmedAt<=C.endOfMonth(month)?serial(o.confirmedAt):null,o.approvedAt.slice(0,7)];stripe(orders,r,5);orders.getCell(`C${r}`).numFmt=orders.getCell(`D${r}`).numFmt='yyyy-mm-dd';});
    orders.columns.forEach((col,i)=>col.width=i===0?36:24);orders.autoFilter={from:'A4',to:`E${data.length+4}`};
    const end=data.length+4,groupRange=`Orderunderlag!$E$5:$E$${end}`,dateRange=`Orderunderlag!$D$5:$D$${end}`;
    title(detail,'Avräkning per godkännandemånad',12);
    header(detail,4,['Utfallsmånad','Godkännandemånad','Godkända avtal','Förskott, kr','Bindande före månaden','Bindande t.o.m. månaden','Bindande under månaden','Täcks av förskott, antal','Utöver förskott, antal¹','Tidigare ersättning utöver förskott, kr','Ersättning utöver förskott denna månad, kr','Ej avräknat förskott, kr']);
    const timeline=months(c.cohorts[0].key<month.slice(0,4)+'-01'?c.cohorts[0].key:month.slice(0,4)+'-01',month),groups=new Map();let dr=5;
    const monthly=timeline.map(m=>{const v=C.calculate(report.rows,m),indices=[];
      for(const g of v.cohorts){const r=dr++;indices.push(r);detail.getRow(r).values=[m,g.key];
        formula(detail,`C${r}`,`COUNTIF(${groupRange},B${r})`,g.count);
        formula(detail,`D${r}`,`C${r}*Inställningar!$B$2*Inställningar!$B$3`,g.advance);
        const start=serial(m+'-01'),finish=serial(C.endOfMonth(m));
        formula(detail,`E${r}`,`COUNTIFS(${groupRange},B${r},${dateRange},">0",${dateRange},"<${start}")`,g.confirmed-g.newConfirmed);
        formula(detail,`F${r}`,`COUNTIFS(${groupRange},B${r},${dateRange},">0",${dateRange},"<=${finish}")`,g.confirmed);
        formula(detail,`G${r}`,`F${r}-E${r}`,g.newConfirmed);
        formula(detail,`J${r}`,`MAX(0,E${r}*Inställningar!$B$2-D${r})`,g.previousExtra);
        formula(detail,`K${r}`,`MAX(0,F${r}*Inställningar!$B$2-D${r})-J${r}`,g.extra);
        formula(detail,`I${r}`,`ROUNDUP(ROUND(K${r}/Inställningar!$B$2,10),0)`,g.outside);
        formula(detail,`H${r}`,`G${r}-I${r}`,g.covered);
        formula(detail,`L${r}`,`MAX(0,D${r}-F${r}*Inställningar!$B$2)`,g.remaining);
        stripe(detail,r,12);for(const col of ['D','J','K','L'])detail.getCell(`${col}${r}`).numFmt=currency;
      }groups.set(m,indices);return v;});
    detail.columns.forEach(col=>col.width=24);note(detail,2,'Varje grupp behåller sitt eget förskott. Ingen kvittning mellan godkännandemånader. ¹ Delvis täckta avtal räknas som utöver förskott, med ersättning enbart för återstående del.',12);
    title(summary,partnerName+' · Månadsöversikt',internal?9:7);note(summary,2,label+'. Belopp exkl. moms. Beräknad ersättning, inte utbetalt belopp.',internal?9:7);
    header(summary,4,['Månad',...names,'Förskottsbelopp, kr','Ersättning för bindande avtal utöver förskotten, kr','Total ersättning, kr',...(internal?['Kraftringens merkostnad, kr','Kraftringens totalkostnad, kr']:[])]);
    monthly.forEach((v,i)=>{const r=i+5,refs=groups.get(v.month),sum=col=>refs.length?refs.map(n=>`Avräkning!${col}${n}`).join('+'):'0';cell(summary,`A${r}`,v.month);
      formula(summary,`B${r}`,`COUNTIF(${groupRange},A${r})`,v.approved);formula(summary,`C${r}`,sum('H'),v.covered);formula(summary,`D${r}`,sum('I'),v.outside);
      formula(summary,`E${r}`,`B${r}*Inställningar!$B$2*Inställningar!$B$3`,v.advance);formula(summary,`F${r}`,sum('K'),v.extra);formula(summary,`G${r}`,`E${r}+F${r}`,v.amount);
      if(internal){formula(summary,`H${r}`,`(C${r}+D${r})*Inställningar!$B$4`,v.confirmed*39);formula(summary,`I${r}`,`G${r}+H${r}`,v.amount+v.confirmed*39);}
      stripe(summary,r,internal?9:7);for(const col of ['E','F','G',...(internal?['H','I']:[])])summary.getCell(`${col}${r}`).numFmt=currency;
    });summary.columns.forEach((col,i)=>col.width=i===0?16:29);
    const last=monthly.length+4;title(invoice,partnerName+' · Fakturaunderlag',4);note(invoice,2,'PRELIMINÄRT · '+C.monthLabel(month)+' · '+label,4);
    header(invoice,4,['Underlag','Antal avtal','Beräkningsgrund','Ersättning, kr']);
    names.forEach((name,i)=>{const r=i+5;cell(invoice,`A${r}`,name);formula(invoice,`B${r}`,`Månadsöversikt!${['B','C','D'][i]}${last}`,[c.approved,c.covered,c.outside][i]);});
    cell(invoice,'C5','Antal × förskottsandel × provision');cell(invoice,'C6','Täcks av förskott');cell(invoice,'C7','Återstående ersättning efter avräkning');
    formula(invoice,'D5',`Månadsöversikt!E${last}`,c.advance);cell(invoice,'D6',0);formula(invoice,'D7',`Månadsöversikt!F${last}`,c.extra);cell(invoice,'A9','Total ersättning för månaden');formula(invoice,'D9','D5+D7',c.amount);
    note(invoice,11,'Underlaget visar rätten till ersättning. Tidigare fakturering och genomförda betalningar finns inte registrerade i portalen och måste stämmas av separat före fakturering.',4);
    note(invoice,13,'Bindande avtal räknas när ångerperioden passerats enligt registrerat bindandedatum. Ett avtal kan ha godkänts en tidigare månad. Delvis täckta avtal ligger i tredje raden; endast återstående belopp ersätts.',4);
    note(invoice,15,'Skapad '+new Date().toISOString().slice(0,10)+'. Lokala prototypdata. Exporten skickar ingen faktura och ändrar ingen orderstatus.',4);
    invoice.columns=[{width:49},{width:17},{width:43},{width:24}];[5,6,7,9].forEach(r=>{stripe(invoice,r,4);invoice.getRow(r).height=42;invoice.getCell(`A${r}`).alignment={wrapText:true,vertical:'middle'};invoice.getCell(`C${r}`).alignment={wrapText:true,vertical:'middle'};invoice.getCell(`D${r}`).numFmt=currency;});invoice.getRow(9).font={bold:true,color:{argb:navy}};
    invoice.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1,printArea:'A1:D15'};
    for(const sheet of book.worksheets){sheet.properties.defaultRowHeight=24;sheet.views=[{...sheet.views?.[0],showGridLines:false}];}
    return {book,report,filename:`Fakturaunderlag_${report.partner}_${month}${subset?'_urval':''}.xlsx`};
  }
  async function download(){
    const button=document.querySelector('#oc-export'),status=document.querySelector('#oc-export-status');if(button)button.disabled=true;
    try{const {book,report,filename}=buildWorkbook();if(status)status.textContent='Skapar Excel-filen…';const buffer=await book.xlsx.writeBuffer();
      // Re-check identity and partner after asynchronous serialization.
      if(!allowed()||P.prototypeUsers.current().id!==report.actor||P.partner!==report.partner)throw new Error('Demokonto eller partner ändrades. Öppna fakturaunderlaget på nytt.');
      const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);if(status)status.textContent='Excel-filen har skapats. Kontrollera tidigare fakturering separat.';
    }catch(error){if(status)status.textContent=error.message||'Exporten kunde inte skapas. Försök igen.';else P.toast(error.message||'Exporten kunde inte skapas.');}finally{if(button)button.disabled=!allowed();}
  }
  const previousBind=C.bind;C.bind=()=>{previousBind();const button=document.querySelector('#oc-export');if(button)button.onclick=download;};
  P.commissionInvoice={panel,allowed,buildWorkbook,download};
})();
