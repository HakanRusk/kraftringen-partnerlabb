(() => {
  'use strict';
  const P = window.Portal;
  const source = P && P.partnerResultsData;
  if (!source) return;

  // Immutable, fictional ledgers for the shared sales-partner reports. Fixtures
  // reconcile with the anonymous aggregate reports; editable briefs and move-in
  // registrations never generate customers, agreements, MWh or remuneration.
  const cutoff = source.cutoff;
  const catalog = source.segmentCatalog;
  const DAY = 86400000;
  const date = value => new Date(`${value}T00:00:00Z`);
  const iso = value => value.toISOString().slice(0,10);
  const addDays = (value, count) => iso(new Date(date(value).getTime() + count * DAY));
  const daysBetween = (start, end) => Math.round((date(end)-date(start))/DAY);
  const inclusiveDays = (start, end) => end && end >= start ? daysBetween(start,end)+1 : 0;
  const monthEnd = month => iso(new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)));
  const monthLabel = month => new Intl.DateTimeFormat('sv-SE',{month:'long',year:'numeric',timeZone:'UTC'}).format(date(`${month}-01`));
  const hash = value => [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const all = value => value==null || value==='' || value==='all';
  const statusLabels = Object.freeze({active:'Aktiv kund',pending:'Väntar på avtalsstart',ended:'Avslutad kund',cancelled:'Bortfall före start'});
  const fixtureNames = Object.freeze({syd:'Savera',vast:'Face2face'});

  function statusAt(row, asOf) {
    if(!asOf || row.soldDate>asOf) return null;
    if(row.cancelledDate && row.cancelledDate<=asOf) return 'cancelled';
    if(!row.startDate || row.startDate>asOf) return 'pending';
    if(row.endDate && row.endDate<=asOf) return 'ended';
    return 'active';
  }
  function frozenLedger(rows) {
    return Object.freeze(rows.map(row => {
      const status=statusAt(row,cutoff);
      return Object.freeze({...row,status,statusLabel:statusLabels[status]});
    }));
  }
  function buildLedger(partnerId) {
    const salesCells=source.rows({partnerIds:[partnerId]});
    const products=source.productCatalog[partnerId];
    const sellers=[...new Set(salesCells.map(row=>row.seller))];
    const regions=[...new Set(salesCells.map(row=>row.region))];
    const model=source.fixtureModel;
    const segment=partnerId==='syd' ? 'business' : 'consumer';
    const prefix=partnerId==='syd' ? 'SV' : 'F2F';
    const domain=partnerId==='syd' ? 'savera.example' : 'face2face.example';
    const name=fixtureNames[partnerId];
    const raw=[];
    let sequence=0;
    source.months.forEach((month,monthIndex) => {
      const sold=salesCells.filter(row=>row.month===month).flatMap(cell => {
        const floor=cell.agreements ? Math.floor(cell.annualMWh/cell.agreements) : 0;
        const remainder=cell.annualMWh-floor*cell.agreements;
        return Array.from({length:cell.agreements},(_,index) => ({
          product:cell.product,seller:cell.seller,region:cell.region,
          annualMWh:floor+(index<remainder ? 1 : 0),
          order:hash(`${month}:${cell.product}:${cell.seller}:${cell.region}:${index}`)
        }));
      }).sort((a,b)=>a.order-b.order || a.product.localeCompare(b.product));
      const observedEnd=monthEnd(month)>cutoff ? cutoff : monthEnd(month);
      const observedDays=inclusiveDays(`${month}-01`,observedEnd);
      sold.forEach((part,index) => {
        sequence++;
        const id=`${prefix}-2026-${String(sequence).padStart(4,'0')}`;
        const soldDate=`${month}-${String(1+Math.floor((index+0.5)*observedDays/sold.length)).padStart(2,'0')}`;
        // Savera retains its existing row IDs, dates and dimension allocation.
        const activated=partnerId==='syd' && index<model.activeEntries.syd[monthIndex];
        const cancelled=partnerId==='syd'
          ? !activated && index<model.activeEntries.syd[monthIndex]+model.preStartTotals.syd[monthIndex]
          : index>=sold.length-model.preStartTotals.vast[monthIndex];
        const nextDay=addDays(soldDate,1)>observedEnd ? observedEnd : addDays(soldDate,1);
        const customer=segment==='business' ? `Exempelbolag ${String(sequence).padStart(3,'0')} AB` : `Exempelkund ${String(sequence).padStart(3,'0')}`;
        raw.push({id,customerId:`K-${id}`,customer,name:customer,email:`kund${sequence}@${domain}`,
          partner:partnerId,segment,utility:'Elhandel',product:part.product,seller:part.seller,region:part.region,
          annualMWh:part.annualMWh,soldDate,
          startDate:activated ? nextDay : cancelled ? null : `2026-11-${String(1+sequence%25).padStart(2,'0')}`,
          endDate:null,cancelledDate:cancelled ? nextDay : null,
          opening:false,fictional:true,source:`Fiktivt kundunderlag · ${name}`});
      });
    });

    // Separately stated active opening stock, never inferred from gross sales.
    for(let index=0;index<model.openingTotals[partnerId];index++) {
      const startDate=`${2019+index%7}-${String(1+index%12).padStart(2,'0')}-${String(1+index%25).padStart(2,'0')}`;
      const id=`${prefix}-OPEN-${String(index+1).padStart(4,'0')}`;
      const customer=segment==='business' ? `Exempelbolag Bas ${String(index+1).padStart(3,'0')} AB` : `Exempelkund Bas ${String(index+1).padStart(3,'0')}`;
      raw.push({id,customerId:`K-${id}`,customer,name:customer,email:`bas${index+1}@${domain}`,
        partner:partnerId,segment,utility:'Elhandel',product:products[index%products.length],
        seller:sellers[index%sellers.length],region:regions[Math.floor(index/3)%regions.length],
        annualMWh:segment==='business' ? 20+index%61 : 1+index%7,
        soldDate:addDays(startDate,-7),startDate,endDate:null,cancelledDate:null,
        opening:true,fictional:true,source:`Fiktiv ingående kundstock · ${name}`});
    }
    const openingRows=raw.filter(row=>row.opening);
    let exitIndex=0;
    source.months.forEach((month,index) => {
      const observedEnd=monthEnd(month)>cutoff ? cutoff : monthEnd(month);
      const count=model.openingExits[partnerId][index];
      for(let n=0;n<count;n++) {
        openingRows[exitIndex++].endDate=partnerId==='syd' ? `${month}-${String(10+n*5).padStart(2,'0')}`
          : addDays(`${month}-01`,Math.floor((n+0.5)*inclusiveDays(`${month}-01`,observedEnd)/count));
      }
    });
    if(partnerId==='syd') {
      [['2026-01','2026-06-18'],['2026-03','2026-09-21']].forEach(([month,endDate]) => {
        const row=raw.find(item=>!item.opening && item.soldDate.startsWith(month) && item.startDate && item.startDate<=monthEnd(month));
        if(row) row.endDate=endDate;
      });
    } else {
      // The independent Face2face activation model cannot be matched only by
      // 2026's 437 gross sales less 41 pre-start cancellations. Four explicitly
      // fictional pre-2026 pending agreements bridge its peak monthly deficit.
      // They are NOT part of the 785 active customers at 1 January. Activation
      // can occur in a later month than the sale; one 2026 agreement stays pending.
      for(let index=0;index<4;index++) {
        const id=`F2F-CARRY-${String(index+1).padStart(4,'0')}`;
        const customer=`Exempelkund Kö ${index+1}`;
        raw.push({id,customerId:`K-${id}`,customer,name:customer,email:`ko${index+1}@${domain}`,
          partner:partnerId,segment,utility:'Elhandel',product:products[index%products.length],
          seller:sellers[index%sellers.length],region:regions[index%regions.length],annualMWh:2+index,
          soldDate:`2025-12-${20+index}`,startDate:'2026-11-01',endDate:null,cancelledDate:null,
          opening:true,carryoverPending:true,fictional:true,source:'Fiktiv ingående avtalskö · Face2face'});
      }
      const activatedIds=new Set();
      source.months.forEach((month,index) => {
        const observedEnd=monthEnd(month)>cutoff ? cutoff : monthEnd(month);
        const count=model.activeEntries.vast[index];
        const candidates=raw.filter(row=>(!row.opening||row.carryoverPending) && !row.cancelledDate
          && row.soldDate<=observedEnd && !activatedIds.has(row.id)).sort((a,b)=>a.soldDate.localeCompare(b.soldDate)||a.id.localeCompare(b.id));
        if(candidates.length<count) throw new Error('Insufficient fictional Face2face activation basis');
        candidates.slice(0,count).forEach((row,n) => {
          const planned=addDays(`${month}-01`,Math.floor((n+0.5)*inclusiveDays(`${month}-01`,observedEnd)/count));
          row.startDate=planned<row.soldDate ? row.soldDate : planned;
          activatedIds.add(row.id);
        });
      });
      Object.entries(model.laterExits.vast).forEach(([entryMonth,exits]) => {
        const cohort=raw.filter(row=>(!row.opening||row.carryoverPending)&&row.startDate&&row.startDate.startsWith(entryMonth)&&row.startDate<=cutoff);
        let index=0;
        Object.entries(exits).sort(([a],[b])=>a.localeCompare(b)).forEach(([exitMonth,count]) => {
          const end=monthEnd(exitMonth)>cutoff ? cutoff : monthEnd(exitMonth);
          for(let n=0;n<count;n++) cohort[index++].endDate=addDays(`${exitMonth}-01`,Math.floor((n+0.5)*inclusiveDays(`${exitMonth}-01`,end)/count));
        });
      });
    }
    return frozenLedger(raw);
  }

  function isoWeekStart(value) {
    const match=/^(\d{4})-W(\d{2})$/.exec(String(value));
    if(!match) return null;
    const year=Number(match[1]),week=Number(match[2]);
    if(week<1||week>53) return null;
    const jan4=new Date(Date.UTC(year,0,4));
    jan4.setUTCDate(jan4.getUTCDate()-((jan4.getUTCDay()+6)%7)+(week-1)*7);
    const thursday=new Date(jan4);thursday.setUTCDate(thursday.getUTCDate()+3);
    return thursday.getUTCFullYear()===year ? iso(jan4) : null;
  }
  function isoWeek(value) {
    const d=date(value);d.setUTCDate(d.getUTCDate()+3-((d.getUTCDay()+6)%7));
    const year=d.getUTCFullYear();
    const jan4=new Date(Date.UTC(year,0,4));jan4.setUTCDate(jan4.getUTCDate()+3-((jan4.getUTCDay()+6)%7));
    return `${year}-W${String(1+Math.round((d-jan4)/(7*DAY))).padStart(2,'0')}`;
  }
  function normalizeFilters(filters={}) {
    filters=filters && typeof filters==='object' ? filters : {};
    const mode=['year','month','week'].includes(filters.mode) ? filters.mode : 'year';
    const defaultValue=mode==='year' ? '2026' : mode==='month' ? cutoff.slice(0,7) : isoWeek(cutoff);
    return {mode,value:filters.value==null || filters.value==='' ? defaultValue : String(filters.value),
      segment:['business','consumer'].includes(filters.segment) ? filters.segment : 'all',
      product:filters.product||'all',seller:filters.seller||'all',region:filters.region||'all',
      query:String(filters.query||'').trim(),status:filters.status||'all'};
  }
  function period(filters={}) {
    const {mode,value}=normalizeFilters(filters);
    let start=null,end=null,label='Ogiltig period';
    if(mode==='year' && value==='2026') {start=`${value}-01-01`;end=`${value}-12-31`;label=value;}
    else if(mode==='month' && /^2026-(0[1-9]|1[0-2])$/.test(value)) {start=`${value}-01`;end=monthEnd(value);label=monthLabel(value);}
    else if(mode==='week' && /^2026-W\d{2}$/.test(value)) {start=isoWeekStart(value);if(start) {end=addDays(start,6);label=`Vecka ${Number(value.slice(6))} · ${value.slice(0,4)}`;}}
    const valid=Boolean(start&&end);
    const observedEnd=valid && start<=cutoff ? (end<cutoff ? end : cutoff) : null;
    const observedStart=valid && start<'2026-01-01' ? '2026-01-01' : start;
    const months=valid ? source.months.filter(month=>`${month}-01`<=end&&monthEnd(month)>=start) : [];
    return Object.freeze({mode,value,start,end,observedStart,observedEnd,label,valid,
      daysObserved:valid ? inclusiveDays(observedStart,observedEnd) : 0,daysTotal:valid ? inclusiveDays(start,end) : 0,
      months:Object.freeze(months),partial:Boolean(observedEnd&&(observedEnd<end||observedStart>start)),asOf:observedEnd});
  }
  function periods(mode='year') {
    if(mode==='month') return source.months.map(value=>Object.freeze({value,label:monthLabel(value)}));
    if(mode==='week') {
      const items=[];
      for(let start=isoWeekStart('2026-W01');start<=cutoff;start=addDays(start,7)) {
        const value=isoWeek(start),p=period({mode:'week',value});items.push(Object.freeze({value,label:p.label,start:p.start,end:p.end}));
      }
      return items;
    }
    return [Object.freeze({value:'2026',label:'2026'})];
  }
  function matches(row,filters) {
    const q=filters.query.toLocaleLowerCase('sv-SE');
    return (all(filters.segment)||row.segment===filters.segment) && (all(filters.product)||row.product===filters.product)
      && (all(filters.seller)||row.seller===filters.seller) && (all(filters.region)||row.region===filters.region)
      && (!q||[row.customer,row.customerId,row.id,row.product,row.seller,row.region].some(value=>String(value||'').toLocaleLowerCase('sv-SE').includes(q)));
  }
  function atDate(row,asOf) {
    const status=statusAt(row,asOf);
    return Object.freeze({...row,status,statusLabel:statusLabels[status]||'Ej såld vid periodslut',asOf,
      observedStartDate:row.startDate&&row.startDate<=asOf ? row.startDate : null,
      observedEndDate:row.endDate&&row.endDate<=asOf ? row.endDate : null});
  }
  function duration(rows,asOf,completed=false) {
    const measured=rows.map(row=>({...row,tenureDays:Math.max(0,daysBetween(row.startDate,completed ? row.endDate : asOf))}));
    const averageDays=measured.length ? measured.reduce((sum,row)=>sum+row.tenureDays,0)/measured.length : null;
    return {count:measured.length,averageDays,averageMonths:averageDays==null ? null : averageDays/(365.25/12),rows:measured,
      minDays:measured.length ? Math.min(...measured.map(row=>row.tenureDays)) : null,maxDays:measured.length ? Math.max(...measured.map(row=>row.tenureDays)) : null};
  }

  // A pure report factory is also used by reconciliation tests for mixed sales
  // partners. Production views receive only the fixed ledger through forPartner.
  function createReport({partnerId,ledger=[],available=true}) {
    ledger=frozenLedger(ledger);
    const sellers=Object.freeze([...new Set(ledger.map(row=>row.seller))]);
    const regions=Object.freeze([...new Set(ledger.map(row=>row.region))]);
    const historicAudiences=Object.freeze([...new Set(ledger.map(row=>row.segment))]);
    function configuredAudiences() {
      const partner=P.getPartner?.(partnerId);
      const configured=partner?.salesAudiences || (partner?.audience ? [partner.audience] : historicAudiences);
      return configured.filter(segment=>Boolean(catalog[segment]));
    }
    function reportedAudiences() {return [...new Set([...configuredAudiences(),...historicAudiences])];}
    function availableForSegment(segment='all') {
      return available && (all(segment) ? historicAudiences.length>0 : historicAudiences.includes(segment));
    }
    function productsFor(segment='all') {
      const segments=all(segment) ? reportedAudiences() : reportedAudiences().filter(value=>value===segment);
      return [...new Set(segments.flatMap(value=>catalog[value]||[]))];
    }
    function query(filters={},options={}) {
      const selected=normalizeFilters(filters),p=period(selected);
      if(!available||!p.observedEnd) return [];
      const stock=options.stock===true||options.active===true;
      return ledger.filter(row=>matches(row,selected) && (stock ? statusAt(row,p.observedEnd)==='active' : row.soldDate>=p.observedStart&&row.soldDate<=p.observedEnd))
        .map(row=>atDate(row,p.observedEnd)).filter(row=>all(selected.status)||row.status===selected.status)
        .sort((a,b)=>b.soldDate.localeCompare(a.soldDate)||a.id.localeCompare(b.id));
    }
    function summary(filters={}) {
      const selected=normalizeFilters(filters),p=period(selected);
      const covered=availableForSegment(selected.segment);
      const rows=query(selected),activeRows=query(selected,{stock:true});
      const statusCounts={active:0,pending:0,ended:0,cancelled:0};rows.forEach(row=>statusCounts[row.status]++);
      return {available:covered,period:p,agreements:covered ? rows.length : null,newAgreements:covered ? rows.length : null,
        annualMWh:covered ? rows.reduce((sum,row)=>sum+row.annualMWh,0) : null,
        activeCount:covered ? new Set(activeRows.map(row=>row.customerId)).size : null,activeRows,statusCounts,rows};
    }
    function attrition(filters={}) {
      const selected=normalizeFilters(filters),p=period(selected);
      const covered=availableForSegment(selected.segment);
      // Churn follows the actual customers active just BEFORE this period. It
      // excludes new starts inside the period and compares unique customer IDs.
      const base=p.observedEnd ? ledger.filter(row=>matches(row,selected)&&statusAt(row,addDays(p.observedStart,-1))==='active') : [];
      const openingIds=new Set(base.map(row=>row.customerId));
      const exitedIds=new Set(base.filter(row=>row.endDate&&row.endDate>=p.observedStart&&row.endDate<=p.observedEnd).map(row=>row.customerId));
      // A customer remains active if another of their agreements is active at
      // the same period end; an agreement ending alone is not customer churn.
      for(const id of [...exitedIds]) if(ledger.some(row=>row.customerId===id&&statusAt(row,p.observedEnd)==='active')) exitedIds.delete(id);
      const sold=query({...selected,status:'all'});
      const cancelled=sold.filter(row=>row.cancelledDate&&row.cancelledDate<=p.observedEnd).length;
      const churn={openingCustomers:covered ? openingIds.size : null,exits:covered ? exitedIds.size : null,
        openingActive:covered ? openingIds.size : null,openingCohortExited:covered ? exitedIds.size : null,
        rate:covered&&openingIds.size ? exitedIds.size/openingIds.size : null,periodStart:p.observedStart,periodEnd:p.observedEnd,
        definition:'Kunder aktiva före periodens första observerade dag som lämnat senast periodslut, delat med samma ingående kundbas. Periodens nya kunder ingår inte i basen.'};
      const dropout={agreements:covered ? sold.length : null,cancelled:covered ? cancelled : null,
        sold:covered ? sold.length : null,preStartCancelled:covered ? cancelled : null,
        rate:covered&&sold.length ? cancelled/sold.length : null,observedThrough:p.observedEnd,
        definition:'Avtal sålda under vald period som har avbrutits före avtalsstart senast periodslut, delat med samma sålda avtal. Kvarvarande avtal är inte slutligt utvärderade.'};
      return {churn,dropout};
    }
    function insights(filters={}) {
      const selected=normalizeFilters(filters),p=period(selected),sold=query(selected);
      const covered=availableForSegment(selected.segment);
      const completedRows=available&&p.observedEnd ? ledger.filter(row=>matches(row,selected)&&row.endDate&&row.endDate>=p.observedStart&&row.endDate<=p.observedEnd
        && (all(selected.status)||selected.status==='ended')).map(row=>atDate(row,p.observedEnd)) : [];
      const activeRows=query(selected,{stock:true});
      const popularity=(covered ? productsFor(selected.segment) : []).map(product=>{
        const rows=sold.filter(row=>row.product===product);
        return {product,agreements:rows.length,annualMWh:rows.reduce((sum,row)=>sum+row.annualMWh,0),share:sold.length ? rows.length/sold.length : 0};
      }).filter(row=>all(selected.product)||row.product===selected.product).sort((a,b)=>b.agreements-a.agreements||a.product.localeCompare(b.product,'sv'));
      const trend=[];
      if(covered&&p.observedEnd) {
        if(selected.mode==='year') p.months.forEach(month=>{
          const rows=sold.filter(row=>row.soldDate.startsWith(month));
          trend.push({date:`${month}-01`,label:new Intl.DateTimeFormat('sv-SE',{month:'short',timeZone:'UTC'}).format(date(`${month}-01`)),agreements:rows.length,annualMWh:rows.reduce((sum,row)=>sum+row.annualMWh,0)});
        });
        else for(let day=p.observedStart;day<=p.observedEnd;day=addDays(day,1)) {
          const rows=sold.filter(row=>row.soldDate===day);trend.push({date:day,label:day.slice(8),agreements:rows.length,annualMWh:rows.reduce((sum,row)=>sum+row.annualMWh,0)});
        }
      }
      return {available:covered,period:p,completed:duration(completedRows,p.observedEnd,true),active:duration(activeRows,p.observedEnd),products:popularity,trend,...attrition(selected),
        retentionNote:'Avslutad kundtid mäter kunder som lämnade under vald period, även kunder som kom tidigare. Aktiv kundtid är observerad tid för kunder aktiva vid periodslut. Den visar inte när de kommer att lämna.'};
    }
    function projection(filters={}) {
      const selected=normalizeFilters(filters),p=period(selected),basis=summary(selected);
      const horizon='2026-12-31',remainingDays=daysBetween(cutoff,horizon);
      const ytd=summary({...selected,mode:'year',value:'2026'});
      const covered=availableForSegment(selected.segment);
      const valid=covered&&p.valid&&p.daysObserved>0&&basis.agreements>0&&all(selected.status);
      const dailyAgreements=valid ? basis.agreements/p.daysObserved : null;
      const dailyAnnualMWh=valid ? basis.annualMWh/p.daysObserved : null;
      const additional=valid ? dailyAgreements*remainingDays : null;
      return {available:covered,valid,basisAgreements:basis.agreements,basisAnnualMWh:basis.annualMWh,basisDays:p.daysObserved,
        basisStart:p.observedStart,basisEnd:p.observedEnd,basisLabel:p.label,remainingDays,totalDays:inclusiveDays('2026-01-01',horizon),
        yearToDateAgreements:ytd.agreements,yearToDateAnnualMWh:ytd.annualMWh,dailyAgreements,dailyAnnualMWh,
        forecastAdditionalAgreements:additional==null ? null : Math.round(additional),forecastAdditionalAnnualMWh:valid ? Math.round(dailyAnnualMWh*remainingDays) : null,
        forecastAgreements:valid ? Math.round(ytd.agreements+additional) : null,forecastAnnualMWh:valid ? Math.round(ytd.annualMWh+dailyAnnualMWh*remainingDays) : null,
        asOf:cutoff,horizon,
        reason:valid ? null : !covered ? 'Partnern saknar försäljningsunderlag för valt kundsegment.' : !all(selected.status) ? 'Välj alla avtalsstatusar för ett jämförbart försäljningstempo.' : !p.daysObserved ? 'Perioden har inget observerat underlag.' : 'Urvalet saknar sålda avtal för att beräkna ett tempo.',
        note:'Om samma försäljningstempo fortsätter efter 7 oktober: utfallet 1 januari–7 oktober plus vald periods avtal per observerad kalenderdag × 85 återstående dagar till 31 december. Ett villkorat scenario för sålda avtal, utan justering för framtida churn eller bortfall.'};
    }
    return Object.freeze({partnerId,available,cutoff,ledger,sellers,regions,coveredAudiences:historicAudiences,availableForSegment,period,periods,normalizeFilters,query,summary,insights,projection,attrition,statusAt,statusLabels,productsFor,
      get name(){return P.getPartner?.(partnerId)?.name||(Object.prototype.hasOwnProperty.call(fixtureNames,partnerId) ? fixtureNames[partnerId] : 'Partner');},
      get products(){return Object.freeze(productsFor());},get salesAudiences(){return Object.freeze(configuredAudiences());},get reportedAudiences(){return Object.freeze(reportedAudiences());}});
  }
  const fixtureLedgers=Object.freeze(Object.fromEntries(Object.keys(fixtureNames).map(id=>[id,buildLedger(id)])));
  const reports=new Map();
  function forPartner(partnerId) {
    if(!reports.has(partnerId)) {
      const available=Object.prototype.hasOwnProperty.call(fixtureLedgers,partnerId);
      reports.set(partnerId,createReport({partnerId,ledger:available ? fixtureLedgers[partnerId] : [],available}));
    }
    return reports.get(partnerId);
  }
  P.partnerSalesData=Object.freeze({catalog,catalogs:catalog,cutoff,forPartner,createReport,period,periods,normalizeFilters});
  P.saveraData=forPartner('syd');
})();
