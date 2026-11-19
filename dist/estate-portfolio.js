(() => {
  'use strict';
  const P = window.Portal, e = P.e;
  const seedBuildings = ['Exempelgatan 4', 'Parkvägen 8'];
  const seedUnits = [
    { id:'a1', building:0, number:'1001', initial:'vacant' },
    { id:'a2', building:0, number:'1002', initial:'tenant' },
    { id:'b1', building:1, number:'1101', initial:'viewing' }
  ];
  const norm = value => String(value || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
  const buildingKey = row => JSON.stringify([norm(row.address),norm(row.city),String(row.postcode||'').replace(/\s/g,'')]);
  const unitKey = row => JSON.stringify([buildingKey(row),norm(row.apartment)]);
  function registry() {
    return P.state.estateRegistry?.[P.partner] || {
      buildings: seedBuildings.map((address,i)=>({id:'building-'+i,address,city:'Lund',postcode:'222 22'})),
      units: seedUnits.map(u=>({...u,building:'building-'+u.building}))
    };
  }
  const units = () => registry().units;
  const buildings = () => registry().buildings;
  function classify(row, catalog = registry()) {
    if (!String(row.apartment||'').trim()) return {kind:'unlinked',label:'Lägenhetsnummer saknas – underlag utan koppling till beståndet'};
    const property = catalog.buildings.find(b=>buildingKey(b)===buildingKey(row));
    if (!property) {
      if(catalog.buildings.some(b=>norm(b.address)===norm(row.address)&&norm(b.city)===norm(row.city))) return {kind:'conflict',label:'Adressen finns med annat postnummer. Kontrollera innan registrering.'};
      return {kind:'property',label:'Ny fastighet och ny lägenhet'};
    }
    const unit=catalog.units.find(u=>u.building===property.id && norm(u.number)===norm(row.apartment));
    return unit?{kind:'existing',label:'Befintlig lägenhet',unit,property}:{kind:'unit',label:'Ny lägenhet i befintlig fastighet',property};
  }
  function prepareIntake(rows) {
    const catalog=JSON.parse(JSON.stringify(registry()));
    for(const row of rows){
      const match=classify(row,catalog);
      if(match.kind==='conflict')throw new Error(match.label);
      if(match.kind==='unlinked')continue;
      let property=match.property,unit=match.unit;
      if(!property){property={id:'building-'+P.newId(),address:row.address,city:row.city,postcode:row.postcode};catalog.buildings.push(property);}
      if(!unit){unit={id:'unit-'+P.newId(),building:property.id,number:row.apartment,initial:'unknown'};catalog.units.push(unit);}
      row.estateUnitId=unit.id;
    }
    return {...P.state.estateRegistry,[P.partner]:catalog};
  }
  const labels = { movein:'Inflyttning', moveout:'Utflyttning', viewing:'Visningsel' };
  const grid = 'Exempelnät AB';
  const address = u => buildings().find(b=>b.id===u.building)?.address + ', lgh ' + u.number;
  const enabled = id => P.state.estateFeatures?.[id] ?? (id === 'estate1');
  const canUse = () => P.prototypeUsers?.allowed('estate-portfolio') && P.role === 'partner';
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const events = u => P.state.estateEvents?.[P.partner]?.[u.id] || [];
  function persist(key,value) {
    const previous = P.state[key];
    P.state[key] = value;
    if (P.save()) return true;
    if (previous === undefined) delete P.state[key];
    else P.state[key] = previous;
    return false;
  }
  function toggle(id) {
    if (!P.prototypeUsers.admin() || P.role !== 'internal' || !P.getPartner(id)) return;
    if (persist('estateFeatures',{...P.state.estateFeatures,[id]:!enabled(id)})) P.render();
  }
  function setting(id) {
    const on = enabled(id);
    return '<p>Fastighetsfunktionen är <strong>'+(on?'aktiverad':'avaktiverad')+'</strong>. '+(P.prototypeUsers.admin()?'<button class="btn btn-secondary" data-estate-toggle="'+e(id)+'">'+(on?'Avaktivera':'Aktivera')+' fastighetsfunktionen</button>':'')+'</p>';
  }
  function status(u, until) {
    let state = u.initial, product = '';
    for (const row of events(u)) {
      if (until && row.date > until) break;
      state = row.type === 'movein' ? 'contract' : row.type === 'viewing' || row.viewing ? 'viewing' : 'vacant';
      product = row.trade?.product || '';
    }
    return {state, product};
  }
  function descriptions({state,product}) {
    if (state === 'contract') return ['Tecknat · '+grid,'Tecknat · Kraftringen '+product];
    const text = {vacant:'Ej tecknat',tenant:'Hyresgästens ansvar',viewing:'Visningsel · faktureras fastighetsägaren',unknown:'Avtalsunderlag saknas'}[state];
    return [text,text];
  }
  // Read-only contract facts. A real CRM transport is deliberately not connected.
  // Facts must be scoped to partner + unit and remain separate from service requests.
  function contractStatus(unit, kind, at=today()) {
    const fact=P.state.estateContractFacts?.[P.partner]?.[unit.id]?.[kind];
    if(!fact)return {label:descriptions(status(unit,at))[kind==='network'?0:1],source:'demo'};
    if(!fact.updatedAt || !fact.contractId)return {label:'Underlag saknas',source:'unknown'};
    const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'') && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0,10)===d;
    let label='Underlag saknas';
    if(validDate(fact.endsOn))label=at>fact.endsOn?'Avslutat '+fact.endsOn:'Uppsagt · gäller till '+fact.endsOn;
    else if(fact.status==='active')label='Aktivt avtal';
    return {label,source:'crm',updatedAt:fact.updatedAt,contractId:fact.contractId};
  }
  function receipt(row,u) {
    return ['Orderbekräftelse för '+row.name,
      row.landlord+' har med stöd av din giltiga fullmakt ('+row.authority+') tecknat elhandelsavtalet '+row.trade.product+' hos Kraftringen åt dig för '+e(address(u))+'.',
      'Elnätsavtal har också skapats hos '+row.network.provider+'. Anmält startdatum för båda avtalen är '+row.date+'. Slutligt leveransdatum bekräftas separat.',
      'Pris och villkor: '+row.trade.terms,
      'Ångerrätt för elhandelsavtalet: Vid distansavtal har du som konsument 14 dagars ångerrätt. Fristen börjar tidigast när du har fått fullständig information om ångerrätten. För att ångra dig, meddela Kraftringen och ange ditt namn och avtalsnummer '+row.trade.id+'.'];
  }
  function register(u, type, form) {
    if (!canUse() || !Object.hasOwn(labels,type)) return;
    const data = new FormData(form), date = data.get('date'), history = events(u), last = history.at(-1);
    const occupied = ['tenant','contract'].includes(status(u).state);
    if (!date || date < today() || (last && date < last.date)) return 'Välj dagens datum eller senare, tidigast datumet för den senaste planerade ändringen.';
    if (type === 'moveout' ? !occupied : type === 'movein' && occupied) return 'Kontrollera planerade händelser. Lägenheten måste vara uthyrd vid utflyttning och ledig vid inflyttning.';
    if (type === 'viewing' && status(u).state === 'viewing') return 'Visningsel är redan registrerad för perioden.';
    const row = {id:P.newId(),type,date,created:new Date().toISOString(),actor:P.prototypeUsers.current().name,viewing:data.has('viewing')};
    if (type === 'viewing' || row.viewing) Object.assign(row,{viewing:true,landlord:P.getPartner().name,previousState:status(u).state,billing:{trade:P.partner,network:P.partner,from:date},supplyAction:'keep-connected'});
    if (type === 'movein') {
      const name = String(data.get('name')||'').trim(), email = String(data.get('email')||'').trim(), authority = String(data.get('authority')||'').trim(), product = data.get('product');
      if (!name || !authority || !data.has('valid') || !/^[^@\s]+@[^@\s]+\.example$/i.test(email) || !P.propertyDefaults.choices.includes(product)) return 'Ange fiktiv hyresgäst, en .example-adress, avtalsval och referens till en giltig testfullmakt.';
      Object.assign(row,{name,email,authority,landlord:P.getPartner().name,trade:{id:'EL-'+row.id,product,terms:String(data.get('terms') || '').trim() || 'Prisunderlag saknas i detta exempel.'},network:{id:'NÄT-'+row.id,provider:grid}});
      row.confirmation = {delivery:'pending',to:email,at:row.created,lines:receipt(row,u)};
    }
    const all = P.state.estateEvents || {};
    if (!persist('estateEvents',{...all,[P.partner]:{...all[P.partner],[u.id]:[...history,row]}})) return 'Kunde inte spara. Kontrollera portalens sparbesked och försök igen.';
    if (row.confirmation) void sendConfirmation(P.partner,u.id,row.id);
    P.render();
    P.toast(type==='movein'?'Två demoavtal skapade. Orderbekräftelsen finns på ärendet.':'Ändringen har registrerats.');
  }
  const sending = new Set();
  async function sendConfirmation(partner, unit, id) {
    const history = () => P.state.estateEvents?.[partner]?.[unit] || [];
    const row = history().find(entry => entry.id === id);
    if (!canUse() || P.partner !== partner || !row?.confirmation || row.confirmation.delivery === 'accepted' || sending.has(id)) return;
    sending.add(id);
    try {
      const response = await fetch('/api/order-mail',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind:'estate-confirmation',attemptId:id,createdAt:row.created,lines:row.confirmation.lines})});
      const result = await response.json();
      if (!response.ok || !result.accepted) throw new Error(result.error || 'Mejltjänsten har inte kvitterat utskicket.');
      if (!history().some(entry => entry.id === id)) return;
      const updated = history().map(entry => entry.id !== id ? entry : {...entry,confirmation:{...entry.confirmation,delivery:'accepted',recipient:result.recipient}});
      const all = P.state.estateEvents;
      if (!persist('estateEvents',{...all,[partner]:{...all[partner],[unit]:updated}})) throw new Error('Mejlet accepterades men kvittensen kunde inte sparas.');
    } catch (error) {
      if (P.partner === partner) P.toast(error.message);
    } finally {
      sending.delete(id);
      if (canUse() && P.partner === partner && P.page === 'estate-portfolio') P.render();
    }
  }
  function delivery(row) {
    if (row.confirmation.delivery === 'accepted') return '<p>Testmejl accepterat av mejltjänsten för '+e(row.confirmation.recipient)+'.</p>';
    if (sending.has(row.id)) return '<p role="status">Skickar bekräftelsen till labbets testmottagare…</p>';
    if (Date.now()-Date.parse(row.created)>22*3600000) return '<p>Utskicket saknar kvittens. Kontrollera utskicksloggen.</p>';
    return '<p>Utskicket saknar kvittens. <button type="button" class="text-button" data-estate-retry="'+e(row.id)+'">Försök skicka testmejlet igen</button></p>';
  }
  let selection = null;
  const pending = () => units().flatMap(unit => events(unit).map(row => ({unit,row})));
  const rentalCases = () => P.getPartner()?.type==='property' ? P.moveinService?.rows(P.partner) || [] : [];
  const sectionTabs = () => '<nav class="hub-tabs" aria-label="Fastighetstjänsten">'+[['estate-home','Översikt'],['estate-portfolio','Fastighetsbestånd'],['estate-cases','Ärenden']].map(([id,label]) =>
    '<button type="button" data-go="'+id+'" aria-current="'+(P.page===id?'page':'false')+'">'+label+'</button>').join('')+'</nav>';
  function shortcuts() {
    return '<div class="hub-actions"><button class="btn btn-primary" data-go="estate-register">Registrera inflyttning</button>'+
      (P.getPartner()?.type==='property'?'<button class="btn btn-secondary" data-go="property-import">Importera inflyttningar</button>':'')+'</div>';
  }
  function estateHome() {
    return overview();
  }
  function cases() {
    const changes=pending().sort((a,b)=>b.row.created.localeCompare(a.row.created)).map(({unit,row})=>{
      const waiting=row.confirmation && row.confirmation.delivery!=='accepted';
      return '<li data-case-status="'+(waiting?'waiting':'registered')+'"><button class="text-button" data-estate-jump="'+unit.id+'" data-event="'+e(row.id)+'">'+e(address(unit))+' · '+labels[row.type]+'</button><span>'+e(row.date)+' · '+(waiting?'Väntar på bekräftelse':'Registrerad')+'</span></li>';
    });
    const old=rentalCases().map(row=>'<li data-case-status="'+(row.handoverStatus==='needs_info'?'missing':'service')+'"><button class="text-button" data-service-case="'+e(row.id)+'">'+e(row.address)+' · '+e(row.name)+'</button><span>Serviceunderlag · '+e(P.moveinService.statusLabel(row))+'</span></li>');
    return '<div class="commercial-page"><h1>Ärenden</h1>'+sectionTabs()+'<section class="card hub-panel"><label class="field">Visa ärenden<select data-case-filter><option value="">Alla</option><option value="waiting">Väntar på bekräftelse</option><option value="missing">Behöver kompletteras</option><option value="service">Övriga serviceunderlag</option><option value="registered">Registrerade förändringar</option></select></label><ul class="hub-list">'+[...changes,...old].join('')+'</ul><p data-case-empty '+(changes.length+old.length?'hidden':'')+'>Inga ärenden i urvalet.</p></section></div>';
  }
  function chooseUnit() {
    const available=units().filter(u=>!['tenant','contract'].includes(status(u).state));
    return '<div class="commercial-page"><h1>Registrera inflyttning</h1>'+sectionTabs()+'<section class="card hub-panel"><h2>Välj lägenhet</h2>'+ (available.map(u=>'<p><button class="text-button" data-estate-jump="'+u.id+'">'+e(address(u))+'</button></p>').join('')||'<p>Ingen ledig lägenhet i beståndet.</p>')+'</section></div>';
  }
  function bindLinks() {
    document.querySelectorAll('[data-estate-jump]').forEach(b=>b.onclick=()=>{
      selection={partner:P.partner,unit:b.dataset.estateJump};
      P.go('estate-portfolio');
      if(b.dataset.event) {
        const entry=document.getElementById('estate-event-'+b.dataset.event);
        entry?.querySelector('details')?.setAttribute('open','');
        entry?.focus();
      }
    });
    document.querySelectorAll('[data-service-case]').forEach(b=>b.onclick=()=>P.moveinService.open(b.dataset.serviceCase));
    const select=document.querySelector('[data-case-filter]');
    if(select)select.onchange=()=>{
      const rows=[...document.querySelectorAll('[data-case-status]')];
      rows.forEach(row=>row.hidden=!!select.value && row.dataset.caseStatus!==select.value);
      document.querySelector('[data-case-empty]').hidden=rows.some(row=>!row.hidden);
    };
  }
  for (const [page,render] of [['estate-home',estateHome],['estate-cases',cases],['estate-register',chooseUnit]]) {
    P.register(page,{render:()=>canUse()?render():'',bind:()=>{bindLinks();bindPortfolio();}});
  }
  function overview() {
    const catalog=registry();
    return '<div class="commercial-page estate-workspace"><h1>Mina fastigheter</h1><p>Välj lägenhet för att anmäla inflyttning eller starta visningsel.</p><div class="estate-toolbar"><label class="field">Sök fastighet eller lägenhet<input type="search" data-unit-search placeholder="Adress eller lägenhetsnummer"></label><button class="btn btn-secondary" data-go="estate-cases">Visa ärenden</button></div><p data-unit-empty hidden>Ingen lägenhet matchar sökningen.</p>'+catalog.buildings.map(b=>'<details class="card estate-building" data-building="'+e(b.id)+'"><summary><strong>'+e(b.address)+'</strong><span>'+e(b.city)+' · '+catalog.units.filter(u=>u.building===b.id).length+' lägenheter</span></summary><div class="estate-units">'+catalog.units.filter(u=>u.building===b.id).map(u=>{
      const network=contractStatus(u,'network').label,trade=contractStatus(u,'trade').label,next=events(u).find(v=>v.date>today());
      const cases=rentalCases().filter(r=>r.estateUnitId===u.id);
      return '<article class="estate-unit" data-unit-address="'+e(address(u)+' '+b.city)+'"><div><button class="text-button" data-estate-unit="'+e(u.id)+'">Lägenhet '+e(u.number)+'</button><p>Elnät: '+e(network)+'<br>Elhandel: '+e(trade)+'</p>'+(next?'<p>Planerat: '+e(labels[next.type])+' '+e(next.date)+'</p>':'')+cases.map(r=>'<p><button class="text-button" data-service-case="'+e(r.id)+'">Inflyttning '+e(r.moveDate)+' · '+e(P.moveinService.statusLabel(r))+'</button></p>').join('')+'</div><div class="estate-actions"><button class="btn btn-primary" data-estate-movein="'+e(u.id)+'">Anmäl inflyttning</button><button class="btn btn-secondary" data-estate-viewing="'+e(u.id)+'">Starta visningsel</button></div></article>';
    }).join('')+'</div></details>').join('')+'<div class="estate-reserve"><span>Saknas bostaden, eller vill du registrera flera?</span><button class="text-button" data-go="property-manual">Registrera manuellt</button><button class="text-button" data-go="property-import">Importera Excel</button></div><p class="muted">Fiktivt bestånd. Avtalsstatus från CRM är ännu inte ansluten.</p></div>';
  }
  function detail(u) {
    const network=contractStatus(u,'network').label,trade=contractStatus(u,'trade').label;
    const history=events(u);
    return '<div class="commercial-page"><button class="text-button" data-estate-back>← Fastighetsbestånd</button><h1>'+e(address(u))+'</h1>'+sectionTabs()+'<section class="card"><h2>Avtal idag</h2><p>Elnät: '+e(network)+'</p><p>Elhandel: '+e(trade)+'</p></section><section class="card"><h2>Registrera ändring</h2><form id="estate-change"><label class="field">Åtgärd<select name="type">'+Object.entries(labels).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+'</select></label><label class="field">Anmält start- eller slutdatum<input required type="date" name="date" min="'+today()+'"></label><fieldset data-in><legend>Hyresgäst och fullmakt</legend><label class="field">Hyresgästens namn<input required name="name" maxlength="100"></label><label class="field">Hyresgästens testadress<input required type="email" name="email" placeholder="hyresgast@kund.example"></label><label class="field">Elhandelsavtal<select name="product">'+P.propertyDefaults.choices.map(v=>'<option '+(v===P.propertyDefaults.get()?'selected':'')+'>'+e(v)+'</option>').join('')+'</select></label><label class="field">Pris och avtalsvillkor enligt underlaget<input name="terms" maxlength="400" placeholder="Ange prisreferens eller exempelvillkor"></label><p>Nätägare: '+grid+'</p><label class="field">Fullmaktsreferens<input required name="authority" maxlength="120" placeholder="Exempelvis hyresavtalets referens"></label><label><input required type="checkbox" name="valid"> Jag har kontrollerat att testfullmakten omfattar både elhandel och elnät.</label></fieldset><fieldset data-out><legend>Efter utflyttning</legend><label><input type="checkbox" name="viewing"> Aktivera visningsel på fastighetsägarens bekostnad</label></fieldset><p data-viewing-info hidden>Elhandel och elnät följs separat. Hyresgästens slutdatum ska bekräftas från avtalsunderlaget. Från valt datum står fastighetsägaren för både elnät och elhandel. Elen ska vara fortsatt inkopplad. Detta registrerar en lokal beställning, inte en bekräftelse från nätägaren.</p><p class="ow-notice">Två lokala demoavtal skapas vid inflyttning. Orderbekräftelsen mejlas till labbets fasta testmottagare.</p><button class="btn btn-primary" type="submit">Registrera ändring</button><p role="alert"></p></form></section><section class="card"><h2>Planerade ändringar och historik</h2>'+([...history].reverse().map(v=>'<article tabindex="-1" id="estate-event-'+e(v.id)+'"><h3>'+labels[v.type]+' · '+e(v.date)+'</h3><p>'+(v.date>today()?'Planerad':'Gäller från angivet datum')+' · registrerad av '+e(v.actor)+(v.viewing?' · Visningsel: '+e(v.landlord||P.getPartner().name)+' betalar elnät och elhandel. Fortsatt inkopplad.':'')+'</p>'+(v.confirmation?'<p>Elhandel: '+e(v.trade.product)+' · '+e(v.trade.id)+'<br>Elnät: '+e(v.network.provider)+' · '+e(v.network.id)+'</p><details><summary>Visa hyresgästens orderbekräftelse</summary><p>Till '+e(v.confirmation.to)+' · '+e(new Date(v.confirmation.at).toLocaleString("sv-SE"))+'</p>'+v.confirmation.lines.map(s=>'<p>'+e(s)+'</p>').join('')+'</details>'+delivery(v):'')+'</article>').join('')||'<p>Inga ändringar registrerade.</p>')+'</section></div>';
  }
  P.estatePortfolio = {contractStatus,overview,bind:bindPortfolio,registry,classify,prepareIntake,unitKey,enabled,toggle,setting,shortcuts,attention:()=>pending().filter(({row})=>row.confirmation && row.confirmation.delivery!=='accepted').length+rentalCases().filter(row=>row.handoverStatus==='needs_info').length};
  P.register('estate-portfolio',{
    render:()=>{if(!canUse())return '';const u=selection?.partner===P.partner && units().find(u=>u.id===selection.unit);return u?detail(u):overview();},
    bind:bindPortfolio
  });
  function bindPortfolio(){
      bindLinks();
      document.querySelectorAll('[data-estate-movein]').forEach(b=>b.onclick=()=>{const u=units().find(u=>u.id===b.dataset.estateMovein),property=buildings().find(b=>b.id===u.building);P.propertyIntake.openForUnit({...property,apartment:u.number});});
      document.querySelectorAll('[data-estate-viewing]').forEach(b=>b.onclick=()=>{selection={partner:P.partner,unit:b.dataset.estateViewing};P.go('estate-portfolio');const form=document.querySelector('#estate-change');form.elements.type.value='viewing';form.elements.type.onchange();form.elements.date.focus();});
      const search=document.querySelector('[data-unit-search]');
      if(search)search.oninput=()=>{
        const rows=[...document.querySelectorAll('[data-unit-address]')];
        rows.forEach(row=>row.hidden=!row.dataset.unitAddress.toLowerCase().includes(search.value.trim().toLowerCase()));
        document.querySelector('[data-unit-empty]').hidden=rows.some(row=>!row.hidden);
        document.querySelectorAll('[data-building]').forEach(b=>{b.hidden=![...b.querySelectorAll('[data-unit-address]')].some(r=>!r.hidden);if(search.value.trim())b.open=!b.hidden;});
      };
      document.querySelectorAll('[data-go="estate-portfolio"]').forEach(b=>b.addEventListener('click',()=>{selection=null;}));
      document.querySelectorAll('[data-estate-unit]').forEach(b=>b.onclick=()=>{selection={partner:P.partner,unit:b.dataset.estateUnit};P.go('estate-portfolio');});
      const back=document.querySelector('[data-estate-back]');
      if(back)back.onclick=()=>{selection=null;P.render();};
      const form=document.querySelector('#estate-change');
      if(!form)return;
      document.querySelectorAll('[data-estate-retry]').forEach(button=>button.onclick=()=>sendConfirmation(P.partner,selection.unit,button.dataset.estateRetry));
      const type=form.elements.type;
      const update=()=>{form.querySelector('[data-viewing-info]').hidden=type.value!=='viewing';for(const [selector,show] of [['[data-in]',type.value==='movein'],['[data-out]',type.value==='moveout']]){const group=form.querySelector(selector);group.hidden=group.disabled=!show;}};
      type.onchange=update;update();
      form.onsubmit=event=>{event.preventDefault();if(!form.reportValidity())return;const error=register(units().find(u=>u.id===selection.unit),type.value,form);if(error)form.querySelector('[role=alert]').textContent=error;};
    }
})();
