(() => {
  'use strict';
  const P = window.Portal, e = P.escape, icon = P.icon;
  const stages = { lead: 'Ny kontakt', contact: 'Dialog pågår', meeting: 'Möte bokat', offer: 'Offert skickad', won: 'Vunnen', lost: 'Förlorad' };
  const segments = { business: 'Företag (B2B)', consumer: 'Konsument (B2C)' };
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const text = value => typeof value === 'string' ? value.trim() : '';
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
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
    return rows().filter(row => [row.name,row.contact,row.owner,row.city,row.email].join(' ').toLocaleLowerCase('sv-SE').includes(f.query.toLocaleLowerCase('sv-SE')) && (f.stage==='all'||row.stage===f.stage) && (f.segment==='all'||row.segment===f.segment) && (f.due==='all'||!closed(row)&&(f.due==='overdue'?row.nextDate<today():row.nextDate===today())));
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
    row.updatedAt = now; row.revision = (Number.isSafeInteger(old?.revision) ? old.revision : 0) + 1; row.closedAt = closed(row) ? old?.stage===row.stage ? old.closedAt || now : now : '';
    const previousEvents = Array.isArray(old?.events) ? old.events : [];
    const changes = !old ? ['Kund och affär skapade.'] : [];
    if (old && old.stage!==row.stage) changes.push(`Säljsteg: ${stages[old.stage]} → ${stages[row.stage]}.`);
    if (old && (old.nextAction!==row.nextAction||old.nextDate!==row.nextDate)) changes.push(row.nextAction?`Nästa aktivitet: ${row.nextAction} (${row.nextDate}).`:'Planerad aktivitet avslutad när affären stängdes.');
    if (row.lostReason && row.lostReason !== old?.lostReason) changes.push(`Förlustorsak: ${row.lostReason}`);
    if (old && ['name','contact','email','phone','city','owner'].some(key=>row[key]!==old[key])) changes.push('Kunduppgifter uppdaterade.');
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
  const dueLabel = row => closed(row) ? stages[row.stage] : row.nextDate<today()?`Försenad sedan ${P.date(row.nextDate)}`:row.nextDate===today()?'Idag':P.date(row.nextDate);
  const badge = row => `<span class="crm-stage crm-stage-${e(row.stage)}">${e(stages[row.stage])}</span>`;
  function header(title,description) {
    return `${P.role==='internal'?'<button class="text-button" data-go="partner-detail">← Till partnern</button>':''}<div class="page-head"><div><span class="eyebrow">${e(P.getPartner(activePartner())?.name)} / CRM</span><h1>${title}</h1><p class="muted">${description}</p></div>${newButton()}</div><p class="crm-scope">Lokalt CRM · sparas i denna webbläsare</p>`;
  }
  function tabs(current) {
    return `<nav class="crm-tabs" aria-label="CRM-vyer">${[['crm','Översikt'],['crm-customers','Kunder & affärer'],['crm-pipeline','Säljpipeline'],['crm-activities','Aktiviteter']].map(([id,label])=>`<button type="button" data-go="${id}" ${current===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;
  }
  function toolbar(activities=false) {
    const f=filter();
    return `<form class="crm-filters" id="crm-filter-form"><label>Sök kund eller ansvarig<input name="query" type="search" value="${e(f.query)}" placeholder="Namn, ort, kontakt…"></label><label>Kundsegment<select name="segment"><option value="all">Alla segment</option>${Object.entries(segments).map(([id,label])=>`<option value="${id}" ${f.segment===id?'selected':''}>${label}</option>`).join('')}</select></label>${activities?`<label>Planering<select name="due">${[['all','Alla planerade'],['today','Idag'],['overdue','Försenade']].map(([id,label])=>`<option value="${id}" ${f.due===id?'selected':''}>${label}</option>`).join('')}</select></label>`:`<label>Säljsteg<select name="stage"><option value="all">Alla steg</option>${Object.entries(stages).map(([id,label])=>`<option value="${id}" ${f.stage===id?'selected':''}>${label}</option>`).join('')}</select></label>`}<button class="btn btn-secondary" type="submit">Visa</button><button class="text-button" type="button" data-crm-clear>Rensa filter</button></form>`;
  }
  function activityList(list) {
    return list.length ? `<div class="crm-activity-list">${list.map(row=>`<button class="crm-activity" type="button" data-crm-open="${e(row.id)}"><span class="crm-due ${row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</span><span><strong>${e(row.nextAction)}</strong><small>${e(row.name)} · ${e(row.owner||'Ansvarig saknas')}</small></span>${icon('arrow')}</button>`).join('')}</div>` : empty('Ingen aktivitet i urvalet','Planera nästa steg på kundkortet eller ändra ditt filter.');
  }
  function renderHome() {
    if (!allowed(activePartner())) return empty('CRM är inte valt','Välj Partnerportalen som CRM i partnerinställningarna.');
    const list=rows(),open=list.filter(r=>!closed(r));
    const due=open.filter(r=>r.nextDate<=today()).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
    return `<div class="crm-page">${header('Ditt kundarbete','Från första kontakt till avslutad affär. Börja med nästa aktivitet.')}${tabs('crm')}<div class="crm-metrics">${[['Öppna affärer',open.length,'crm-customers'],['Att följa upp',due.length,'crm-activities'],['Vunna i CRM',list.filter(r=>r.stage==='won').length,'crm-pipeline']].map(([label,count,page])=>`<button type="button" data-go="${page}"><strong>${count}</strong><span>${label}</span></button>`).join('')}</div>${!list.length?`<section class="card">${empty('Lägg till din första kund','Samla kontaktuppgifter, välj säljsteg och planera nästa kontakt.',newButton())}</section>`:`<section class="card"><div class="panel-heading"><h2>Idag och försenat</h2><button class="text-button" data-go="crm-activities">Alla aktiviteter →</button></div>${due.length?activityList(due):'<p class="muted">Du har inga öppna aktiviteter med datum idag eller tidigare.</p>'}</section>`}<p class="crm-footnote">Vunnen är en manuellt registrerad CRM-status. Den tecknar inget elavtal och ändrar inte resultat eller kickback.</p></div>`;
  }
  function renderCustomers() {
    const list=filtered();
    return `<div class="crm-page">${header('Kunder & affärer','Kundkort, kontaktuppgifter och nästa steg på ett ställe.')}${tabs('crm-customers')}<section class="card">${toolbar()}${list.length?`<div class="table-wrap"><table class="crm-table"><thead><tr><th>Kund</th><th>Säljsteg</th><th>Ansvarig</th><th>Nästa aktivitet</th><th>Datum</th></tr></thead><tbody>${list.map(row=>`<tr><td><button class="text-button crm-customer-name" data-crm-open="${e(row.id)}">${e(row.name)}</button><small>${e(segments[row.segment])}${row.city?' · '+e(row.city):''}</small></td><td>${badge(row)}</td><td>${e(row.owner||'Ej angiven')}</td><td>${e(row.nextAction||'Avslutad affär')}</td><td class="${!closed(row)&&row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</td></tr>`).join('')}</tbody></table></div>`:empty('Inga kunder i urvalet','Lägg till en kund eller ändra ditt filter.',newButton())}</section></div>`;
  }
  function renderPipeline() {
    const list=filtered();
    return `<div class="crm-page">${header('Säljpipeline','Öppna ett kundkort för att ändra säljsteg och boka nästa aktivitet.')}${tabs('crm-pipeline')}<section class="card">${toolbar()}</section><div class="crm-board">${Object.entries(stages).map(([key,label])=>{const group=list.filter(r=>r.stage===key);return `<section class="crm-column"><h2>${label}<span>${group.length}</span></h2>${group.map(row=>`<button class="crm-deal" data-crm-open="${e(row.id)}"><strong>${e(row.name)}</strong><small>${e(segments[row.segment])} · ${e(row.owner||'Ej tilldelad')}</small><span>${e(row.nextAction||row.lostReason||'Manuellt registrerad som vunnen')}</span><small class="${!closed(row)&&row.nextDate<today()?'crm-overdue':''}">${e(dueLabel(row))}</small></button>`).join('')||'<p class="crm-column-empty">Inga affärer</p>'}</section>`;}).join('')}</div><p class="crm-footnote">Säljstegen är arbetsstatusar. Vunna affärer här förs inte automatiskt över till resultat eller kickback.</p></div>`;
  }
  function renderActivities() {
    const list=filtered().filter(row=>!closed(row)).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
    return `<div class="crm-page">${header('Aktiviteter','Följ upp planerade kundkontakter. Öppna kortet, anteckna och planera nästa steg.')}${tabs('crm-activities')}<section class="card">${toolbar(true)}${activityList(list)}</section></div>`;
  }
  function open(id) {
    if (!allowed(activePartner())) return;
    const row = id ? find(id) : null;
    if (id&&!row) return;
    const partner=activePartner(), selectedStage=row?.stage||'lead';
    const input=(key,label,type='text',max=120)=>`<label class="field">${label}<input name="${key}" type="${type}" maxlength="${max}" value="${e(row?.[key]||'')}"></label>`;
    const available=row?[row.segment]:P.getPartner(partner).salesAudiences;
    P.openDialog(row?'Kundkort':'Ny kund / affär',`<form id="crm-customer-form" class="crm-form"><p class="muted">${e(P.getPartner(partner).name)} · lokalt CRM</p><div class="crm-form-grid">${input('name','Kundnamn *')}${row?`<label class="field">Kundsegment<input value="${e(segments[row.segment])}" disabled></label>`:`<label class="field">Kundsegment<select name="segment">${available.map(key=>`<option value="${key}">${segments[key]}</option>`).join('')}</select></label>`}${input('contact','Kontaktperson','text',100)}${input('email','E-post','email',160)}${input('phone','Telefon','tel',60)}${input('city','Ort','text',100)}${input('owner','Ansvarig säljare','text',100)}<label class="field">Säljsteg<select name="stage">${Object.entries(stages).map(([key,label])=>`<option value="${key}" ${selectedStage===key?'selected':''}>${label}</option>`).join('')}</select></label></div><fieldset id="crm-next" class="crm-next"><legend>Nästa aktivitet</legend><label class="field">Vad ska göras? *<input name="nextAction" maxlength="240" placeholder="Exempel: Ring och boka möte" value="${e(row?.nextAction||'')}"></label><label class="field">Datum *<input name="nextDate" type="date" value="${e(row?.nextDate||'')}"></label></fieldset><label class="field" id="crm-lost">Varför förlorades affären? *<input name="lostReason" maxlength="300" value="${e(row?.lostReason||'')}"></label><label class="field">Ny anteckning<textarea name="note" maxlength="4000" rows="3" placeholder="Vad kom ni överens om?"></textarea></label><p id="crm-form-error" class="partner-setup-error" role="alert" hidden></p><div class="modal-actions"><button type="button" class="btn btn-secondary" id="crm-cancel">Avbryt</button><button class="btn btn-primary" type="submit">Spara kundkort ${icon('check')}</button></div><p class="crm-footnote">Sparas i denna webbläsare. En statusändring tecknar inget avtal och skickar inget meddelande.</p>${row?`<details class="crm-history"><summary>Historik & anteckningar</summary>${(Array.isArray(row.events)?row.events:[]).filter(ev=>ev&&typeof ev.text==='string').map(ev=>`<article><small>${e(P.date(ev.at))}</small><p>${e(ev.text)}</p></article>`).join('')||'<p>Ingen historik ännu.</p>'}</details>`:''}</form>`,()=>{
      const form=document.querySelector('#crm-customer-form'), error=document.querySelector('#crm-form-error');
      const next=document.querySelector('#crm-next'),lost=document.querySelector('#crm-lost');
      form.elements.name.required=true;
      const update=()=>{const stage=form.elements.stage.value,isClosed=['won','lost'].includes(stage);next.hidden=isClosed;next.disabled=isClosed;form.elements.nextAction.required=!isClosed;form.elements.nextDate.required=!isClosed;lost.hidden=stage!=='lost';form.elements.lostReason.disabled=stage!=='lost';form.elements.lostReason.required=stage==='lost';};
      update();form.elements.stage.addEventListener('change',update);
      document.querySelector('#crm-cancel').onclick=P.closeDialog;
      form.addEventListener('submit',event=>{
        event.preventDefault();if(!form.reportValidity())return;
        if(partner!==activePartner()||!allowed(partner)){error.textContent='Partnern har ändrats. Öppna kundkortet igen.';error.hidden=false;return;}
        const result=save(Object.fromEntries(new FormData(form)),id,row?.revision || 0);
        if(!result.ok){error.textContent=result.error;error.hidden=false;return;}
        P.closeDialog();P.render();P.toast('Kundkortet är sparat.');
      });
      form.elements.name.focus();
    });
  }
  function bind() {
    document.querySelectorAll('[data-crm-new]').forEach(node=>node.onclick=()=>open());
    document.querySelectorAll('[data-crm-open]').forEach(node=>node.onclick=()=>open(node.dataset.crmOpen));
    const form=document.querySelector('#crm-filter-form');
    if(form)form.onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form));Object.assign(filter(),{query:values.query||'',segment:values.segment||'all',...(values.stage?{stage:values.stage}:{}),...(values.due?{due:values.due}:{})});P.render();};
    document.querySelector('[data-crm-clear]')?.addEventListener('click',()=>{Object.assign(filter(),{query:'',segment:'all',stage:'all',due:'all'});P.render();});
  }
  for(const [id,render] of [['crm',renderHome],['crm-customers',renderCustomers],['crm-pipeline',renderPipeline],['crm-activities',renderActivities]])P.register(id,{render:()=>allowed(activePartner())?render():empty('CRM är inte valt','Öppna en partner som använder portalen som CRM.'),bind});
  P.crm={enabled,rows,save,open,renderHome,bind};
})();
