(() => {
  'use strict';
  const P=window.Portal;if(!P)return;
  const rate=1500,advanceRate=.8;
  const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  const endOfMonth=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n,0)).toISOString().slice(0,10);};
  const priorMonth=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n-2,1)).toISOString().slice(0,7);};
  const money=n=>new Intl.NumberFormat('sv-SE',{maximumFractionDigits:0}).format(n)+' kr';
  const monthLabel=m=>new Intl.DateTimeFormat('sv-SE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-01'));
  // confirmed/confirmedAt remain the legacy storage keys for Bindande avtal.
  // Approval and binding agreement are events, not the order's current status or registration date.
  // Unknown legacy dates remain unknown. No inference from registration or free-text history.
  function calculate(rows,month){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Ogiltig månad');
    const end=endOfMonth(month),previousEnd=endOfMonth(priorMonth(month));
    const earlyCancellation=r=>r.status==='lost_before_start'&&['registered','approved','needs_completion','confirmation_sent'].includes(r.cancellationFrom);
    const missing=rows.filter(r=>(['approved','needs_completion','cannot_confirm','confirmation_sent','confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(r.status)&&!(earlyCancellation(r)&&r.cancellationFrom==='registered')&&!validDate(r.approvedAt))||(['confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(r.status)&&!earlyCancellation(r)&&!validDate(r.confirmedAt))||(r.confirmedAt&&(!validDate(r.approvedAt)||!validDate(r.confirmedAt)||r.confirmedAt<r.approvedAt)));
    const approved=rows.filter(r=>validDate(r.approvedAt)&&r.approvedAt<=end);
    const confirmed=r=>validDate(r.confirmedAt)&&r.confirmedAt>=r.approvedAt;
    const keys=[...new Set(approved.map(r=>r.approvedAt.slice(0,7)))].sort();
    const cohorts=keys.map(key=>{
      const group=approved.filter(r=>r.approvedAt.startsWith(key));
      const count=group.length,advance=count*rate*advanceRate;
      const countBefore=group.filter(r=>confirmed(r)&&r.confirmedAt<=previousEnd).length;
      const countNow=group.filter(r=>confirmed(r)&&r.confirmedAt<=end).length;
      const earned=countNow*rate,previousExtra=Math.max(0,countBefore*rate-advance);
      const totalExtra=Math.max(0,earned-advance);
      const extra=Math.max(0,totalExtra-previousExtra);
      const outside=Math.ceil(Math.round(extra/rate*1e10)/1e10),covered=countNow-countBefore-outside;
      return {key,count,advance,confirmed:countNow,newConfirmed:countNow-countBefore,covered,outside,earned,previousExtra,extra,totalExtra,remaining:Math.max(0,advance-earned),total:advance+totalExtra,orders:group};
    });
    return {month,cohorts,missing,covered:cohorts.reduce((s,c)=>s+c.covered,0),outside:cohorts.reduce((s,c)=>s+c.outside,0),approved:approved.filter(r=>r.approvedAt.startsWith(month)).length,confirmed:approved.filter(r=>confirmed(r)&&r.confirmedAt.startsWith(month)).length,advance:cohorts.filter(c=>c.key===month).reduce((s,c)=>s+c.advance,0),extra:cohorts.reduce((s,c)=>s+c.extra,0),get amount(){return this.advance+this.extra;}};
  }
  function example(){
    const rows=[];
    for(const [month,count,schedule] of [['01',100,[[20,'01'],[50,'02'],[20,'03'],[5,'04']]],['02',50,[[10,'02'],[20,'03'],[5,'04']]]]){
      const dates=schedule.flatMap(([n,m])=>Array(n).fill(`2026-${m}-20`));
      for(let i=0;i<count;i++)rows.push({id:`räkneexempel-${month}-${i+1}`,partner:'vast',approvedAt:`2026-${month}-10`,confirmedAt:dates[i]||'',status:dates[i]?'confirmed':'approved'});
    }return rows;
  }
  let selectedMonth='',showExample=false,onlyNewExamples=false;
  let reportMonths=[];
  function calculationDetail(){
    const c=calculate(showExample?example():selection().rows,selectedMonth),e=P.e;
    return `<p>Varje godkännandemånad följs separat. Provisionen är <strong>1 500 kr per avtal</strong>. Förskottet är <strong>80 %, alltså 1 200 kr per godkänt avtal</strong>.</p><p><strong>Orderbekräftelse skickad är ett separat mellansteg.</strong> Utskicket ger ingen ytterligare provision. Godkännandet ger förskott, och först Bindande avtal (tidigare Bekräftad) räknas i avräkningen. Ånger sker mellan utskick och bindande avtal och ändrar inte det garanterade förskottet.</p><ol><li>Nya förskott: månadens godkända avtal × 1 200 kr.</li><li>Bindande avtal räknas mot förskottet för månaden då avtalen godkändes.</li><li>Ersättning för bindande avtal utöver förskotten = det positiva belopp som återstår efter att förskott och tidigare beräknad ersättning utöver förskotten dragits från gruppens ackumulerade provision för bindande avtal.</li></ol><p>Förskottet återkrävs inte och kvittas inte mot andra månader. Ett återstående belopp efterskänks först vid uttrycklig slutavräkning. Så länge fler avtal kan bli bindande visas det som ännu inte avräknat. Avtal som blir bindande senare räknas fortsatt mot samma ursprungliga förskott.</p><p>Beloppen här visar beräknad rätt till ersättning, inte att en faktura skickats eller en betalning genomförts. Pågående månads underlag är preliminärt. Registreringsmånad och aktuell orderstatus styr inte denna beräkning.</p><h3>Avräkning per godkännandemånad</h3><div class="table-wrap"><table><thead><tr><th>Godkänd månad</th><th>Godkända</th><th>Bindande hittills</th><th>Förskott</th><th>Provision för bindande avtal hittills</th><th>Tidigare ersättning utöver förskotten</th><th>Ersättning utöver förskotten</th><th>Ännu inte avräknat</th></tr></thead><tbody>${c.cohorts.map(g=>`<tr><td>${e(monthLabel(g.key))}</td><td>${g.count}</td><td>${g.confirmed} av ${g.count}<progress max="${g.count}" value="${g.confirmed}" aria-label="Bindande avtal från ${e(monthLabel(g.key))}"></progress><small>Förskottsgräns: 80 %</small></td><td>${money(g.advance)}</td><td>${money(g.earned)}</td><td>${money(g.previousExtra)}</td><td>${money(g.extra)}</td><td>${money(g.remaining)}</td></tr>`).join('')||'<tr><td colspan="8">Inga daterade godkännanden för detta urval.</td></tr>'}</tbody></table></div><details><summary>Visa avtalen bakom beräkningen</summary><div class="table-wrap"><table><thead><tr><th>Order-ID</th><th>Godkänd</th><th>Bindande från</th><th>Godkännandemånad</th></tr></thead><tbody>${c.cohorts.flatMap(g=>g.orders.map(r=>`<tr><td>${e(r.id)}</td><td>${e(r.approvedAt)}</td><td>${validDate(r.confirmedAt)&&r.confirmedAt<=endOfMonth(selectedMonth)?e(r.confirmedAt):'Ännu inte bindande i perioden'}</td><td>${e(monthLabel(g.key))}</td></tr>`)).join('')}</tbody></table></div></details>`;
  }
  function render(rows,heading){
    if(!selectedMonth)selectedMonth=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit'}).format(new Date());
    const data=showExample?example():onlyNewExamples?rows.filter(r=>r.examplePack==='flow2026'):rows,e=P.e;
    return `<div class="ow-page">${heading}<section class="oc-period-overview card"><header><h2>Provision och fakturaunderlag</h2><p>En rad per månad. Se beräkningen eller ladda ned månadens fakturaunderlag direkt från raden.</p></header><div class="oc-report-controls">${P.periodSet.render('commission','month',reportMonths.length?reportMonths:[selectedMonth],v=>{reportMonths=v;selectedMonth=v[0];})}<div class="oc-detail-controls"><label>Orderunderlag<select id="oc-dataset"><option value="all"${!onlyNewExamples?' selected':''}>Alla lokala exempelordrar</option><option value="new"${onlyNewExamples?' selected':''}>90 nya Face2face-exempel · juli–oktober</option></select></label><button class="btn btn-secondary" id="oc-example">${showExample?'Visa mina exempelordrar':'Visa räkneexempel januari–april'}</button></div></div><p class="oc-period-note">Godkända och nya bindande avtal under respektive månad. Bindande avtal avräknas mot förskottet för sin godkännandemånad.</p>${showExample?'<p class="ow-notice">Fristående räkneexempel. Byt till partnerns exempelordrar för att exportera.</p>':''}<div class="table-wrap"><table class="oc-monthly-table"><thead><tr><th>Månad</th><th>Godkända avtal</th><th>Bindande avtal</th><th>Nytt förskott</th><th>Tillägg utöver förskott</th><th>Total provision</th><th>Underlag</th></tr></thead><tbody>${(reportMonths.length?reportMonths:[selectedMonth]).map(m=>{const v=calculate(data,m),blocked=showExample||v.missing.length||!v.cohorts.length,reason=showExample?'Räkneexempel kan inte exporteras.':v.missing.length?'Underlag saknas: komplettera händelsedatum.':!v.cohorts.length?'Inga daterade godkännanden.':'';return `<tr data-oc-month-row="${m}"><th scope="row">${e(monthLabel(m))}</th><td>${v.approved}</td><td>${v.missing.length?'—':v.confirmed}</td><td>${v.missing.length?'—':money(v.advance)}</td><td>${v.missing.length?'—':money(v.extra)}</td><td><strong>${v.missing.length?'Underlag saknas':money(v.amount)}</strong></td><td><div class="oc-row-actions"><button class="text-button" data-oc-detail="${m}" aria-label="Visa beräkning för ${e(monthLabel(m))}">Visa beräkning</button><button class="btn btn-secondary" data-oc-export="${m}" aria-label="Ladda ned fakturaunderlag för ${e(monthLabel(m))}"${blocked?' disabled':''}>Fakturaunderlag (Excel)</button></div>${reason?`<small>${reason}</small>`:''}<span role="status" data-oc-export-status="${m}"></span></td></tr>`;}).join('')}</tbody></table></div><p class="oc-period-note">Preliminärt beräkningsunderlag, exkl. moms. Excel innehåller fakturaunderlag, månadsöversikt, Indata med godkännande-/bindandematris, avräkning och order-ID:n. Tidigare fakturering och betalningar behöver stämmas av separat.</p></section></div>`;
  }
  function bind(){
    document.querySelectorAll('[data-oc-detail]').forEach(b=>b.onclick=()=>{selectedMonth=b.dataset.ocDetail;P.openDialog('Beräkning · '+monthLabel(selectedMonth),'<div class="oc-calculation">'+calculationDetail()+'</div>');});
    const dataset=document.querySelector('#oc-dataset');if(dataset)dataset.onchange=()=>{onlyNewExamples=dataset.value==='new';showExample=false;P.render();};
    const button=document.querySelector('#oc-example');if(button)button.onclick=()=>{showExample=!showExample;reportMonths=[];selectedMonth=showExample?'2026-04':'';P.render();};
  }
  const selection=()=>({month:selectedMonth,example:showExample,subset:onlyNewExamples,rows:(P.orderWorkspace?.orders()||[]).filter(r=>r.partner===P.partner&&(!onlyNewExamples||r.examplePack==='flow2026'))});
  P.face2faceCommission={calculate,example,render,bind,selectMonth:month=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Ogiltig månad');selectedMonth=month;},selection,rate,advanceRate,validDate,endOfMonth,monthLabel,money};
})();
