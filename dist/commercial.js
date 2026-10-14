(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const icon = P.icon;
  const fixtureIds=['syd','vast','estate1','estate2'];
  const ids=[...fixtureIds];
  const hasFinancialData=id=>fixtureIds.includes(id);
  const fallback = {
    syd: { name: 'Savera', type: 'sales', typeLabel: 'Företagsförsäljning', initials: 'SA', description: 'Säljer Kraftringens elhandelsavtal till företagskunder. Affärer och resultat i denna vy är fiktiva.' },
    vast: { name: 'Face2face', type: 'field', typeLabel: 'Konsumentförsäljning', initials: 'FF', description: 'Säljer Kraftringens elhandelsavtal till konsumenter. Kundunderlag och resultat i denna vy är fiktiva.' },
    estate1: { name: 'Exempelfastigheter AB', type: 'property', typeLabel: 'Inflyttningsservice · fiktiv partner', initials: 'EF', description: 'Erbjuder inflyttningsservice när hyresavtalet tecknas och förmedlar hyresgästens valda serviceunderlag. Kraftringen hanterar elhandel, elnätsfrågor och bekräftelser.' },
    estate2: { name: 'Exempelbo Förvaltning', type: 'property', typeLabel: 'Inflyttningsservice · fiktiv partner', initials: 'EB', description: 'Fiktiv förvaltare som erbjuder inflyttningsservice och förmedlar underlag till Kraftringen. Fastighetsbolagets egen elförbrukning är en separat affär.' }
  };
  const partner = id => {
    const registry = P.getPartner?.(id) || (Array.isArray(P.partnerRegistry) ? P.partnerRegistry.find(item => item.id === id) : P.partnerRegistry?.[id]) || {};
    return {initials:(registry.name||'Partner').split(/\s+/).map(word=>word[0]).join('').slice(0,2).toLocaleUpperCase('sv-SE'), ...fallback[id], ...registry, name: registry.name || P.partners?.[id] || fallback[id]?.name || 'Exempelpartner', id };
  };
  const journeySteps = ['Rekrytera', 'Onboarda', 'Certifiera', 'Aktivera', 'Sälja', 'Leverera', 'Utveckla', 'Behålla'];
  const journeyDescriptions = [
    'Samla en bild av ett möjligt samarbete och vad parterna vill uppnå.',
    'Förbered introduktion, kontaktvägar och vilka arbetsuppgifter partnern ska ha.',
    'Diskutera vilket kunskapsunderlag som behövs. Inga certifieringskrav är beslutade.',
    'Förbered partnerns arbetsyta och material för det första testet.',
    'Följ försäljningsresultat och utbildningsbehov.',
    'Följ överlämning och kundens nästa steg. Leveransprocessen behöver eget underlag.',
    'Utvärdera kommersiellt bidrag och välj förbättringar tillsammans.',
    'Följ värdet över tid och diskutera fortsatt samarbete.'
  ];
  const journeyTasks = [
    ['Beskriva syftet med samarbetet', 'Dokumentera ett första gemensamt möte'],
    ['Utse en intern kontakt', 'Förbereda partnerns introduktion'],
    ['Stämma av kunskapsbehov', 'Testa ett utbildningsmoment'],
    ['Förhandsgranska partnerns arbetsyta', 'Planera det första kundflödet'],
    ['Följa upp försäljningsresultat', 'Samla partnerns återkoppling'],
    ['Stämma av nästa steg för kunden', 'Följa upp överlämningen'],
    ['Gå igenom utfall och kostnader', 'Välja en förbättring att testa'],
    ['Utvärdera fortsatt kommersiellt värde', 'Planera nästa gemensamma uppföljning']
  ];
  // Separate, manually entered fixtures. No pricing, remuneration rate or conversion rule.
  // Arrays: economic contribution, partner cost, new contracts, annual MWh, registrations.
  const fixtures = {
    '2026-01': { syd:[145000,42000,17,620,0], vast:[64000,24000,36,142,0], estate1:[10500,4700,8,28,15], estate2:[4400,3600,3,11,7] },
    '2026-02': { syd:[152000,43500,18,670,0], vast:[68000,25000,38,151,0], estate1:[11900,5200,9,32,17], estate2:[4700,3900,3,12,8] },
    '2026-03': { syd:[161000,46000,19,725,0], vast:[72500,26500,41,164,0], estate1:[13700,5900,10,36,19], estate2:[5600,4400,4,14,9] },
    '2026-04': { syd:[170000,48000,20,780,0], vast:[78000,28000,44,180,0], estate1:[16000,7000,12,44,22], estate2:[6500,5000,5,18,11] },
    '2026-05': { syd:[184000,50500,22,860,0], vast:[85000,30000,47,192,0], estate1:[18500,7600,14,50,25], estate2:[8200,5400,6,23,13] },
    '2026-06': { syd:[195000,54000,24,930,0], vast:[92000,32000,51,210,0], estate1:[20500,8300,16,56,29], estate2:[9600,5900,7,26,16] },
    '2026-07': { syd:[201000,56000,24,970,0], vast:[93500,33500,52,220,0], estate1:[24000,9200,18,65,33], estate2:[11000,6300,8,29,18] },
    '2026-08': { syd:[218000,59000,26,1050,0], vast:[99000,35500,55,235,0], estate1:[26500,9800,20,71,36], estate2:[13700,7500,10,36,24] },
    '2026-09': { syd:[252000,66000,31,1320,0], vast:[109000,39000,61,260,0], estate1:[31200,11400,24,86,43], estate2:[12100,15100,9,32,27] },
    '2026-10': { syd:[48000,12500,6,250,0], vast:[22000,8000,12,50,0], estate1:[7100,2300,5,18,11], estate2:[2900,3500,2,7,6] }
  };
  const partialComparison = {
    // Both periods cover the first seven calendar days, not a full previous month/quarter.
    month: { syd:[42000,11000,5,210,0], vast:[21000,7400,11,46,0], estate1:[6300,2200,4,15,9], estate2:[3100,3600,2,7,6] },
    quarter: { syd:[39000,10900,5,190,0], vast:[18700,6700,10,43,0], estate1:[4800,1800,4,13,8], estate2:[2200,1260,2,6,5] }
  };
  const potential = {
    syd:{ count:19, contribution:142000, volume:710, label:'Öppna företagsaffärer' },
    vast:{ count:28, contribution:47000, volume:110, label:'Konsumentärenden att följa upp' },
    estate1:{ count:13, contribution:10500, volume:39, label:'Inflyttningsärenden att följa upp' },
    estate2:{ count:11, contribution:7200, volume:27, label:'Inflyttningsärenden att följa upp' }
  };
  const periods = {
    month: [
      { id:'2026-09', label:'September 2026', current:['2026-09'], previous:['2026-08'], comparison:'augusti 2026', range:'1–30 september 2026' },
      { id:'2026-08', label:'Augusti 2026', current:['2026-08'], previous:['2026-07'], comparison:'juli 2026', range:'1–31 augusti 2026' },
      { id:'2026-10', label:'Oktober 2026 · 1–7 okt', current:['2026-10'], partial:'month', comparison:'1–7 september 2026', range:'1–7 oktober 2026 · delperiod' },
      { id:'2026-07', label:'Juli 2026', current:['2026-07'], previous:['2026-06'], comparison:'juni 2026', range:'1–31 juli 2026' },
      { id:'2026-06', label:'Juni 2026', current:['2026-06'], previous:['2026-05'], comparison:'maj 2026', range:'1–30 juni 2026' },
      { id:'2026-05', label:'Maj 2026', current:['2026-05'], previous:['2026-04'], comparison:'april 2026', range:'1–31 maj 2026' },
      { id:'2026-04', label:'April 2026', current:['2026-04'], previous:['2026-03'], comparison:'mars 2026', range:'1–30 april 2026' },
      { id:'2026-03', label:'Mars 2026', current:['2026-03'], previous:['2026-02'], comparison:'februari 2026', range:'1–31 mars 2026' },
      { id:'2026-02', label:'Februari 2026', current:['2026-02'], previous:['2026-01'], comparison:'januari 2026', range:'1–28 februari 2026' },
      { id:'2026-01', label:'Januari 2026', current:['2026-01'], previous:[], comparison:'ingen jämförbar bas i exemplet', range:'1–31 januari 2026' }
    ],
    quarter: [
      { id:'2026-q3', label:'Kvartal 3 · 2026', current:['2026-07','2026-08','2026-09'], previous:['2026-04','2026-05','2026-06'], comparison:'kvartal 2 · 2026', range:'1 juli–30 september 2026' },
      { id:'2026-q4', label:'Kvartal 4 · till 7 okt', current:['2026-10'], partial:'quarter', comparison:'1–7 juli 2026', range:'1–7 oktober 2026 · delperiod av Q4' },
      { id:'2026-q2', label:'Kvartal 2 · 2026', current:['2026-04','2026-05','2026-06'], previous:['2026-01','2026-02','2026-03'], comparison:'kvartal 1 · 2026', range:'1 april–30 juni 2026' },
      { id:'2026-q1', label:'Kvartal 1 · 2026', current:['2026-01','2026-02','2026-03'], previous:[], comparison:'ingen jämförbar bas i exemplet', range:'1 januari–31 mars 2026' }
    ],
    year: [
      { id:'2026-ytd', label:'2026 · till 7 okt', current:Object.keys(fixtures), previous:[], comparison:'ingen tidigare årsbas i exemplet', range:'1 januari–7 oktober 2026 · året hittills', isPartial:true }
    ]
  };
  let periodKind = 'month';
  let periodId = '2026-09';
  let typeFilter = 'all';
  let partnerQuery = '';
  let sortBy = 'net-desc';
  let selectedJourneyStep;
  const num = (value, decimals = 0) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits:decimals, minimumFractionDigits:decimals }).format(value);
  const money = value => `${num(value / 1000, value % 1000 ? 1 : 0)} <small>tkr</small>`;
  const moneyText = value => `${num(value / 1000, value % 1000 ? 1 : 0)} tkr`;
  const currentPeriod = () => ({ ...(periods[periodKind].find(p => p.id === periodId) || periods[periodKind][0]), kind:periodKind });
  const empty = () => ({ contribution:0, cost:0, net:0, agreements:0, volume:0, registrations:0 });
  const fromArray = values => ({ contribution:values[0], cost:values[1], net:values[0]-values[1], agreements:values[2], volume:values[3], registrations:values[4] });
  const sum = items => items.reduce((total, item) => { Object.keys(total).forEach(key => total[key] += item[key] || 0); return total; }, empty());
  function valuesFor(id, previous = false) {
    const p = currentPeriod();
    if(!hasFinancialData(id))return empty();
    if (previous && p.partial) return fromArray(partialComparison[p.partial][id]);
    return sum((previous ? p.previous || [] : p.current).map(month => fromArray(fixtures[month][id])));
  }
  function change(current, previous, invert = false) {
    if (!previous) return '<span class="commercial-delta neutral">Ingen jämförbar bas</span>';
    const amount = (current-previous)/Math.abs(previous)*100;
    const positive = invert ? amount <= 0 : amount >= 0;
    return `<span class="commercial-delta ${positive ? 'up' : 'down'}">${amount >= 0 ? '+' : '−'}${num(Math.abs(amount),1)} %</span>`;
  }
  function initManagement() {
    ids.splice(0,ids.length,...P.partnerRegistry.map(item=>item.id));
    if (!P.state.commercial || typeof P.state.commercial !== 'object' || Array.isArray(P.state.commercial)) P.state.commercial = {...(P.state.commercial || {})};
    if (!P.state.commercial.management || typeof P.state.commercial.management !== 'object' || Array.isArray(P.state.commercial.management)) P.state.commercial.management = {...(P.state.commercial.management || {})};
    ids.forEach((id,index) => {
      if (!P.state.commercial.management[id] || typeof P.state.commercial.management[id] !== 'object' || Array.isArray(P.state.commercial.management[id])) {
        P.state.commercial.management[id] = {
          stage:[6,4,3,1][index]??0, owner:['Demoansvarig A','Demoansvarig B','Demoansvarig A','Ej tilldelad'][index]||'Ej tilldelad',
          next:['Stämma av företagsförsäljning, årsvolym och kommersiellt bidrag','Följa upp försäljningsutfall via Beest, churn och bortfall','Testa överlämning och återkoppling för en fiktiv inflyttare','Planera hur partnern erbjuder inflyttningsservicen'][index]||'Beskriv samarbetet och nästa steg',
          date:['2026-10-12','2026-10-13','2026-10-15','2026-10-19'][index]||'',
          note:'Exempelanteckning. Partnerns placering och uppgifter är ett testförslag.', checks:[], events:[]
        };
      }
      const saved = P.state.commercial.management[id];
      // Older local drafts may predate the journey fields. Repair only the
      // known shape while retaining saved notes and unrelated extensions.
      if (!Number.isInteger(saved.stage) || saved.stage < 0 || saved.stage >= journeySteps.length) saved.stage = 0;
      if (!Array.isArray(saved.checks)) saved.checks = [];
      if (!Array.isArray(saved.events)) saved.events = [];
    });
  }
  const management = id => { initManagement(); return P.state.commercial.management[id]; };
  function saveManagement(id, patch, eventText) {
    const previous = management(id);
    const next = {...previous, ...patch};
    if (eventText) next.events = [{at:new Date().toISOString(), actor:'Kraftringen · intern demovy', text:eventText, visibility:'internal'}, ...previous.events];
    P.state.commercial.management[id] = next;
    if (P.save() === false) {
      P.state.commercial.management[id] = previous;
      P.toast('Webbläsaren kunde inte spara partneruppföljningen. Tidigare uppgifter har behållits. Försök igen.');
      return false;
    }
    return true;
  }
  const selectedPartner = () => ids.includes(P.selectedPartnerId) ? P.selectedPartnerId : 'syd';
  function selectPartner(id, page) {
    if (!P.getPartner?.(id)) return;
    // Partner creation updates the live registry before any overview rerender.
    // Refresh the local IDs so a new channel's own navigation works at once.
    initManagement();
    if (!ids.includes(id)) return;
    P.selectedPartnerId = id;
    selectedJourneyStep = undefined;
    P.go(page||(partner(id).type==='property'?'partner-detail':partner(id).type==='employee'?'employee-channel':'partner-sales'));
  }
  function partnersMatching() {
    return ids.filter(id => {
      const p = partner(id);
      return (typeFilter==='all'||(['property','employee'].includes(typeFilter)?p.type===typeFilter:(p.salesAudiences||[]).includes(typeFilter==='sales'?'business':typeFilter==='field'?'consumer':typeFilter))) && (!partnerQuery || `${p.name} ${p.typeLabel}`.toLocaleLowerCase('sv-SE').includes(partnerQuery.toLocaleLowerCase('sv-SE')));
    });
  }
  function sortedPartners() {
    return partnersMatching().sort((a,b) => {
      if (sortBy === 'name') return partner(a).name.localeCompare(partner(b).name,'sv-SE');
      if (sortBy === 'contracts') return valuesFor(b).agreements-valuesFor(a).agreements;
      const delta = valuesFor(b).net-valuesFor(a).net;
      return sortBy === 'net-asc' ? -delta : delta;
    });
  }
  const header = (title, subtitle, action = '') => `<div class="page-head commercial-head"><div><span class="commercial-eyebrow">KRAFTRINGEN / INTERN PARTNERSTYRNING</span><h1>${e(title)}</h1><p class="muted">${e(subtitle)}</p></div>${action}</div>`;
  const note = () => `<p class="commercial-demo-note">${icon('shield')}<span>Alla belopp och resultat är manuella exempel. Resultatbidrag före partnerkostnad minus exempelkostnad visas som nettobidrag. Kraftringens ekonomiska definition är inte beslutad. Årsvolym avser periodens nya avtal, inte levererad el.</span></p>`;
  function periodControls(includeType = true) {
    const p = currentPeriod();
    return `<div class="commercial-filter-bar"><div class="commercial-period-controls"><label class="commercial-filter-label">Periodtyp<select id="commercial-period-kind"><option value="month"${periodKind==='month'?' selected':''}>Månad</option><option value="quarter"${periodKind==='quarter'?' selected':''}>Kvartal</option><option value="year"${periodKind==='year'?' selected':''}>År</option></select></label><label class="commercial-filter-label">Period<select id="commercial-period">${periods[periodKind].map(item => `<option value="${item.id}"${item.id===p.id?' selected':''}>${e(item.label)}</option>`).join('')}</select></label>${includeType ? `<label class="commercial-filter-label">Partnertyp<select id="commercial-type"><option value="all"${typeFilter==='all'?' selected':''}>Alla partnertyper</option><option value="business"${typeFilter==='business'?' selected':''}>Företag · B2B</option><option value="consumer"${typeFilter==='consumer'?' selected':''}>Konsument · B2C</option><option value="property"${typeFilter==='property'?' selected':''}>Fastighetsbolag</option><option value="employee"${typeFilter==='employee'?' selected':''}>Personalavtal</option></select></label>` : ''}</div><span class="commercial-example-badge">${icon('file')} Exempeldata</span></div>`;
  }
  function kpis(selectedIds) {
    const available=selectedIds.filter(hasFinancialData);
    if(!available.length)return '<section class="card"><h2>Resultatunderlag saknas</h2><p>Avtal och ekonomi visas när ett separat resultatunderlag finns. Att skapa en partner skapar inget utfall.</p></section>';
    const current = sum(available.map(id=>valuesFor(id)));
    const previous = sum(selectedIds.map(id=>valuesFor(id,true)));
    const metrics = [
      ['Nettobidrag',current.net,previous.net,'money','Efter exempelkostnad','money','featured'],
      ['Nya avtal',current.agreements,previous.agreements,'file','Avtal i periodens exempel','st','primary'],
      ['Avtalad årsvolym',current.volume,previous.volume,'bolt','För periodens nya avtal','MWh','primary'],
      ['Resultatbidrag',current.contribution,previous.contribution,'chart','Före partnerkostnad','money','secondary'],
      ['Partnerkostnad',current.cost,previous.cost,'briefcase','Separat angivna exempel','money','secondary',true]
    ];
    return `<div class="commercial-kpis">${metrics.map(([label,value,old,ic,explain,unit,emphasis,invert]) => `<article class="commercial-kpi commercial-kpi-${emphasis}"><div class="commercial-kpi-top"><span>${e(label)}</span>${icon(ic)}</div><strong class="commercial-kpi-value">${unit==='money'?money(value):`${num(value)} <small>${unit}</small>`}</strong><span class="commercial-kpi-description">${explain} · exempel</span><div class="commercial-kpi-compare">${change(value,old,Boolean(invert))}${currentPeriod().partial||currentPeriod().previous?.length?`<small>mot ${e(currentPeriod().comparison)}</small>`:''}</div></article>`).join('')}</div>`;
  }
  function resultGuide() {
    return `<details class="commercial-result-guide"><summary>Så läser ni resultatet ${icon('arrow')}</summary><div><p><strong>Nettobidrag</strong> är det manuellt angivna resultatbidraget före partnerkostnad minus den separat angivna kostnaden. Det är demots mått; Kraftringens ekonomiska definition behöver beslutas.</p><p><strong>Nya avtal och MWh</strong> är separata periodexempel. MWh avser avtalad årsvolym för de nya avtalen, inte periodens levererade el. Lokala registreringar och ärendestatus ändrar inte utfallet.</p><p><strong>Jämför inom rätt sammanhang.</strong> Belopp visar periodens ekonomiska storlek, inte partnerns kvalitet. Företagsförsäljning, konsumentförsäljning och inflyttningsservice har olika uppdrag och volymer. Filtrera på partnertyp eller följ samma partner över tid.</p></div></details>`;
  }
  function trendChart(selectedIds) {
    selectedIds=selectedIds.filter(hasFinancialData);
    const period=currentPeriod();
    let rows;
    const monthNames=['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt'];
    if(periodKind==='year') {
      rows=period.current.map(month=>({label:monthNames[Number(month.slice(5))-1]+(month==='2026-10'?' 1–7':''),value:sum(selectedIds.map(id=>fromArray(fixtures[month][id])))}));
    } else if(periodKind==='quarter'||period.partial) {
      const quarter=Number(period.id.slice(-1));
      rows=[];
      if(period.partial||period.previous?.length) rows.push({label:period.partial?(periodKind==='quarter'?'1–7 jul':'1–7 sep'):`Q${quarter-1} 2026`,value:sum(selectedIds.map(id=>valuesFor(id,true)))});
      rows.push({label:period.partial?'1–7 okt':`Q${quarter} 2026`,value:sum(selectedIds.map(id=>valuesFor(id)))});
    } else {
      const last=Object.keys(fixtures).indexOf(period.current[0]);
      const months=Object.keys(fixtures).slice(Math.max(0,last-2),last+1);
      rows=months.map(month=>({label:monthNames[Number(month.slice(5))-1],value:sum(selectedIds.map(id=>fromArray(fixtures[month][id])))}));
    }
    const maximum=Math.max(1,...rows.flatMap(row=>[row.value.cost,Math.max(0,row.value.net)]));
    const minimum=Math.max(0,...rows.map(row=>Math.abs(Math.min(0,row.value.net))));
    const scale=140/(maximum+minimum);
    const baseline=12+maximum*scale;
    const width=periodKind==='year'?800:480;
    const column=(width-54)/rows.length;
    const description=rows.map(row=>`${row.label}: nettobidrag ${moneyText(row.value.net)}, partnerkostnad ${moneyText(row.value.cost)}`).join('. ');
    const chart=selectedIds.length ? `<svg class="commercial-signed-chart" viewBox="0 0 ${width} 205" role="img" aria-labelledby="commercial-chart-title commercial-chart-desc"><title id="commercial-chart-title">Nettobidrag och partnerkostnad, ekonomiska exempel</title><desc id="commercial-chart-desc">${e(description)}. Negativt nettobidrag visas under nollinjen.</desc><line x1="30" y1="${baseline}" x2="${width-12}" y2="${baseline}" stroke="#d8e3e8" stroke-width="1"/><text x="25" y="${baseline+3}" text-anchor="end" fill="#728892" font-size="9">0</text>${rows.map((row,index)=>{
      const x=50+column*index+column/2;
      const net=row.value.net;
      const height=Math.abs(net)*scale;
      const netY=net>=0?baseline-height:baseline;
      const costHeight=row.value.cost*scale;
      return `<g><text x="${x}" y="${net>=0?Math.max(8,netY-9):netY+height+12}" text-anchor="middle" fill="${net<0?'#ad7545':'#2b7066'}" font-size="11" font-weight="650">${e(moneyText(net))}</text><rect x="${x-31}" y="${netY}" width="26" height="${height}" rx="3" fill="${net<0?'#c99968':index===rows.length-1?'#107c74':'#285969'}"><title>${e(row.label)} · nettobidrag ${e(moneyText(net))}</title></rect><rect x="${x+2}" y="${baseline-costHeight}" width="26" height="${costHeight}" rx="3" fill="#cedfd3"><title>${e(row.label)} · partnerkostnad ${e(moneyText(row.value.cost))}</title></rect><text x="${x}" y="190" text-anchor="middle" fill="#627d88" font-size="11">${e(row.label)}</text></g>`;
    }).join('')}</svg>` : '<div class="empty commercial-chart-empty">Inga partners i urvalet.</div>';
    return `<section class="card commercial-trend"><div class="panel-heading"><div><h2>Kommersiellt bidrag över tid</h2><p class="commercial-subtitle">${periodKind==='year'?'Månader under året · oktober 1–7':period.partial?'Motsvarande delperioder':periodKind==='quarter'?'Hela kvartal med tillgänglig jämförelse':'Senaste hela månader'} · samma partnerurval · exempel</p></div><span class="commercial-example-badge">tkr</span></div><div class="commercial-chart-legend"><span><i class="net"></i>Nettobidrag</span><span><i class="cost"></i>Partnerkostnad</span></div>${periodKind==='year'?`<div class="commercial-annual-scroll" tabindex="0" aria-label="Månadsdiagram, kan rullas i sidled">${chart}</div>`:chart}<p class="commercial-chart-note">${periodKind==='year'?'Året hittills omfattar januari till 7 oktober. Oktober är en delmånad. Ingen jämförelse med ett tidigare år ingår.':period.partial?`Delperioden jämförs med ${e(period.comparison)}. Inga hela månader eller kvartal blandas in.`:'Nettobidrag och partnerkostnad visas som separata staplar. Negativt bidrag visas under nollinjen.'}</p></section>`;
  }
  function ranking(selectedIds) {
    const ranked = selectedIds.filter(hasFinancialData).sort((a,b)=>valuesFor(b).net-valuesFor(a).net);
    const max = Math.max(1,...ranked.map(id=>Math.abs(valuesFor(id).net)));
    return `<section class="card commercial-ranking"><div class="panel-heading"><div><h2>Bidrag per partner</h2><p class="commercial-subtitle">Nettobidrag · ${e(currentPeriod().label)}</p></div></div><div class="commercial-ranking-list">${ranked.map((id,index)=>{ const p=partner(id), v=valuesFor(id);return `<button class="commercial-ranking-row" data-commercial-partner="${id}"><span class="commercial-rank">${icon(partner(id).type==='property'?'home':id==='vast'?'users':'briefcase')}</span><div><div class="commercial-ranking-name"><strong>${e(p.name)}</strong><span class="${v.net<0?'commercial-negative':''}">${moneyText(v.net)}</span></div><span class="commercial-ranking-track"><i class="${v.net<0?'negative':''}" style="width:${Math.max(3,Math.abs(v.net)/max*100)}%"></i></span><small>${e(p.typeLabel)}</small></div>${icon('arrow')}</button>`; }).join('')||'<p class="empty">Inga partners i urvalet.</p>'}</div><p class="commercial-chart-note">Beloppen visar ekonomisk storlek, inget kvalitetsbetyg mellan olika kanaler. Öppna en partner för att följa resultat och nästa steg.</p></section>`;
  }
  function partnerRows() {
    const rows = sortedPartners();
    return rows.map(id=>{
      const p=partner(id),m=management(id),v=valuesFor(id);
      if(!hasFinancialData(id))return `<tr><td><button class="commercial-partner-name" data-commercial-partner="${e(id)}"><span class="commercial-avatar commercial-avatar-sales">${e(p.initials)}</span><span><strong>${e(p.name)}</strong><small>${e(p.typeLabel)}</small></span></button></td>${['Nettobidrag','Resultatbidrag','Partnerkostnad','Nya avtal','Årsvolym MWh'].map(label=>`<td data-label="${label}" class="commercial-number">—</td>`).join('')}<td data-label="Partnerresa"><span class="commercial-stage">${e(journeySteps[m.stage]||journeySteps[0])}</span><small class="commercial-stage-note">Exempelplacering · resultatunderlag saknas</small></td><td><button class="icon-button" data-commercial-partner="${e(id)}" aria-label="Öppna ${e(p.name)}">${icon('arrow')}</button></td></tr>`;
      return `<tr><td><button class="commercial-partner-name" data-commercial-partner="${id}"><span class="commercial-avatar commercial-avatar-${partner(id).type}">${e(p.initials||partner(id).initials)}</span><span><strong>${e(p.name)}</strong><small>${e(p.typeLabel)}</small></span></button></td><td data-label="Nettobidrag" class="commercial-number commercial-net ${v.net<0?'commercial-negative':''}">${moneyText(v.net)}</td><td data-label="Resultatbidrag" class="commercial-number">${moneyText(v.contribution)}</td><td data-label="Partnerkostnad" class="commercial-number">${moneyText(v.cost)}</td><td data-label="Nya avtal" class="commercial-number">${num(v.agreements)}</td><td data-label="Årsvolym MWh" class="commercial-number">${num(v.volume)}</td><td data-label="Partnerresa"><span class="commercial-stage">${e(journeySteps[m.stage]||journeySteps[0])}</span><small class="commercial-stage-note">Exempelplacering</small></td><td><button class="icon-button" data-commercial-partner="${id}" aria-label="Öppna ${e(p.name)}">${icon('arrow')}</button></td></tr>`;
    }).join('')||'<tr><td colspan="8"><p class="empty">Inga partners matchar. Ändra sökning eller partnertyp.</p></td></tr>';
  }
  function partnerTable(heading = 'Alla partners') {
    return `<section class="card commercial-partner-table"><div class="panel-heading"><div><h2>${heading}</h2><p class="commercial-subtitle" id="commercial-partner-count">${partnersMatching().length} partners · kommersiella exempel för ${e(currentPeriod().label)}</p></div><span class="pill">Utfall</span></div><div class="toolbar commercial-table-toolbar"><label class="search-field">${icon('search')}<input id="commercial-search" type="search" value="${e(partnerQuery)}" placeholder="Sök partner" aria-label="Sök partner"></label><label class="commercial-sort-label">Sortera<select id="commercial-sort"><option value="net-desc"${sortBy==='net-desc'?' selected':''}>Högst nettobidrag</option><option value="net-asc"${sortBy==='net-asc'?' selected':''}>Lägst nettobidrag</option><option value="contracts"${sortBy==='contracts'?' selected':''}>Flest nya avtal</option><option value="name"${sortBy==='name'?' selected':''}>Partnernamn</option></select></label></div><div class="table-wrap"><table class="commercial-table"><thead><tr><th>Partner</th><th class="commercial-number">Nettobidrag</th><th class="commercial-number">Resultatbidrag</th><th class="commercial-number">Kostnad</th><th class="commercial-number">Nya avtal</th><th class="commercial-number">Årsvolym MWh</th><th>Partnerresa</th><th><span class="sr-only">Öppna</span></th></tr></thead><tbody id="commercial-table-body">${partnerRows()}</tbody></table></div><div class="panel-foot commercial-table-foot"><span>Belopp i tkr · manuella exempel</span><span>Partnerresan är Kraftringens interna testprocess.</span></div></section>`;
  }
  function potentialCard(selectedIds) {
    const items = selectedIds.map(id=>potential[id]).filter(Boolean);
    if(!items.length)return '';
    const total = items.reduce((acc,item)=>({contribution:acc.contribution+item.contribution,volume:acc.volume+item.volume}),{contribution:0,volume:0});
    return `<section class="card commercial-potential"><div><span class="commercial-eyebrow">FRAMTIDA POTENTIAL / SEPARAT FRÅN UTFALLET</span><h2>Vad kan bli nästa affär?</h2><p>Öppna affärer och inflyttningsärenden att följa upp. Exempelbild från 7 oktober, oberoende av periodvalet.</p></div><div class="commercial-potential-metric"><strong>${money(total.contribution)}</strong><span>Indikativt bidrag · exempel</span></div><div class="commercial-potential-metric"><strong>${num(total.volume)} <small>MWh</small></strong><span>Indikativ årsvolym · exempel</span></div><button class="text-button" id="commercial-show-potential">Visa underlaget ${icon('arrow')}</button></section>`;
  }
  function nextActions(selectedIds) {
    const p=currentPeriod();
    const attention=selectedIds.map(id=>({id,current:valuesFor(id),previous:valuesFor(id,true)}))
      .filter(item=>item.current.net<0||item.current.net<item.previous.net)
      .sort((a,b)=>Number(b.current.net<0)-Number(a.current.net<0)||(a.current.net-a.previous.net)-(b.current.net-b.previous.net));
    return `<section class="card commercial-financial-followup"><div class="panel-heading"><div><h2>Ekonomisk uppföljning</h2><p class="commercial-subtitle">${e(p.range)}${p.partial||p.previous?.length?` · mot ${e(p.comparison)}`:''} · manuella exempel</p></div>${icon('chart')}</div>${attention.length?`<div class="commercial-financial-list">${attention.map(({id,current:v,previous:old})=>`<button class="commercial-financial-row" data-commercial-partner="${id}"><span class="commercial-financial-indicator ${v.net<0?'negative':'declining'}">${icon(v.net<0?'money':'chart')}</span><span class="commercial-financial-copy"><strong>${e(partner(id).name)} <span>${v.net<0?'Nettobidrag under noll':'Lägre nettobidrag'}</span></strong><small>${v.net<0?`Partnerkostnad ${moneyText(v.cost)} överstiger resultatbidrag ${moneyText(v.contribution)}. Stäm av periodens kostnadsunderlag.`:`Nettobidraget är ${moneyText(old.net-v.net)} lägre än ${e(p.comparison)}. Gå igenom resultatbidrag och kostnad.`}</small></span><span class="commercial-financial-value ${v.net<0?'commercial-negative':''}">${moneyText(v.net)}<small>Öppna partner ${icon('arrow')}</small></span></button>`).join('')}</div>`:`<p class="commercial-financial-empty">${selectedIds.length?(p.partial||p.previous?.length?'Inget negativt nettobidrag eller någon nedgång mot jämförelseperioden i detta urval. Inget ekonomiskt uppföljningsförslag utifrån dessa exempelvärden.':'Inget negativt nettobidrag i detta urval. Tidigare jämförbar period saknas i exemplet.'):'Inga partners i urvalet. Ändra sökning eller partnertyp för att se ekonomisk uppföljning.'}</p>`}<p class="commercial-chart-note">${attention.length?'Förslag att undersöka underlaget, inget betyg på partnern. ':''}Ärendeuppföljning och planerade aktiviteter visas separat från ekonomin.</p></section>`;
  }
  function renderOverview() {
    initManagement();
    const selected = partnersMatching();
    return `<div class="commercial-page commercial-overview">${header('Partnerresultat', 'Följ resultatet, jämför partners och utforska insikter.', `<button class="btn btn-secondary" id="commercial-export">${icon('download')} Exportera exempel</button>`)}${periodControls()}<div class="commercial-period-caption"><span>${e(currentPeriod().range)}</span><span>${selected.length} partners i urvalet · ${selected.filter(hasFinancialData).length} med resultatunderlag</span></div>${kpis(selected)}<div class="commercial-report-links"><button class="btn btn-primary" data-go="partners">${icon('users')} Följ era partners</button><button class="text-button" data-commercial-results="all">Övriga partnerutfall</button><button class="text-button" data-go="kickback">Kickback & underlag ${icon('arrow')}</button></div><div class="commercial-dashboard-grid">${trendChart(selected)}${ranking(selected)}</div>${partnerTable()}${P.workbench?.render?.({partnerIds:selected,limit:4})||''}${nextActions(selected)}${resultGuide()}${note()}</div>`;
  }
  function renderPartners() {
    initManagement();
    return `<div class="commercial-page">${header('Partners','Säljpartners, fastighetsbolag och företag med personalavtal. Öppna en partner för ert samarbete och resultat.',`<button class="btn btn-primary" data-partner-create>${icon('plus')} Ny partner</button>`)}${periodControls()}${kpis(partnersMatching())}${partnerTable('Partnerregister')}${note()}</div>`;
  }
  function renderReports() {
    initManagement();
    return `<div class="commercial-page">${header('Kommersiell resultatrapport','Välj period och partnerurval. Exportera samma ekonomiska exempel som visas här.',`<button class="btn btn-secondary" id="commercial-export">${icon('download')} Exportera exempel · CSV</button>`)}${periodControls()}<div class="commercial-period-caption"><span>${e(currentPeriod().range)}</span><span>Jämförs med ${e(currentPeriod().comparison)}</span></div>${kpis(partnersMatching())}${partnerTable('Resultat per partner')}<section class="card commercial-report-definition"><span class="commercial-eyebrow">UNDERLAGET I DENNA RAPPORT</span><h2>Ekonomiska exempel med samma period och urval</h2><p>Belopp är angivna separat. Nettobidraget är exempelbidraget före partnerkostnad minus den angivna exempelkostnaden. Nya avtal och deras beräknade årsvolym är separata exempelvärden.</p><p>Lokala inflyttningsärenden, offertutkast och framtida potential ingår inte i utfallet. CSV-filen innehåller det valda partnerurvalet och den period som visas.</p></section>${note()}</div>`;
  }
  function activityFor(id) {
    // The older vast records are retained for compatibility, but are B2B examples.
    // They must never describe Face2face's confirmed consumer sales role.
    const customerEvents = id==='vast' ? (P.consumer?.activityFor?.(id)||[]) : (Array.isArray(P.state.records) ? P.state.records : []).filter(r=>r&&r.partner===id).flatMap(r=>(Array.isArray(r.events) ? r.events : []).filter(ev=>ev&&typeof ev==='object').map(ev=>({...ev,company:r.company})));
    const adminEvents = management(id).events.filter(ev=>ev&&typeof ev==='object').map(ev=>({...ev,company:'Intern partneruppföljning'}));
    const moving = fallback[id]?.type==='property' ? (P.moveinService?.activityFor?.(id) || (Array.isArray(P.state.moveins) ? P.state.moveins : []).filter(a=>a&&(a.partner===id||a.partnerId===id)).map(a=>({at:a.created||a.createdAt||'2026-10-07',company:a.name||'Inflyttningsärende · exempel',text:'Ett äldre lokalt testintresse finns sparat som utkast. Överlämning, serviceval och fullmakt är inte bekräftade.',actor:'Inflyttningsdemo'}))) : [];
    return [...customerEvents,...adminEvents,...moving].sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,6);
  }
  const operationMetric = (label,value,noteText) => `<div class="commercial-operation-metric"><strong>${value}</strong><span>${e(label)}</span><small>${e(noteText)}</small></div>`;
  function renderBusinessFocus() {
    const records=(Array.isArray(P.state.records) ? P.state.records : []).filter(r=>r&&r.partner==='syd');
    const offers=(Array.isArray(P.state.offers) ? P.state.offers : []).filter(o=>o&&o.partner==='syd');
    const details=P.state.businessDetails||{};
    const known=records.filter(r=>r.stage!=='active'&&r.status!=='avslutad').map(r=>({record:r,details:details[r.id]})).filter(item=>item.details);
    const yearly=known.reduce((total,item)=>total+(Number(item.details.annualVolume)||0),0);
    const sites=known.reduce((total,item)=>total+(Number(item.details.facilities)||0),0);
    const rows=[...records].filter(r=>r.stage!=='active'&&r.status!=='avslutad').sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999'))).slice(0,3);
    return `<section class="card commercial-role-focus commercial-business-focus"><div class="commercial-role-heading"><div><span class="commercial-eyebrow">BEKRÄFTAD ROLL / FÖRETAGSFÖRSÄLJNING</span><h2>Savera säljer till företagskunder.</h2><p>Savera kan eventuellt arbeta i portalen längre fram. Här kan ni förhandsgranska ett föreslaget arbetssätt för företagsdialoger och offertunderlag.</p></div>${icon('briefcase')}</div><div class="commercial-operation-metrics">${operationMetric('Kunddialoger',num(records.length),'Företag och BRF · exempel')}${operationMetric('Sparade offertutkast',num(offers.length),'Lokala behovsunderlag')}${operationMetric('Årsförbrukning · öppna underlag',yearly?`${num(yearly/1000,1)} <small>MWh</small>`:'—',known.length?`${known.length} kundunderlag · alla datum`:'Kundunderlag saknas')}${operationMetric('Anläggningar · öppna underlag',sites?num(sites):'—','Angivna exempelanläggningar')}</div><div class="commercial-operation-work"><div><h3>Företagsaffärer att ta vidare</h3><p class="commercial-subtitle">Nästa steg i det lokala affärsarbetet · alla datum</p>${rows.length?`<div class="commercial-work-list">${rows.map(r=>`<button class="commercial-work-row" data-commercial-business-record="${e(r.id)}"><span><strong>${e(r.company)}</strong><small>${e(r.next||'Planera nästa kundkontakt')}</small></span><span class="commercial-work-date">${P.date(r.date)} ${icon('arrow')}</span></button>`).join('')}</div>`:'<p class="empty">Inga öppna företagsdialoger i den lokala demovyn.</p>'}</div><aside class="commercial-operation-support"><span class="commercial-eyebrow">KRAFTRINGENS NÄSTA INSATS</span><strong>Få fram ett tydligt offertunderlag</strong><p>Stäm av årsförbrukning, anläggningar, önskad start och kundens frågor. Återkoppla om vad som behöver kompletteras.</p><button class="text-button" data-commercial-business-open>Öppna företagsunderlag ${icon('arrow')}</button></aside></div><p class="commercial-chart-note">Förslag till framtida portalflöde · lokala exempel för alla datum. Kundunderlag och offertutkast ändrar inte periodens försäljning eller ekonomiska utfall.</p></section>`;
  }
  function renderConsumerFocus() {
    const rows=P.consumer?.rows?.()||[];
    const statusCount=status=>rows.filter(row=>row.status===status).length;
    const needs=rows.filter(row=>row.status==='complement').slice(0,3);
    return `<section class="card commercial-role-focus commercial-consumer-focus"><div class="commercial-role-heading"><div><span class="commercial-eyebrow">BEKRÄFTAD ROLL / KONSUMENTFÖRSÄLJNING</span><h2>Face2face arbetar i Beest.</h2><p>Kraftringen följer försäljning och kundutfall i resultatvyn ovan. Konsumentflödet här är en fristående lokal demonstration av möjlig återkoppling.</p></div>${icon('users')}</div><div class="commercial-operation-metrics">${operationMetric('Konsumentunderlag',num(rows.length),'Separata konsumentexempel')}${operationMetric('Behöver kompletteras',num(statusCount('complement')),'Återkoppling att följa upp')}${operationMetric('Hos Kraftringen',num(statusCount('waiting')),'Inskickade lokala testunderlag')}${operationMetric('Aktiv demo-status',num(statusCount('active')),'Inte ett uppmätt kundutfall')}</div><div class="commercial-operation-work"><div><h3>Återkoppling till säljteamet</h3><p class="commercial-subtitle">Konsumentunderlag som behöver ett nästa steg · alla datum</p>${needs.length?`<div class="commercial-work-list">${needs.map(row=>`<button class="commercial-work-row" data-commercial-consumer-record="${e(row.id)}"><span><strong>${e(row.name||row.customerName||'Konsument · exempel')}</strong><small>${e(row.next||'Stäm av kompletteringen med partnern.')}</small></span><span class="commercial-work-date">${e(row.city||'')}${icon('arrow')}</span></button>`).join('')}</div>`:'<p class="empty">Inga kompletteringar i den lokala konsumentvyn.</p>'}</div><aside class="commercial-operation-support"><span class="commercial-eyebrow">KRAFTRINGENS NÄSTA INSATS</span><strong>Ge tydlig återkoppling på underlagen</strong><p>Prova status och återkoppling i det lokala exempelunderlaget. Ingen koppling till Beest eller till verklig försäljning finns i prototypen.</p><button class="text-button" data-commercial-consumer-open>Öppna konsumentunderlag ${icon('arrow')}</button></aside></div><p class="commercial-chart-note">Lokala testunderlag, inga Beest-data. Detta ersätter inte Face2faces säljverktyg. Statusändringar skapar inga elavtal och påverkar inte resultatvyn.</p></section>`;
  }
  function renderPropertyFocus(id) {
    P.moveinService?.init?.();
    const rows=P.moveinService?.rows?.(id)||(Array.isArray(P.state.moveins) ? P.state.moveins : []).filter(row=>row&&(row.partner===id||row.partnerId===id));
    const status=row=>row.handoverStatus||'draft';
    const handed=rows.filter(row=>status(row)!=='draft');
    const count=key=>rows.filter(row=>status(row)===key).length;
    const pending=handed.filter(row=>['submitted','handling'].includes(status(row)));
    const processingCount=(kind,value)=>handed.filter(row=>row.processing?.[kind]===value).length;
    const label=row=>P.moveinService?.statusLabel?.(row)||({draft:'Utkast · inte förmedlat',submitted:'Förmedlat till Kraftringen',handling:'Handläggning pågår',needs_info:'Behöver kompletteras',confirmed:'Bekräftat i demo'}[status(row)]||'Utkast · inte förmedlat');
    const priority={needs_info:0,submitted:1,handling:2,draft:3,confirmed:4};
    const work=[...rows].sort((a,b)=>(priority[status(a)]??3)-(priority[status(b)]??3)||String(a.moveDate||'9999').localeCompare(String(b.moveDate||'9999'))).slice(0,4);
    const eligible=handed.filter(row=>row.serviceRequested===true&&row.authorityDemo===true).length;
    const chosen=handed.filter(row=>row.processing?.offerChoice==='chosen').length;
    return `<section class="card commercial-role-focus commercial-property-focus">
      <div class="commercial-role-heading"><div><span class="commercial-eyebrow">BEKRÄFTAD ROLL / INFLYTTNINGSSERVICE</span><h2>Partnern förmedlar. Kraftringen ordnar elen.</h2><p>Fastighetsbolaget registrerar inflyttningar via Excel eller manuellt och bifogar fullmakterna. Kraftringen tar över hanteringen av elhandel och elnät och återkopplar till fastighetsbolaget. Hyresgästen gör inget aktivt i portalen.</p></div>${icon('home')}</div>
      <div class="commercial-operation-metrics">${operationMetric('Förmedlade ärenden',num(handed.length),'Lokala ärenden · alla datum')}${operationMetric('Hos Kraftringen',num(pending.length),'Förmedlade eller under handläggning')}${operationMetric('Behöver kompletteras',num(count('needs_info')),'Återkoppling till partnern')}${operationMetric('Återkoppling klar',num(count('confirmed')),'Bekräftelser i demoflödet')}</div>
      <div class="commercial-service-track" aria-label="Inflyttningsservicens olika delar">
        <div><span class="commercial-eyebrow">1 / PARTNERNS ÖVERLÄMNING</span><strong>${num(eligible)} <small>med serviceval och fullmaktsdemo</small></strong><p>${num(count('draft'))} utkast väntar på överlämning. Partnern hjälper till med underlaget och förmedlar det till Kraftringen.</p></div>
        <div><span class="commercial-eyebrow">2 / ELHANDEL</span><strong>${num(processingCount('trade','confirmed'))} <small>handläggning klar i demo</small></strong><p>${num(processingCount('trade','handling'))} under handläggning. ${num(chosen)} har ett markerat erbjudandeval i demo. Hyresgästen blir elhandelskund om hen väljer vårt erbjudande.</p></div>
        <div><span class="commercial-eyebrow">3 / ELNÄT</span><strong>${num(processingCount('network','confirmed'))} <small>handläggning klar i demo</small></strong><p>${num(processingCount('network','handling'))} under handläggning. Kraftringen hjälper med nödvändig hantering gentemot elnätsbolaget.</p></div>
      </div>
      <div class="commercial-operation-work"><div><h3>Inflyttningsärenden att ta vidare</h3><p class="commercial-subtitle">Nästa steg i handläggningen · alla datum · exempel</p>${work.length?`<div class="commercial-work-list">${work.map(row=>`<button class="commercial-work-row" data-commercial-movein-record="${e(row.id)}" data-commercial-movein-partner="${id}"><span><strong>${e(row.name||'Hyresgäst · exempel')}</strong><small>${e(row.address||'Adressunderlag saknas')} · ${e(label(row))}${row.next?' · '+e(row.next):''}</small></span><span class="commercial-work-date">${P.date(row.moveDate)} ${icon('arrow')}</span></button>`).join('')}</div>`:'<p class="empty">Inga lokala inflyttningsärenden ännu. Prova partnerns överlämning med exempeluppgifter.</p>'}</div><aside class="commercial-operation-support"><span class="commercial-eyebrow">KRAFTRINGENS NÄSTA INSATS</span><strong>Ta över ärendet och ge återkoppling</strong><p>Följ elhandel och elnätsärende var för sig. Be om komplettering när underlag behövs och registrera bekräftelser i testflödet.</p><button class="text-button" data-commercial-movein-open="${id}">Öppna inflyttningsärenden ${icon('arrow')}</button></aside></div>
      <div class="commercial-service-responsibility"><span>${icon('users')}<span><strong>Fastighetspartnern</strong>Erbjuder service vid hyresavtalet och förmedlar hyresgästens underlag.</span></span><span>${icon('shield')}<span><strong>Kraftringen</strong>Står för elkompetens, avtalshantering och återkoppling.</span></span></div>
      <p class="commercial-chart-note">Lokala ärenden för alla datum, åtskilda från periodens ekonomiska exempel ovan. Serviceval, fullmaktsdemo och handläggningsstatus skapar inga verkliga avtal. Fastighetsbolagets egen elförbrukning är en separat affär.</p>
    </section>`;
  }
  const roleFocus=id=>id==='syd'?`<details class="commercial-process-demo"><summary>Förslag till Saveras framtida arbetsyta ${icon('arrow')}</summary>${renderBusinessFocus()}</details>`:id==='vast'?`<details class="commercial-process-demo"><summary>Förhandsgranska lokalt återkopplingsflöde ${icon('arrow')}</summary>${renderConsumerFocus()}</details>`:fallback[id]?.type==='property'?renderPropertyFocus(id):'';
  function journeySummary(id) {
    const m=management(id);
    return `<section class="card commercial-journey-summary"><div class="panel-heading"><div><span class="commercial-eyebrow">KRAFTRINGENS PROCESS FÖR PARTNERN</span><h2>Var är samarbetet nu?</h2></div><span class="pill">Testförslag</span></div><ol class="commercial-mini-journey">${journeySteps.map((title,index)=>`<li class="${index===m.stage?'current':index<m.stage?'passed':''}"><span>${index+1}</span><strong>${e(title)}</strong></li>`).join('')}</ol><div class="commercial-journey-current"><div><small>EXEMPELPLACERING</small><strong>${e(journeySteps[m.stage]||journeySteps[0])}</strong><p>${e(journeyDescriptions[m.stage]||journeyDescriptions[0])}</p></div><button class="btn btn-secondary btn-small" data-commercial-journey="${id}">Öppna partnerresan ${icon('arrow')}</button></div></section>`;
  }
  function renderPartnerDetail() {
    initManagement();
    const id=selectedPartner(),p=partner(id),m=management(id),v=valuesFor(id),events=activityFor(id);
    const isEstate=p.type==='property';
    if(p.type==='employee')return P.employeeChannel?.render()||'';
    if(!isEstate)return `<div class="commercial-page"><button class="text-button" data-go="partners">← Alla partners</button>${header(p.name,'Resultat, insikter och scenario vid fortsatt försäljningstakt.',`<button class="btn btn-secondary" data-partner-edit="${e(id)}">Redigera partner</button>${p.crmMode==='portal'?'<button class="btn btn-primary" data-go="crm">Öppna CRM</button>':''}<button class="btn btn-secondary" data-go="partner-insights">Insikter ${icon('chart')}</button><button class="btn btn-primary" data-go="partner-sales">Kunder & avtal ${icon('arrow')}</button>`)}${hasFinancialData(id)?`${periodControls(false)}${kpis([id])}${P.partnerResults?.renderPanel?.(id,currentPeriod())||''}${P.partnerKickback?.renderSummary?.(id,currentPeriod())||''}${resultGuide()}`:'<section class="card"><h2>Resultatunderlag saknas</h2><p>Kunder, avtal, insikter och kickback visas när underlag finns.</p></section>'}<section class="card"><h2>${p.crmMode==='portal'?'Partnerportalen som CRM':'Eget CRM · utbildning & stöd'}</h2><p>${p.crmMode==='portal'?'Partnern arbetar med kunder, affärer och nästa aktivitet här. Kundarbetet sparas i denna webbläsare.':'Partnern driver sina affärer i sitt eget CRM. Här följer Kraftringen resultaten och partnern hittar utbildningar och stöd.'}</p><button class="btn btn-secondary" data-commercial-preview="${e(id)}">${p.crmMode==='portal'?'Öppna CRM':'Öppna utbildning & stöd'} ${icon('arrow')}</button></section>${note()}</div>`;
    if(!hasFinancialData(id))return `<div class="commercial-page"><button class="text-button" data-go="partners">← Alla partners</button>${header(p.name,'Inflyttningsservice · fastighetsbolag',`<button class="btn btn-secondary" data-go="property-partnership">Se samarbetsförslaget</button><button class="btn btn-secondary" data-partner-edit="${e(id)}">Redigera partner</button><button class="btn btn-primary" data-commercial-preview="${e(id)}">Öppna inflyttningsservice ${icon('arrow')}</button>`)}<section class="card"><div class="panel-heading"><h2>Ett enklare sätt att ordna elen vid inflyttning</h2>${icon('home')}</div><p>Fastighetsbolaget registrerar inflyttningar via Excel eller manuellt och bifogar fullmakterna. Kraftringen tar över när underlaget förmedlas.</p><div class="detail-actions"><button class="btn btn-secondary" data-commercial-movein-open="${e(id)}">Inflyttningsärenden</button><button class="btn btn-secondary" data-go="property-results">Kunder & kickback</button><button class="text-button" data-commercial-journey="${e(id)}">Öppna partnerresan →</button></div></section>${roleFocus(id)}<section class="card"><h2>Resultatunderlag saknas</h2><p>Avtal, hjälpta inflyttare och kickback visas när resultatunderlag finns. Registrerade serviceärenden är ett separat mått.</p></section></div>`;
    return `<div class="commercial-page"><button class="commercial-back text-button" data-go="partners">← Alla partners</button>${header(p.name,id==='syd'?'Företagsaffärer, kommersiellt bidrag och ert nästa steg.':id==='vast'?'Försäljning via Beest, geografiskt utfall och kundernas fortsatta resa.':'Kommersiellt resultat, förmedlade inflyttningsärenden och Kraftringens handläggning.',!isEstate?`<button class="btn btn-secondary" data-partner-edit="${e(id)}">Redigera partner</button><button class="btn btn-secondary" data-go="partner-insights">Insikter ${icon('chart')}</button><button class="btn btn-primary" data-go="partner-sales">Kunder & avtal ${icon('arrow')}</button>`:`<button class="btn btn-secondary" data-go="property-partnership">Se samarbetsförslaget</button><button class="btn btn-secondary" data-partner-edit="${e(id)}">Redigera partner</button><button class="btn btn-primary" ${isEstate?`data-commercial-movein-open="${id}"`:`data-commercial-results="${id}"`}>${isEstate?'Öppna inflyttningsärenden':'Visa försäljningsrapport'} ${icon('arrow')}</button>`)}<div class="commercial-partner-intro"><span class="commercial-avatar commercial-avatar-${partner(id).type}">${e(p.initials||partner(id).initials)}</span><div><strong>${e(p.typeLabel)}</strong><p>${e(p.description||partner(id).description)}</p></div><span class="commercial-example-badge">Exempeldata</span></div>${periodControls(false)}<div class="commercial-period-caption"><span>${e(currentPeriod().range)}</span><span>Manuella exempel · till 7 oktober 2026</span></div>${kpis([id])}${P.partnerResults?.renderPanel?.(id,currentPeriod())||''}${P.partnerKickback?.renderSummary?.(id,currentPeriod())||''}${P.workbench?.render?.({partnerIds:[id],limit:3})||''}${resultGuide()}<div class="commercial-detail-grid"><section class="card commercial-result-detail"><div class="panel-heading"><div><h2>Vad får Kraftringen ut?</h2><p class="commercial-subtitle">${e(currentPeriod().range)} · exempel</p></div>${icon('chart')}</div><div class="commercial-waterfall"><div><span>Resultatbidrag före partnerkostnad</span><strong>${moneyText(v.contribution)}</strong></div><div><span>Partnerkostnad · separat exempel</span><strong>− ${moneyText(v.cost)}</strong></div><div class="commercial-waterfall-total"><span>Nettobidrag · demomodell</span><strong class="${v.net<0?'commercial-negative':''}">${moneyText(v.net)}</strong></div></div><p class="commercial-result-explanation">Inga belopp räknas från elpris, volym, avtalslängd eller ersättningssats. De är separata testvärden.</p>${isEstate?`<div class="commercial-period-counts"><div><strong>${num(v.registrations)}</strong><span>Serviceförmedlingar · periodexempel</span></div><div><strong>${num(v.agreements)}</strong><span>Nya elhandelsavtal · separat periodexempel</span></div></div><p class="commercial-chart-note">Två manuellt angivna periodvärden. Detta är ingen uppmätt konvertering från den lokala ärendelistan nedan. Periodexemplen gäller hyresgästkanalen; fastighetsbolagets egen elförbrukning ingår inte.</p>`:''}</section><section class="card commercial-owner-card"><div class="panel-heading"><div><h2>Ansvar & nästa steg</h2><p class="commercial-subtitle">Interna lokala utkast</p></div><button class="text-button" id="commercial-edit-management">${icon('edit')} Redigera</button></div><dl><dt>Intern ansvarig</dt><dd>${e(m.owner)}</dd><dt>Nästa uppföljning · ${P.date(m.date)}</dt><dd>${e(m.next)}</dd></dl><div class="commercial-internal-note"><small>INTERN ANTECKNING · DEMOVY</small><p>${e(m.note||'Ingen anteckning ännu.')}</p></div></section></div>${roleFocus(id)}${journeySummary(id)}<section class="card commercial-detail-activity"><div class="panel-heading"><div><h2>${isEstate?'Överlämning och handläggning':'Vad gör partnern?'}</h2><p class="commercial-subtitle">Senaste lokala testaktiviteter · alla datum</p></div><button class="text-button" data-commercial-preview="${id}">Öppna arbetsytan ${icon('arrow')}</button></div><div class="activity-list">${events.length?events.map(ev=>`<div class="activity-row"><span class="activity-icon">${icon('file')}</span><span><small>${P.date(ev.at)} · ${e(ev.actor||'Exempelaktivitet')}</small><strong>${e(ev.company)}</strong><span>${e(ev.text)}</span></span></div>`).join(''):`<div class="commercial-empty-activity">${icon(isEstate?'home':'users')}<div><strong>Ingen lokal testaktivitet ännu.</strong><p>Förhandsgranska arbetsytan och testa ${isEstate?'överlämning av ett inflyttningsärende':id==='vast'?'ett konsumentunderlag':'en företagsdialog'}.</p></div></div>`}</div><p class="commercial-chart-note">Lokala aktiviteter och ekonomiska exempelvärden är separata. Ett demosteg ändrar inte periodens ekonomiska exempel.</p></section>${note()}</div>`;
  }
  function editManagement(id) {
    const p=partner(id),m=management(id);
    P.openDialog(`Intern uppföljning · ${p.name}`,`<form id="commercial-management-form" class="commercial-management-form"><p class="muted">Spara ett internt testutkast för denna partner. Uppgifterna stannar i din webbläsare.</p><div class="form-grid"><label class="field">Intern ansvarig<input name="owner" required maxlength="80" value="${e(m.owner)}" placeholder="Demoansvarig A"></label><label class="field">Exempelplacering i partnerresan<select name="stage">${journeySteps.map((title,index)=>`<option value="${index}"${m.stage===index?' selected':''}>${index+1}. ${e(title)}</option>`).join('')}</select></label></div><label class="field">Nästa gemensamma steg<input name="next" required maxlength="200" value="${e(m.next)}"></label><label class="field">Datum för uppföljning<input type="date" name="date" value="${e(m.date)}"></label><label class="field">Intern anteckning · använd exempel<textarea name="note" rows="4" maxlength="1200">${e(m.note||'')}</textarea></label><div class="modal-actions"><button type="button" class="btn btn-secondary" id="commercial-cancel-management">Avbryt</button><button type="submit" class="btn btn-primary">Spara lokalt utkast</button></div></form>`,()=>{
      const form=document.querySelector('#commercial-management-form');
      document.querySelector('#commercial-cancel-management').onclick=P.closeDialog;
      form.onsubmit=event=>{
        event.preventDefault();
        if(!P.validText(form.elements.owner)||!P.validText(form.elements.next))return;
        const patch = {owner:form.elements.owner.value.trim(),stage:Number(form.elements.stage.value),next:form.elements.next.value.trim(),date:form.elements.date.value,note:form.elements.note.value.trim()};
        if (!saveManagement(id, patch, `Intern uppföljning sparad. Nästa steg: ${patch.next}`)) return;
        P.closeDialog();P.render();P.toast('Partnerns interna testutkast är sparat i denna webbläsare.');
      };
    });
  }
  function showPotential(selectedIds) {
    P.openDialog('Framtida potential · exempel',`<div class="commercial-potential-dialog"><span class="pill">Manuellt exempel · 7 oktober 2026</span><p class="muted">Dessa testvärden ligger utanför periodens utfall. Inga vinstsannolikheter eller ersättningsregler används.</p><div class="table-wrap"><table><thead><tr><th>Partner</th><th>Öppet underlag</th><th>Indikativt bidrag</th><th>Årsvolym</th></tr></thead><tbody>${selectedIds.filter(id=>potential[id]).map(id=>`<tr><td>${e(partner(id).name)}</td><td>${potential[id].count} ${e(potential[id].label.toLocaleLowerCase('sv-SE'))}</td><td>${moneyText(potential[id].contribution)}</td><td>${num(potential[id].volume)} MWh</td></tr>`).join('')}</tbody></table></div><p class="commercial-demo-note">Anmälningar är inte avtal. Potentialen är ett separat ekonomiskt exempel, inte ett verifierat eller viktat prognosvärde.</p></div>`);
  }
  function exportExamples() {
    const p=currentPeriod();
    const escapeCsv=value=>{
      const text = String(value);
      // Quoting alone does not keep Excel from executing a partner name as a
      // formula. Keep numeric result cells numeric; export names as text.
      const safe = typeof value === 'string' && /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g,'""')}"`;
    };
    const lines=[['DEMO – manuella exempel, ekonomiskt mått ej beslutat'],['Period',p.label],['Jämförelse',p.comparison],['Partner','Nettobidrag kr – exempel','Resultatbidrag kr – exempel','Partnerkostnad kr – exempel','Nya avtal – exempel','Årsvolym MWh – exempel']];
    sortedPartners().forEach(id=>{const v=valuesFor(id);lines.push(hasFinancialData(id)?[partner(id).name,v.net,v.contribution,v.cost,v.agreements,v.volume]:[partner(id).name,'Underlag saknas','','','','']);});
    P.download(`partnerutfall-exempel-${p.id}.csv`,'\uFEFF'+lines.map(row=>row.map(escapeCsv).join(';')).join('\n'),'text/csv;charset=utf-8');
    P.toast('Periodens ekonomiska exempel har exporterats.');
  }
  function bindPartnerLinks(scope = document) {
    scope.querySelectorAll('[data-partner-create]').forEach(button=>button.onclick=()=>P.partnerSetup?.open());
    scope.querySelectorAll('[data-partner-edit]').forEach(button=>button.onclick=()=>P.partnerSetup?.open(button.dataset.partnerEdit));
    scope.querySelectorAll('[data-commercial-partner]').forEach(button=>{button.onclick=()=>selectPartner(button.dataset.commercialPartner);});
    scope.querySelectorAll('[data-commercial-results]').forEach(button=>{button.onclick=()=>{const id=button.dataset.commercialResults;if(ids.includes(id))P.selectedPartnerId=id;if(P.partnerResults?.selectPartner)P.partnerResults.selectPartner(id);else selectPartner(id,'partner-results');};});
    scope.querySelectorAll('[data-commercial-preview]').forEach(button=>{button.onclick=()=>P.previewPartner?.(button.dataset.commercialPreview);});
    scope.querySelectorAll('[data-commercial-journey]').forEach(button=>{button.onclick=()=>selectPartner(button.dataset.commercialJourney,'journey');});
    scope.querySelectorAll('[data-commercial-business-record]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId='syd';if(P.openBusinessBrief)P.openBusinessBrief(button.dataset.commercialBusinessRecord);else P.go('business-brief');};});
    scope.querySelectorAll('[data-commercial-business-open]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId='syd';P.go('business-brief');};});
    scope.querySelectorAll('[data-commercial-consumer-record]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId='vast';if(P.consumer?.open)P.consumer.open(button.dataset.commercialConsumerRecord);else P.go('consumer-sales');};});
    scope.querySelectorAll('[data-commercial-consumer-open]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId='vast';P.go('consumer-sales');};});
    scope.querySelectorAll('[data-commercial-movein-record]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId=button.dataset.commercialMoveinPartner;if(P.moveinService?.open)P.moveinService.open(button.dataset.commercialMoveinRecord);else P.go('movein-cases');};});
    scope.querySelectorAll('[data-commercial-movein-open]').forEach(button=>{button.onclick=()=>{P.selectedPartnerId=button.dataset.commercialMoveinOpen;P.go('movein-cases');};});
  }
  function bindControls() {
    document.querySelector('#commercial-period-kind')?.addEventListener('change',event=>{periodKind=event.target.value;periodId=periods[periodKind][0].id;P.render();document.querySelector('#commercial-period-kind')?.focus();});
    document.querySelector('#commercial-period')?.addEventListener('change',event=>{periodId=event.target.value;P.render();document.querySelector('#commercial-period')?.focus();});
    document.querySelector('#commercial-type')?.addEventListener('change',event=>{typeFilter=event.target.value;P.render();document.querySelector('#commercial-type')?.focus();});
    const search=document.querySelector('#commercial-search');
    if(search) search.oninput=()=>{
      partnerQuery=search.value;
      // Keep the search field and its caret in place while updating the financial scope.
      const start=search.selectionStart,end=search.selectionEnd;
      P.render();
      const next=document.querySelector('#commercial-search');
      next?.focus();
      try { next?.setSelectionRange(start,end); } catch {}
    };
    document.querySelector('#commercial-sort')?.addEventListener('change',event=>{sortBy=event.target.value;const tbody=document.querySelector('#commercial-table-body');tbody.innerHTML=partnerRows();bindPartnerLinks(tbody);});
    document.querySelector('#commercial-export')?.addEventListener('click',exportExamples);
    const potentialIds=P.page==='partner-detail'?[selectedPartner()]:partnersMatching();
    document.querySelector('#commercial-show-potential')?.addEventListener('click',()=>showPotential(potentialIds));
    document.querySelector('#commercial-edit-management')?.addEventListener('click',()=>editManagement(selectedPartner()));
    bindPartnerLinks();
  }
  function renderJourney() {
    initManagement();
    const id=selectedPartner(),p=partner(id),m=management(id);
    const chosen=Number.isInteger(selectedJourneyStep)?selectedJourneyStep:m.stage;
    const checklist=m.checks||[];
    return `<div class="commercial-page"><button class="commercial-back text-button" data-commercial-partner="${id}">← ${e(p.name)} · partneröversikt</button>${header(`Partnerresan · ${p.name}`,'Kraftringens interna process för att starta, följa upp och utveckla samarbetet.',`<label class="commercial-journey-partner-select">Välj partner<select id="commercial-journey-partner">${ids.map(value=>`<option value="${value}"${id===value?' selected':''}>${e(partner(value).name)}</option>`).join('')}</select></label>`)}<div class="commercial-journey-banner"><div>${icon('target')}<div><strong>Det här är er resa med partnern.</strong><p>Kundernas affärsflöde ligger i partnerns arbetsyta. Stegen nedan är interna testförslag, inte en beslutad process.</p></div></div><span class="commercial-example-badge">Exempelplacering: ${e(journeySteps[m.stage])}</span></div><nav class="commercial-journey-navigation" aria-label="Intern partnerresa">${journeySteps.map((title,index)=>`<button class="commercial-journey-step${chosen===index?' selected':''}${m.stage===index?' actual':''}" data-commercial-step="${index}" aria-current="${chosen===index?'step':'false'}"><span>${index+1}</span><strong>${e(title)}</strong><small>${m.stage===index?'Nu · exempel':'Testförslag'}</small></button>`).join('')}</nav><div class="commercial-detail-grid"><section class="card commercial-journey-step-detail"><span class="commercial-eyebrow">STEG ${chosen+1} AV 8 / INTERN TESTPROCESS</span><h2>${e(journeySteps[chosen])}</h2><p>${e(journeyDescriptions[chosen])}</p><h3>Möjliga interna aktiviteter</h3><div class="commercial-journey-checks">${journeyTasks[chosen].map((task,index)=>`<label><input type="checkbox" data-commercial-check="${chosen}-${index}"${checklist.includes(`${chosen}-${index}`)?' checked':''}><span>${e(task)}</span><small>Demomoment</small></label>`).join('')}</div><div class="commercial-journey-step-actions">${chosen===m.stage?'<span class="pill">Partnerns nuvarande exempelplacering</span>':`<button class="btn btn-primary" id="commercial-place-stage" data-stage="${chosen}">Sätt som exempelplacering</button>`}<button class="btn btn-secondary" id="commercial-edit-management">${icon('edit')} Ansvar & nästa steg</button></div></section><aside class="card commercial-journey-followup"><span class="commercial-eyebrow">KOMMERSIELL UPPFÖLJNING</span><h2>${e(p.name)}</h2><strong class="commercial-journey-net ${valuesFor(id).net<0?'commercial-negative':''}">${hasFinancialData(id)?money(valuesFor(id).net):'—'}</strong><p class="commercial-subtitle">${hasFinancialData(id)?'Nettobidrag':'Resultatunderlag saknas'} · ${e(currentPeriod().label)} · exempel</p><dl><dt>Intern ansvarig</dt><dd>${e(m.owner)}</dd><dt>Nästa steg · ${P.date(m.date)}</dt><dd>${e(m.next)}</dd></dl><button class="text-button" data-commercial-partner="${id}">Till partnerns resultat ${icon('arrow')}</button></aside></div><p class="commercial-demo-note">${icon('shield')}<span>Placering, checklistor och anteckningar sparas lokalt per partner. Demovyn är inget behörighetsskydd. Krav, mandat och ekonomisk uppföljningsmodell behöver ni besluta.</span></p></div>`;
  }
  function bindJourney() {
    bindControls();
    document.querySelector('#commercial-journey-partner').onchange=event=>{selectPartner(event.target.value,'journey');document.querySelector('#commercial-journey-partner')?.focus();};
    document.querySelectorAll('[data-commercial-step]').forEach(button=>{button.onclick=()=>{selectedJourneyStep=Number(button.dataset.commercialStep);P.render();document.querySelector(`[data-commercial-step="${selectedJourneyStep}"]`)?.focus();};});
    document.querySelectorAll('[data-commercial-check]').forEach(input=>{input.onchange=()=>{
      const m=management(selectedPartner());
      const checks = m.checks.filter(key=>key!==input.dataset.commercialCheck);
      if(input.checked)checks.push(input.dataset.commercialCheck);
      if (!saveManagement(selectedPartner(), {checks})) {
        input.checked = m.checks.includes(input.dataset.commercialCheck);
        return;
      }
      P.toast('Det interna demomomentet är sparat för denna partner.');
    };});
    document.querySelector('#commercial-place-stage')?.addEventListener('click',event=>{
      const id=selectedPartner(),stage=Number(event.currentTarget.dataset.stage);
      if (!Number.isInteger(stage) || stage < 0 || stage >= journeySteps.length) return;
      if (!saveManagement(id, {stage}, `Exempelplacering ändrad till ${journeySteps[stage]}.`)) return;
      P.render();document.querySelector(`[data-commercial-step="${stage}"]`)?.focus();P.toast('Partnerns exempelplacering är sparad lokalt.');
    });
  }
  const internalOnly = render => () => P.role==='internal'?render():`<div class="empty">Denna vy tillhör Kraftringens interna demovy.</div>`;
  P.register('internal-overview',{render:internalOnly(renderOverview),bind:()=>{if(P.role==='internal')bindControls();}});
  P.register('internal-reports',{render:internalOnly(renderReports),bind:()=>{if(P.role==='internal')bindControls();}});
  P.register('partners',{render:internalOnly(renderPartners),bind:()=>{if(P.role==='internal')bindControls();}});
  P.register('partner-detail',{render:internalOnly(renderPartnerDetail),bind:()=>{if(P.role==='internal'){bindControls();P.employeeChannel?.bind();P.partnerResults?.bindPanel?.(document,selectedPartner(),currentPeriod());P.partnerKickback?.bindSummary?.(document);}}});
  P.register('journey',{render:internalOnly(renderJourney),bind:()=>{if(P.role==='internal')bindJourney();}});
  P.commercial = { selectPartner, fixtures, valuesFor, currentPeriod, renderOverview, renderControls:periodControls, bindControls, partnerIds:ids };
})();
