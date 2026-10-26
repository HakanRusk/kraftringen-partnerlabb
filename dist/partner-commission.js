(() => {
  'use strict';
  const P=window.Portal;if(!P)return;
  const rate=1500,advanceRate=.8;
  const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  const endOfMonth=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n,0)).toISOString().slice(0,10);};
  const priorMonth=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n-2,1)).toISOString().slice(0,7);};
  const money=n=>new Intl.NumberFormat('sv-SE',{maximumFractionDigits:0}).format(n)+' kr';
  const monthLabel=m=>new Intl.DateTimeFormat('sv-SE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-01'));
  // Approval and confirmation are events, not the order's current status or registration date.
  // Unknown legacy dates remain unknown. No inference from registration or free-text history.
  function calculate(rows,month){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Ogiltig månad');
    const end=endOfMonth(month),previousEnd=endOfMonth(priorMonth(month));
    const missing=rows.filter(r=>(['approved','confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(r.status)&&!validDate(r.approvedAt))||(['confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(r.status)&&!validDate(r.confirmedAt))||(r.confirmedAt&&(!validDate(r.approvedAt)||!validDate(r.confirmedAt)||r.confirmedAt<r.approvedAt)));
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
      return {key,count,advance,confirmed:countNow,newConfirmed:countNow-countBefore,earned,previousExtra,extra,totalExtra,remaining:Math.max(0,advance-earned),total:advance+totalExtra,orders:group};
    });
    return {month,cohorts,missing,approved:approved.filter(r=>r.approvedAt.startsWith(month)).length,confirmed:approved.filter(r=>confirmed(r)&&r.confirmedAt.startsWith(month)).length,advance:cohorts.filter(c=>c.key===month).reduce((s,c)=>s+c.advance,0),extra:cohorts.reduce((s,c)=>s+c.extra,0),get amount(){return this.advance+this.extra;}};
  }
  function example(){
    const rows=[];
    for(const [month,count,schedule] of [['01',100,[[20,'01'],[50,'02'],[20,'03'],[5,'04']]],['02',50,[[10,'02'],[20,'03'],[5,'04']]]]){
      const dates=schedule.flatMap(([n,m])=>Array(n).fill(`2026-${m}-20`));
      for(let i=0;i<count;i++)rows.push({id:`räkneexempel-${month}-${i+1}`,partner:'vast',approvedAt:`2026-${month}-10`,confirmedAt:dates[i]||'',status:dates[i]?'confirmed':'approved'});
    }return rows;
  }
  let selectedMonth='',showExample=false,onlyNewExamples=false;
  function render(rows,heading){
    if(!selectedMonth)selectedMonth=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit'}).format(new Date());
    const data=showExample?example():onlyNewExamples?rows.filter(r=>r.examplePack==='flow2026'):rows,c=calculate(data,selectedMonth),e=P.e;
    const monthKeys=[...new Set([selectedMonth,...data.flatMap(r=>[r.approvedAt,r.confirmedAt]).filter(validDate).map(d=>d.slice(0,7))])].filter(m=>m<=selectedMonth).sort().reverse();
    const metric=(label,value,text,cls='')=>`<article class="card ${cls}"><span>${label}</span><strong>${value}</strong><small>${text}</small></article>`;
    const body=`<div class="ow-page">${heading}<section class="ow-period card"><label>Provisionsmånad<input id="oc-month" type="month" value="${e(selectedMonth)}"></label><label>Orderunderlag<select id="oc-dataset"><option value="all"${!onlyNewExamples?' selected':''}>Alla lokala exempelordrar</option><option value="new"${onlyNewExamples?' selected':''}>90 nya Face2face-exempel · juli–oktober</option></select></label><p>Godkännanden och bekräftelser under vald månad.<br>Bekräftelser kan avse avtal godkända tidigare.</p><button class="btn btn-secondary" id="oc-example">${showExample?'Visa mina exempelordrar':'Visa räkneexempel januari–april'}</button></section>${showExample?'<p class="ow-notice">Fristående räkneexempel · 100 godkända i januari och 50 i februari. Inga orderdata ändras.</p>':`<p class="ow-notice">${onlyNewExamples?'90 nya exempelordrar · juli–oktober':'Alla lokala exempelordrar'} · Face2faces överenskomna beräkningsmodell · Inga fakturor eller betalningar skapas.</p>`}<div class="ow-metrics">${metric('Godkända avtal',c.approved,'Nya godkännanden under '+e(monthLabel(selectedMonth)))}${metric('Bekräftade avtal',c.confirmed,'Nya bekräftelser under månaden, även från tidigare godkännandemånader')}${metric('Berättigad provision',c.missing.length?'—':money(c.amount),c.missing.length?'Underlag saknas · komplettera händelsedatum för ett fullständigt belopp':'Nytt förskott '+money(c.advance)+' + tillägg '+money(c.extra),'oc-total')}</div>${c.missing.length?`<p class="ow-notice" role="status">${c.missing.length} äldre eller ofullständiga ordrar saknar tillförlitliga godkännande-/bekräftelsedatum. Beräkningen omfattar bara kända händelser och kan vara ofullständig. Registreringsdatum används inte som ersättning.</p>`:''}<details class="card ow-rule oc-calculation"><summary>Så här har vi räknat</summary><p>Varje godkännandemånad följs separat. Provisionen är <strong>1 500 kr per avtal</strong>. Förskottet är <strong>80 %, alltså 1 200 kr per godkänt avtal</strong>.</p><ol><li>Nya förskott: månadens godkända avtal × 1 200 kr.</li><li>Bekräftelser räknas mot förskottet för månaden då avtalen godkändes.</li><li>Nytt tillägg = det positiva belopp som återstår efter att förskott och tidigare beräknade tillägg dragits från gruppens ackumulerade bekräftelseprovision.</li></ol><p>Förskottet återkrävs inte och kvittas inte mot andra månader. Ett återstående belopp efterskänks först vid uttrycklig slutavräkning. Så länge bekräftelser kan tillkomma visas det som ännu inte avräknat. Senare bekräftelser räknas fortsatt mot samma ursprungliga förskott.</p><p>Beloppen här visar beräknad rätt till ersättning, inte att en faktura skickats eller en betalning genomförts. Pågående månads underlag är preliminärt. Registreringsmånad och aktuell orderstatus styr inte denna beräkning.</p><h3>Avräkning per godkännandemånad</h3><div class="table-wrap"><table><thead><tr><th>Godkänd månad</th><th>Godkända</th><th>Bekräftade hittills</th><th>Förskott</th><th>Bekräftelseprovision hittills</th><th>Tidigare tillägg</th><th>Nytt tillägg</th><th>Ännu inte avräknat</th></tr></thead><tbody>${c.cohorts.map(g=>`<tr><td>${e(monthLabel(g.key))}</td><td>${g.count}</td><td>${g.confirmed} av ${g.count}<progress max="${g.count}" value="${g.confirmed}" aria-label="Bekräftade avtal från ${e(monthLabel(g.key))}"></progress><small>Förskottsgräns: 80 %</small></td><td>${money(g.advance)}</td><td>${money(g.earned)}</td><td>${money(g.previousExtra)}</td><td>${money(g.extra)}</td><td>${money(g.remaining)}</td></tr>`).join('')||'<tr><td colspan="8">Inga daterade godkännanden för detta urval.</td></tr>'}</tbody></table></div><h3>Månadsutfall till och med vald period</h3><div class="table-wrap"><table><thead><tr><th>Månad</th><th>Godkända</th><th>Bekräftade</th><th>Nya förskott</th><th>Tillägg</th><th>Berättigad provision</th></tr></thead><tbody>${monthKeys.map(m=>{const v=calculate(data,m);return `<tr><td>${e(monthLabel(m))}</td><td>${v.approved}</td><td>${v.confirmed}</td><td>${money(v.advance)}</td><td>${money(v.extra)}</td><td><strong>${money(v.amount)}</strong></td></tr>`;}).join('')}</tbody></table></div><details><summary>Visa avtalen bakom beräkningen</summary><div class="table-wrap"><table><thead><tr><th>Order-ID</th><th>Godkänd</th><th>Bekräftad</th><th>Godkännandemånad</th></tr></thead><tbody>${c.cohorts.flatMap(g=>g.orders.map(r=>`<tr><td>${e(r.id)}</td><td>${e(r.approvedAt)}</td><td>${validDate(r.confirmedAt)&&r.confirmedAt<=endOfMonth(selectedMonth)?e(r.confirmedAt):'Ännu inte bekräftad i perioden'}</td><td>${e(monthLabel(g.key))}</td></tr>`)).join('')}</tbody></table></div></details></details></div>`;
    return body;
  }
  function bind(){const dataset=document.querySelector('#oc-dataset');if(dataset)dataset.onchange=()=>{onlyNewExamples=dataset.value==='new';showExample=false;P.render();};const month=document.querySelector('#oc-month');if(month)month.onchange=()=>{if(/^\d{4}-(0[1-9]|1[0-2])$/.test(month.value)){selectedMonth=month.value;P.render();document.querySelector('#oc-month')?.focus();}};const button=document.querySelector('#oc-example');if(button)button.onclick=()=>{showExample=!showExample;selectedMonth=showExample?'2026-04':'';P.render();};}
  P.face2faceCommission={calculate,example,render,bind};
})();
