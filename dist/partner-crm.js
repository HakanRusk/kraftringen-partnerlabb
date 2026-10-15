(() => {
  'use strict';
  const P = window.Portal, e = P.escape, icon = P.icon;
  const stages = { lead: 'Ny kontakt', contact: 'Dialog pågår', meeting: 'Möte bokat', offer: 'Offert skickad', won: 'Vunnen', lost: 'Förlorad' };
  const segments = { business: 'Företag (B2B)', consumer: 'Konsument (B2C)' };
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const text = value => typeof value === 'string' ? value.trim() : '';
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const products = segment => P.partnerResultsData?.segmentCatalog?.[segment] || [];
  const electricityKeys = ['currentSupplier','contractEndDate','electricityArea','annualConsumptionKwh','productInterest'];
  const wonMessage = 'Markerad som vunnen i CRM. Avtalet tecknas fortfarande i Kraftringens avtalsprocess. Inget har skickats.';
  // Calendar arithmetic avoids DST shifts and clamps month-end dates (31 Jan → 28/29 Feb).
  function shiftDate(value, days=0, months=0) {
    const date = new Date(`${value}T12:00:00Z`), day = date.getUTCDate();
    if (months) {
      date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+months);
      const end = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
      date.setUTCDate(Math.min(day,end));
    }
    date.setUTCDate(date.getUTCDate()+days);
    return date.toISOString().slice(0,10);
  }
  function displayDate(value, missing='Datum saknas') {
    if (typeof value!=='string' || !value || Number.isNaN(Date.parse(value))) return missing;
    const calendar=/^\d{4}-\d{2}-\d{2}$/.test(value);
    if (calendar && !validDate(value)) return missing;
    const date=new Date(calendar?`${value}T12:00:00Z`:value);
    const year=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric'}).format(date);
    return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'short',...(year!==today().slice(0,4)?{year:'numeric'}:{})}).format(date);
  }
  const closedDate = row => displayDate(row.closedAt || row[row.stage==='won'?'wonAt':'lostAt']);
  const compactConsumption = value => String(value??'').trim().replace(/[ \u00a0\u202f]/g,'').replace(',','.');
  const consumption = row => {
    const input=String(row.annualConsumptionKwh??'').trim();
    if (!/^(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(input)) return null;
    const value=compactConsumption(input);
    return /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) && Number(value)>=0 ? Number(value) : null;
  };
  const formattedConsumption = value => {
    const number=consumption({annualConsumptionKwh:value});
    return number===null?'':number.toLocaleString('sv-SE',{maximumFractionDigits:20});
  };
  function wholeConsumption(value) {
    const input=String(value??'').trim();
    if (!input) return '';
    if (!/^(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)$/.test(input)) return null;
    const number=Number(compactConsumption(input));
    return Number.isSafeInteger(number)?String(number):null;
  }
  const nextStage = stage => ({lead:'contact',contact:'meeting',meeting:'offer',offer:'won'})[stage];
  const closed = row => ['won', 'lost'].includes(row.stage);
  const activePartner = () => P.role === 'partner' ? P.partner : P.selectedPartnerId;
  const enabled = id => ['sales', 'field'].includes(P.getPartner(id)?.type) && P.getPartner(id)?.crmMode === 'portal';
  const allowed = id => enabled(id) && (P.role === 'internal' ? id === P.selectedPartnerId : id === P.partner);
  const isRow = row => row && typeof row === 'object' && typeof row.id === 'string' && typeof row.partner === 'string' && typeof row.name === 'string' && own(stages,row.stage) && own(segments,row.segment) && (closed(row) || typeof row.nextAction === 'string' && validDate(row.nextDate));
  const allRows = () => Array.isArray(P.state.crmRecords) ? P.state.crmRecords : [];
  const rows = (id = activePartner()) => allowed(id) ? allRows().filter(row => isRow(row) && row.partner === id) : [];
  const find = id => rows().find(row => row.id === id);
  const filters = new Map();
  function filter() {
    const key = `${P.role}:${activePartner()}`;
    if (!filters.has(key)) filters.set(key,{query:'',stage:'all',segment:'all',due:'all'});
    return filters.get(key);
  }
  function filtered() {
    const saved = filter(), activities = P.page === 'crm-activities';
    const f = {...saved,stage:activities?'all':saved.stage,due:activities?saved.due:'all'};
    return rows().filter(row => [row.name,row.contact,row.owner,row.city,row.email,row.phone].join(' ').toLocaleLowerCase('sv-SE').includes(f.query.toLocaleLowerCase('sv-SE')) && (f.stage==='all'||row.stage===f.stage) && (f.segment==='all'||row.segment===f.segment) && (f.due==='all'||!closed(row)&&(f.due==='overdue'?row.nextDate<today():row.nextDate===today())));
  }
  function commit(next) {
    const before = P.state.crmRecords, existed = own(P.state,'crmRecords');
    P.state.crmRecords = next;
    let saved = false;
    try { saved = P.save() === true; } catch {}
    if (!saved) { if (existed) P.state.crmRecords = before; else delete P.state.crmRecords; }
    return saved;
  }
  function save(payload, id, expectedRevision) {
    const partner = activePartner();
    if (!allowed(partner)) return {ok:false,error:'Öppna en partner som använder Partnerportalen som CRM.'};
    if (own(P.state,'crmRecords')&&!Array.isArray(P.state.crmRecords)) return {ok:false,error:'CRM-underlaget kan inte läsas. Befintliga uppgifter har behållits.'};
    const old = id ? find(id) : null;
    if (id && !old) return {ok:false,error:'Kunden finns inte i denna partners CRM.'};
    if (old && expectedRevision !== undefined && (old.revision || 0) !== expectedRevision) return {ok:false,error:'Kundkortet har ändrats. Öppna det på nytt innan du sparar.'};
    const segment = old?.segment || payload.segment;
    if (!own(segments,segment) || (!old && !P.getPartner(partner).salesAudiences.includes(segment))) return {ok:false,error:'Välj ett av partnerns kundsegment.'};
    const row = {...old,partner,segment};
    const limits = {name:120,contact:100,email:160,phone:60,city:100,owner:100,nextAction:240,lostReason:300};
    for (const [key,max] of Object.entries(limits)) {
      row[key] = text(payload[key]);
      if (row[key].length > max) return {ok:false,error:`Ett fält innehåller för mycket text (högst ${max} tecken).`};
    }
    // Keep identifiers as strings: an 18-digit installation ID exceeds safe integer precision.
    const identityKey = segment === 'business' ? 'organizationNumber' : 'personalNumber';
    const identifierRules = {
      organizationNumber: [/^\d{6}-?\d{4}$/, 'Organisationsnummer ska innehålla 10 siffror, med eller utan bindestreck.'],
      personalNumber: [/^(?:\d{6}|\d{8})[-+]?\d{4}$/, 'Personnummer ska innehålla 10 eller 12 siffror, med eller utan bindestreck eller plustecken.'],
      facilityId: [/^\d{18}$/, 'Anläggnings-ID ska innehålla 18 siffror.'],
      gridAreaCode: [/^[A-Z]{3}$/, 'Nätområdeskod ska innehålla tre bokstäver (A–Z).']
    };
    for (const key of [identityKey, 'facilityId', 'gridAreaCode']) {
      const [pattern, message] = identifierRules[key];
      if (own(payload,key) && typeof payload[key] !== 'string') return {ok:false,error:message,field:key};
      // Omitted fields from older clients must not erase saved identifiers.
      row[key] = own(payload,key) ? text(payload[key]).replace(/\s/g,'') : text(old?.[key]);
      if (key === 'gridAreaCode') row[key] = row[key].toUpperCase();
      if (row[key] && !pattern.test(row[key])) return {ok:false,error:message,field:key};
    }
    for (const key of electricityKeys) {
      // An older client omitting the new fields must retain saved values.
      if (!own(payload,key)) continue;
      if (typeof payload[key] !== 'string' && !(key==='annualConsumptionKwh' && typeof payload[key]==='number')) return {ok:false,error:'Kontrollera uppgiften under Elavtal i dag.',field:key};
      row[key] = String(payload[key]).trim();
    }
    if (text(row.currentSupplier).length>120) return {ok:false,error:'Leverantörens namn får vara högst 120 tecken.',field:'currentSupplier'};
    if (row.contractEndDate && !validDate(row.contractEndDate)) return {ok:false,error:'Ange ett giltigt slutdatum för nuvarande avtal.',field:'contractEndDate'};
    if (row.electricityArea && !['SE1','SE2','SE3','SE4'].includes(row.electricityArea)) return {ok:false,error:'Välj elområde SE1–SE4.',field:'electricityArea'};
    if (own(payload,'annualConsumptionKwh')) {
      const original=old?.annualConsumptionKwh;
      // A previously accepted decimal remains exact when other fields are edited.
      const unchanged=original!==undefined && [String(original),formattedConsumption(original)].includes(row.annualConsumptionKwh);
      if (unchanged) row.annualConsumptionKwh=original;
      else {
        const normalized=wholeConsumption(row.annualConsumptionKwh);
        if (normalized===null) return {ok:false,error:'Ange årsförbrukningen i hela kWh, till exempel 250 000.',field:'annualConsumptionKwh'};
        row.annualConsumptionKwh=normalized;
      }
    }
    if (row.productInterest && row.productInterest!==old?.productInterest && !products(segment).includes(row.productInterest)) return {ok:false,error:'Välj ett produktintresse från kundsegmentets katalog.',field:'productInterest'};
    row.stage = payload.stage; row.nextDate = text(payload.nextDate);
    const note = text(payload.note);
    if (!row.name) return {ok:false,error:'Ange kundens namn.'};
    if (!own(stages,row.stage)) return {ok:false,error:'Välj ett säljsteg.'};
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return {ok:false,error:'Kontrollera e-postadressen.'};
    if (!closed(row) && (!row.nextAction || !validDate(row.nextDate))) return {ok:false,error:'Öppna affärer behöver en nästa aktivitet och ett giltigt datum.'};
    if (row.stage === 'lost' && !row.lostReason) return {ok:false,error:'Ange varför affären förlorades.'};
    if (note.length > 4000) return {ok:false,error:'Anteckningen får vara högst 4 000 tecken.'};
    if (closed(row)) { row.nextAction='';row.nextDate=''; }
    if (row.stage !== 'lost') row.lostReason='';
    const now = new Date().toISOString();
    row.id = old?.id || `crm-${crypto.randomUUID()}`; row.createdAt = old?.createdAt || now;
    row.updatedAt = now; row.revision = (Number.isSafeInteger(old?.revision) ? old.revision : 0) + 1;
    if (old && closed(old) && old.closedAt) {
      const previousCloseKey = old.stage==='won'?'wonAt':'lostAt';
      if (!row[previousCloseKey]) row[previousCloseKey] = old.closedAt;
    }
    // Editing a legacy closed card must not invent a close date. Actual transitions stamp it.
    row.closedAt = closed(row) ? old?.stage===row.stage ? old.closedAt || old[row.stage==='won'?'wonAt':'lostAt'] || '' : now : '';
    if (closed(row) && old?.stage!==row.stage) row[row.stage==='won'?'wonAt':'lostAt'] = now;
    const previousEvents = Array.isArray(old?.events) ? old.events : [];
    const changes = !old ? ['Kund och affär skapade.'] : [];
    if (old && old.stage!==row.stage) changes.push(`Säljsteg: ${stages[old.stage]} → ${stages[row.stage]}.`);
    if (old && (old.nextAction!==row.nextAction||old.nextDate!==row.nextDate)) changes.push(row.nextAction?`Nästa aktivitet: ${row.nextAction} (${row.nextDate}).`:'Planerad aktivitet avslutad när affären stängdes.');
    if (row.lostReason && row.lostReason !== old?.lostReason) changes.push(`Förlustorsak: ${row.lostReason}`);
    if (old && ['name','contact','email','phone','city','owner',identityKey].some(key=>(row[key]||'')!==(old[key]||''))) changes.push('Kunduppgifter uppdaterade.');
    if (old && ['facilityId','gridAreaCode'].some(key=>(row[key]||'')!==(old[key]||''))) changes.push('Anläggningsuppgifter uppdaterade.');
    if (old && electricityKeys.some(key=>(row[key]??'')!==(old[key]??''))) changes.push('Elavtal i dag uppdaterat.');
    if (note) changes.push(note);
    if (old && !changes.length) return {ok:true,id:old.id};
    row.events = [{at:now,text:changes.join('\n')},...previousEvents];
    const next = old ? allRows().map(item=>item===old?row:item) : [...allRows(),row];
    if (!commit(next)) return {ok:false,error:'Kunde inte spara. Tidigare uppgifter har behållits och formuläret ligger kvar.'};
    return {ok:true,id:row.id};
  }
  const button = (label, attrs, primary=false) => `<button type="button" class="btn ${primary?'btn-primary':'btn-secondary'}" ${attrs}>${label}</button>`;
  const empty = (title,body,action='') => `<div class="crm-empty"><span class="crm-empty-icon">${icon('users')}</span><h2>${title}</h2><p>${body}</p>${action}</div>`;
  const newButton = () => button(`${icon('plus')} Ny kund / affär`,'data-crm-new',true);
  const dueLabel = row => closed(row) ? closedDate(row) : row.nextDate<today()?`Försenad sedan ${displayDate(row.nextDate)}`:row.nextDate===today()?'Idag':displayDate(row.nextDate);
  const badge = row => `<span class="crm-stage crm-stage-${e(row.stage)}">${e(stages[row.stage])}</span>`;
  function header(title,description) {
    return `${P.role==='internal'?'<button class="text-button" data-go="partner-detail">← Till partnern</button>':''}<div class="page-head"><div><span class="eyebrow">${e(P.getPartner(activePartner())?.name)} / CRM</span><h1>${title}</h1><p class="muted">${description}</p></div>${newButton()}</div><p class="crm-scope">Lokalt CRM · sparas i denna webbläsare</p>`;
  }
  function tabs(current) {
    if (P.role==='partner') return '';
    return `<nav class="crm-tabs" aria-label="CRM-vyer">${[['crm','Översikt'],['crm-customers','Kunder & affärer'],['crm-pipeline','Säljpipeline'],['crm-activities','Aktiviteter']].map(([id,label])=>`<button type="button" data-go="${id}" ${current===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;
  }
  function toolbar(activities=false) {
    const f=filter();
    return `<form class="crm-filters" id="crm-filter-form"><label>Sök kund eller ansvarig<input name="query" type="search" value="${e(f.query)}" placeholder="Namn, ort, kontakt…"></label><label>Kundsegment<select name="segment"><option value="all">Alla segment</option>${Object.entries(segments).map(([id,label])=>`<option value="${id}" ${f.segment===id?'selected':''}>${label}</option>`).join('')}</select></label>${activities?`<label>Planering<select name="due">${[['all','Alla planerade'],['today','Idag'],['overdue','Försenade']].map(([id,label])=>`<option value="${id}" ${f.due===id?'selected':''}>${label}</option>`).join('')}</select></label>`:`<label>Säljsteg<select name="stage"><option value="all">Alla steg</option>${Object.entries(stages).map(([id,label])=>`<option value="${id}" ${f.stage===id?'selected':''}>${label}</option>`).join('')}</select></label>`}<button class="btn btn-secondary" type="submit">Visa</button><button class="text-button" type="button" data-crm-clear>Rensa filter</button></form>`;
  }
  function activityList(list) {
    return list.length ? `<div class="crm-activity-list">${list.map(row=>`<button class="crm-activity" type="button" data-crm-open="${e(row.id)}"><span class="crm-due ${row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</span><span><strong>${e(row.nextAction)}</strong><small>${e(row.name)} · ${e(row.owner||'Ansvarig saknas')}</small></span>${icon('arrow')}</button>`).join('')}</div>` : empty('Ingen aktivitet i urvalet','Planera nästa steg på kundkortet eller ändra ditt filter.');
  }
  function contactLinks(row) {
    const phone = text(row.phone), dial = phone.replace(/[\s().-]/g,'');
    const email = text(row.email);
    return `<div class="crm-contact-links">${phone && /^\+?\d+$/.test(dial)?`<a href="tel:${e(dial)}">${e(phone)}</a>`:''}${email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?`<a href="mailto:${e(encodeURIComponent(email))}">${e(email)}</a>`:''}</div>`;
  }
  function renderHome() {
    if (!allowed(activePartner())) return empty('CRM är inte valt','Välj Partnerportalen som CRM i partnerinställningarna.');
    const list=rows(),open=list.filter(r=>!closed(r)),date=today();
    const byActivity=(a,b)=>a.nextDate.localeCompare(b.nextDate);
    const due=open.filter(r=>r.nextDate<=date).sort(byActivity);
    const upcoming=open.filter(r=>r.nextDate>date && r.nextDate<=shiftDate(date,7)).sort(byActivity);
    const expiring=list.filter(r=>validDate(r.contractEndDate) && r.contractEndDate>=date && r.contractEndDate<=shiftDate(date,0,6)).sort((a,b)=>a.contractEndDate.localeCompare(b.contractEndDate));
    return `<div class="crm-page">
      ${header('Ditt kundarbete','Från första kontakt till avslutad affär. Börja med nästa aktivitet.')}${tabs('crm')}
      <div class="crm-metrics">${[['Öppna affärer',open.length,'crm-customers'],['Att följa upp',due.length,'crm-activities'],['Vunna i CRM',list.filter(r=>r.stage==='won').length,'crm-pipeline']].map(([label,count,page])=>`<button type="button" data-go="${page}"><strong>${count}</strong><span>${label}</span></button>`).join('')}</div>
      ${!list.length?`<section class="card">${empty('Lägg till din första kund','Samla kontaktuppgifter, välj säljsteg och planera nästa kontakt.',newButton())}</section>`:''}
      <section class="card"><div class="panel-heading"><h2>Idag och försenat</h2><button class="text-button" data-go="crm-activities">Alla aktiviteter →</button></div>${due.length?activityList(due):'<p class="muted">Du har inga öppna aktiviteter med datum idag eller tidigare.</p>'}</section>
      <section class="card" id="crm-upcoming"><h2>Kommande 7 dagar</h2>${upcoming.length?activityList(upcoming):'<p class="muted">Inga aktiviteter planerade för de kommande sju dagarna.</p>'}</section>
      <section class="card" id="crm-expiring"><h2>Avtal som löper ut inom 6 månader</h2><p class="muted">Kundernas nuvarande avtal, från idag till ${e(displayDate(shiftDate(date,0,6)))}. Öppna ett kundkort för att planera kontakt.</p>
        ${expiring.length?`<div class="crm-activity-list">${expiring.map(row=>`<button class="crm-activity" type="button" data-crm-open="${e(row.id)}"><span class="crm-due">${e(displayDate(row.contractEndDate))}</span><span><strong>${e(row.name)}</strong><small>${e(row.currentSupplier||'Leverantör ej angiven')} · ${e(stages[row.stage])}</small></span>${icon('arrow')}</button>`).join('')}</div>`:'<p class="muted">Inga registrerade slutdatum inom perioden.</p>'}
      </section>
      <p class="crm-footnote">Vunnen är en manuellt registrerad CRM-status. Den tecknar inget elavtal och ändrar inte resultat eller kickback.</p>
    </div>`;
  }
  function renderCustomers() {
    const list=filtered();
    return `<div class="crm-page">${header('Kunder & affärer','Kundkort, kontaktuppgifter och nästa steg på ett ställe.')}${tabs('crm-customers')}
      <section class="card">${toolbar()}${list.length?`<div class="table-wrap"><table class="crm-table"><thead><tr><th>Kund / kontakt</th><th>Säljsteg</th><th>Ansvarig</th><th>Nästa aktivitet</th><th>Datum</th></tr></thead><tbody>
      ${list.map(row=>`<tr><td><button class="text-button crm-customer-name" data-crm-open="${e(row.id)}">${e(row.name)}</button><small>${e(segments[row.segment])}${row.city?' · '+e(row.city):''}</small>${contactLinks(row)}</td><td>${badge(row)}</td><td>${e(row.owner||'Ej angiven')}</td><td>${e(row.nextAction||'Avslutad affär')}</td><td class="${!closed(row)&&row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</td></tr>`).join('')}
      </tbody></table></div>`:empty('Inga kunder i urvalet','Lägg till en kund eller ändra ditt filter.',newButton())}</section></div>`;
  }
  function stageVolume(group) {
    if (!group.length) return '';
    const values=group.map(consumption).filter(value=>value!==null);
    if (!values.length) return '<p class="crm-volume">Årsförbrukning saknas</p>';
    const mwh=values.reduce((sum,value)=>sum+value,0)/1000;
    return `<p class="crm-volume"><strong>${e(mwh.toLocaleString('sv-SE',{maximumFractionDigits:6}))} MWh/år</strong><span>Angiven för ${values.length} av ${group.length} affärer</span></p>`;
  }
  function renderPipeline() {
    const list=filtered(), open=list.filter(row=>!closed(row));
    return `<div class="crm-page">${header('Säljpipeline','Öppna ett kundkort för att ändra säljsteg och boka nästa aktivitet.')}${tabs('crm-pipeline')}<section class="card crm-pipeline-summary" aria-label="Sammanfattning av öppen pipeline"><div><span>Öppna affärer i urvalet</span><strong>${open.length}</strong></div><div><span>Angiven årsförbrukning · öppna affärer</span>${stageVolume(open)||'<p class="crm-volume">—</p>'}</div></section><section class="card">${toolbar()}</section>
      <div class="crm-board">${Object.entries(stages).map(([key,label])=>{
        const group=list.filter(r=>r.stage===key);
        return `<section class="crm-column" data-crm-stage="${key}"><h2>${label}<span>${group.length}</span></h2>${stageVolume(group)}
          ${group.map(row=>`<article class="crm-deal"><button class="crm-deal-open" type="button" data-crm-open="${e(row.id)}"><strong>${e(row.name)}</strong><small>${e(segments[row.segment])} · ${e(row.owner||'Ej tilldelad')}</small><span>${e(row.nextAction||row.lostReason||'Manuellt registrerad som vunnen')}</span><small class="${!closed(row)&&row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</small></button>${nextStage(key)?`<button class="btn btn-secondary crm-advance" type="button" data-crm-advance="${e(row.id)}" aria-label="Flytta ${e(row.name)} till ${e(stages[nextStage(key)])}">Flytta till nästa steg ${icon('arrow')}</button>`:''}</article>`).join('')||'<p class="crm-column-empty">Inga affärer</p>'}
        </section>`;
      }).join('')}</div><p class="crm-footnote">Summan visar angiven årsförbrukning i urvalet, inte avtalad försäljningsvolym. Vunna affärer här förs inte automatiskt över till resultat eller kickback.</p></div>`;
  }
  function renderActivities() {
    const list=filtered().filter(row=>!closed(row)).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
    return `<div class="crm-page">${header('Aktiviteter','Följ upp planerade kundkontakter. Öppna kortet, anteckna och planera nästa steg.')}${tabs('crm-activities')}<section class="card">${toolbar(true)}${activityList(list)}</section></div>`;
  }
  const historyText = value => value.replace(/(^Nästa aktivitet: .* \()(\d{4}-\d{2}-\d{2})(\)\.$)/gm,(_,before,date,after)=>`${before}${displayDate(date)}${after}`);
  function cardSummary(row) {
    return `<div class="crm-summary-heading"><h3>Överblick</h3>${badge(row)}</div><dl class="crm-summary-facts">
      <div><dt>Nästa aktivitet</dt><dd>${closed(row)?'Avslutad affär':`${e(row.nextAction||'Ej angiven')} · ${e(displayDate(row.nextDate))}`}</dd></div>
      <div><dt>Avtal löper ut</dt><dd>${e(displayDate(row.contractEndDate,'Ej angivet'))}</dd></div>
      <div><dt>Årsförbrukning</dt><dd>${consumption(row)===null?'Ej angiven':`${e(formattedConsumption(row.annualConsumptionKwh))} kWh/år`}</dd></div>
      </dl><div id="crm-card-contact">${contactLinks(row)}</div>`;
  }
  function open(id, advance=false) {
    if (!allowed(activePartner())) return;
    const row = id ? find(id) : null;
    if (id&&!row) return;
    const partner=activePartner(), selectedStage=(advance && nextStage(row?.stage)) || row?.stage || 'lead';
    const input=(key,label,type='text',max=120)=>`<label class="field">${label}<input name="${key}" type="${type}" maxlength="${max}" value="${e(row?.[key]??'')}"></label>`;
    const available=row?[row.segment]:P.getPartner(partner).salesAudiences;
    const identifierInput=(key,label,hint,mode='numeric')=>`<label class="field" data-crm-identifier="${key}">${label}<input name="${key}" type="text" inputmode="${mode}" maxlength="40" autocomplete="off" spellcheck="false" aria-describedby="crm-${key}-hint" value="${e(row?.[key]??'')}"><small id="crm-${key}-hint" class="crm-input-hint">${hint}</small></label>`;
    const identityFields = `${available.includes('business')?identifierInput('organizationNumber','Organisationsnummer','10 siffror, med eller utan bindestreck.'):''}${available.includes('consumer')?identifierInput('personalNumber','Personnummer','ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX.'):''}`;
    const facilityFields = `<fieldset class="crm-facility"><legend>Anläggningsuppgifter</legend><p class="crm-input-hint">Finns på kundens elnätsfaktura. Kan kompletteras senare.</p><div class="crm-form-grid">${identifierInput('facilityId','Anläggnings-ID','18 siffror. Mellanslag går bra vid inklistring.')}${identifierInput('gridAreaCode','Nätområdeskod','Tre bokstäver, även kallat nätområdes-ID.','text')}</div></fieldset>`;
    const electricityFields = `<fieldset class="crm-facility"><legend>Elavtal i dag</legend><p class="crm-input-hint">Frivilliga uppgifter för nästa kunddialog.</p><div class="crm-form-grid">
      ${input('currentSupplier','Nuvarande elleverantör')}${input('contractEndDate','Nuvarande avtal löper ut','date')}
      <label class="field">Elområde<select name="electricityArea"><option value="">Ej angivet</option>${['SE1','SE2','SE3','SE4'].map(area=>`<option ${row?.electricityArea===area?'selected':''}>${area}</option>`).join('')}</select></label>
      <label class="field">Årsförbrukning i kWh<input name="annualConsumptionKwh" inputmode="numeric" maxlength="24" value="${e(formattedConsumption(row?.annualConsumptionKwh))}" placeholder="Exempel: 250 000"></label>
      <label class="field">Produktintresse<select name="productInterest"></select></label>
    </div></fieldset>`;
    P.openDialog(row?'Kundkort':'Ny kund / affär',`<form id="crm-customer-form" class="crm-form">
      ${row?`<section id="crm-card-summary" class="crm-card-summary" aria-label="Överblick över kundkortet" tabindex="-1">${cardSummary({...row,stage:selectedStage})}</section>`:''}
      <p class="crm-form-context muted">${e(P.getPartner(partner).name)} · lokalt CRM</p>
      <div class="crm-form-grid">${input('name','Kundnamn *')}
        ${row?`<label class="field">Kundsegment<input value="${e(segments[row.segment])}" disabled></label>`:`<label class="field">Kundsegment<select name="segment">${available.map(key=>`<option value="${key}">${segments[key]}</option>`).join('')}</select></label>`}
        ${identityFields}${input('contact','Kontaktperson','text',100)}${input('email','E-post','email',160)}${input('phone','Telefon','tel',60)}${input('city','Ort','text',100)}${input('owner','Ansvarig säljare','text',100)}
        <label class="field">Säljsteg<select name="stage">${Object.entries(stages).map(([key,label])=>`<option value="${key}" ${selectedStage===key?'selected':''}>${label}</option>`).join('')}</select></label>
      </div>${!row?'<div id="crm-card-contact"></div>':''}${facilityFields}${electricityFields}
      <p id="crm-won-guidance" class="crm-won-guidance" role="status" hidden></p>
      <fieldset id="crm-next" class="crm-next"><legend>Nästa aktivitet</legend>
        <label class="field">Vad ska göras? *<input name="nextAction" maxlength="240" placeholder="Exempel: Ring och boka möte" value="${e(row?.nextAction||'')}"></label>
        <label class="field">Datum *<input name="nextDate" type="date" value="${e(row?.nextDate||'')}"></label>
        <div class="crm-date-shortcuts" role="group" aria-label="Snabbval för nästa aktivitet">${[['today','Idag'],['tomorrow','Imorgon'],['week','Om en vecka'],['month','Om en månad']].map(([key,label])=>button(label,`data-crm-date="${key}"`)).join('')}</div>
      </fieldset>
      <label class="field" id="crm-lost">Varför förlorades affären? *<input name="lostReason" maxlength="300" value="${e(row?.lostReason||'')}"></label>
      ${row && closed(row)?`<p class="crm-footnote">${e(stages[row.stage])}: ${e(closedDate(row))}</p>`:''}
      <label class="field">Ny anteckning<textarea name="note" maxlength="4000" rows="3" placeholder="Vad kom ni överens om?"></textarea></label>
      <p id="crm-form-error" class="partner-setup-error" role="alert" hidden></p>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" id="crm-cancel">Avbryt</button><button class="btn btn-primary" type="submit">Spara kundkort ${icon('check')}</button></div>
      <p class="crm-footnote">Sparas i denna webbläsare. En statusändring tecknar inget avtal och skickar inget meddelande.</p>
      ${row?`<details class="crm-history"><summary>Historik & anteckningar</summary>${(Array.isArray(row.events)?row.events:[]).filter(ev=>ev&&typeof ev.text==='string').map(ev=>`<article><small>${e(displayDate(ev.at))}</small><p>${e(historyText(ev.text))}</p></article>`).join('')||'<p>Ingen historik ännu.</p>'}</details>`:''}
    </form>`,()=>{
      const form=document.querySelector('#crm-customer-form'), error=document.querySelector('#crm-form-error');
      const next=document.querySelector('#crm-next'),lost=document.querySelector('#crm-lost');
      const won=document.querySelector('#crm-won-guidance');
      const updateWon=()=>{
        won.hidden=form.elements.stage.value!=='won';
        won.textContent=won.hidden?'':'Nästa steg: hantera elhandelsavtalet separat enligt Kraftringens godkända process. Vunnen är en CRM-status. Inget har skickats och resultat eller kickback ändras inte.';
      };
      updateWon();form.elements.stage.addEventListener('change',updateWon);
      const updateProducts=()=>{
        const segment=row?.segment||form.elements.segment.value, field=form.elements.productInterest;
        const selected=field.value||row?.productInterest||'', catalog=products(segment);
        const retained=row?.productInterest && !catalog.includes(row.productInterest) ? [row.productInterest] : [];
        field.innerHTML='<option value="">Ej valt</option>'+[...catalog,...retained].map(product=>`<option value="${e(product)}">${e(product)}${retained.includes(product)?' (tidigare sparat)':''}</option>`).join('');
        field.value=[...catalog,...retained].includes(selected)?selected:'';
      };
      updateProducts();form.elements.segment?.addEventListener('change',updateProducts);
      const updateSummary=()=>{
        if (row) document.querySelector('#crm-card-summary').innerHTML=cardSummary({...row,...Object.fromEntries(new FormData(form))});
        else document.querySelector('#crm-card-contact').innerHTML=contactLinks({email:form.elements.email.value,phone:form.elements.phone.value});
      };
      form.addEventListener('input',updateSummary);form.addEventListener('change',updateSummary);
      form.elements.annualConsumptionKwh.addEventListener('blur',()=>{
        const field=form.elements.annualConsumptionKwh, normalized=wholeConsumption(field.value);
        if (normalized!==null) field.value=formattedConsumption(normalized);
        updateSummary();
      });
      form.querySelectorAll('[data-crm-date]').forEach(node=>node.onclick=()=>{
        const key=node.dataset.crmDate;
        form.elements.nextDate.value=shiftDate(today(),key==='tomorrow'?1:key==='week'?7:0,key==='month'?1:0);
        form.elements.nextDate.dispatchEvent(new Event('input',{bubbles:true}));
        form.elements.nextDate.focus();
      });
      form.elements.name.required=true;
      const update=()=>{const stage=form.elements.stage.value,isClosed=['won','lost'].includes(stage);next.hidden=isClosed;next.disabled=isClosed;form.elements.nextAction.required=!isClosed;form.elements.nextDate.required=!isClosed;lost.hidden=stage!=='lost';form.elements.lostReason.disabled=stage!=='lost';form.elements.lostReason.required=stage==='lost';};
      const updateIdentity=()=>{
        const segment=row?.segment||form.elements.segment.value;
        for (const [key,target] of [['organizationNumber','business'],['personalNumber','consumer']]) {
          const field=form.querySelector(`[data-crm-identifier="${key}"]`);
          if (field) { field.hidden=segment!==target;form.elements[key].disabled=segment!==target; }
        }
      };
      updateIdentity();form.elements.segment?.addEventListener('change',updateIdentity);
      form.addEventListener('input',event=>event.target.removeAttribute('aria-invalid'));
      update();form.elements.stage.addEventListener('change',update);
      document.querySelector('#crm-cancel').onclick=P.closeDialog;
      form.addEventListener('submit',event=>{
        event.preventDefault();if(!form.reportValidity())return;
        if(partner!==activePartner()||!allowed(partner)){error.textContent='Partnern har ändrats. Öppna kundkortet igen.';error.hidden=false;return;}
        const result=save(Object.fromEntries(new FormData(form)),id,row?.revision || 0);
        if(!result.ok){error.textContent=result.error;error.hidden=false;if(result.field){form.elements[result.field].setAttribute('aria-invalid','true');form.elements[result.field].focus();}return;}
        const savedStage=form.elements.stage.value;
        P.closeDialog();P.render();P.toast(savedStage==='won'?wonMessage:'Kundkortet är sparat.');
      });
      if (advance && !['won','lost'].includes(selectedStage)) form.elements.nextAction.focus();
      else if (row) { document.querySelector('#crm-card-summary').focus({preventScroll:true});document.querySelector('#portal-dialog').scrollTop=0; }
      else form.elements.name.focus();
    });
  }
  function bind() {
    document.querySelectorAll('[data-crm-new]').forEach(node=>node.onclick=()=>open());
    document.querySelectorAll('[data-crm-open]').forEach(node=>node.onclick=()=>open(node.dataset.crmOpen));
    document.querySelectorAll('[data-crm-advance]').forEach(node=>node.onclick=()=>open(node.dataset.crmAdvance,true));
    const form=document.querySelector('#crm-filter-form');
    if (form) {
      const apply=()=>{
        const values=Object.fromEntries(new FormData(form));
        Object.assign(filter(),{query:values.query||'',segment:values.segment||'all',...(values.stage?{stage:values.stage}:{}),...(values.due?{due:values.due}:{})});
        P.render();
      };
      form.onsubmit=event=>{event.preventDefault();apply();};
      const search=form.elements.query;
      const liveSearch=event=>{
        if(event.isComposing)return;
        const start=search.selectionStart,end=search.selectionEnd;
        const scrollX=window.scrollX,scrollY=window.scrollY;
        apply();
        const fresh=document.querySelector('#crm-filter-form [name=query]');
        fresh.focus({preventScroll:true});fresh.setSelectionRange(start,end);
        window.scrollTo(scrollX,scrollY);
      };
      search.addEventListener('input',liveSearch);
      search.addEventListener('compositionend',liveSearch);
    }
    document.querySelector('[data-crm-clear]')?.addEventListener('click',()=>{Object.assign(filter(),{query:'',segment:'all',stage:'all',due:'all'});P.render();});
  }
  for(const [id,render] of [['crm',renderHome],['crm-customers',renderCustomers],['crm-pipeline',renderPipeline],['crm-activities',renderActivities]])P.register(id,{render:()=>allowed(activePartner())?render():empty('CRM är inte valt','Öppna en partner som använder portalen som CRM.'),bind});
  P.crm={enabled,rows,save,open,renderHome,bind};
})();
