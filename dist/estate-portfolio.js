(() => {
  'use strict';
  const P = window.Portal, e = P.e;
  const buildings = ['Exempelgatan 4', 'Parkvägen 8'];
  const units = [
    { id:'a1', building:0, number:'1001', initial:'vacant' },
    { id:'a2', building:0, number:'1002', initial:'tenant' },
    { id:'b1', building:1, number:'1101', initial:'viewing' }
  ];
  const labels = { movein:'Inflyttning', moveout:'Utflyttning', viewing:'Visningsel' };
  const grid = 'Exempelnät AB';
  const address = u => buildings[u.building] + ', lgh ' + u.number;
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
    const text = {vacant:'Ej tecknat',tenant:'Hyresgästens ansvar',viewing:'Visningsel · faktureras fastighetsägaren'}[state];
    return [text,text];
  }
  function receipt(row,u) {
    return ['Orderbekräftelse för '+row.name,
      row.landlord+' har med stöd av din giltiga fullmakt ('+row.authority+') tecknat elhandelsavtalet '+row.trade.product+' hos Kraftringen åt dig för '+address(u)+'.',
      'Elnätsavtal har också skapats hos '+row.network.provider+'. Anmält startdatum för båda avtalen är '+row.date+'. Slutligt leveransdatum bekräftas separat.',
      'Pris och villkor: '+row.trade.terms,
      'Ångerrätt för elhandelsavtalet: Vid distansavtal har du som konsument 14 dagars ångerrätt. Fristen börjar tidigast när du har fått fullständig information om ångerrätten. För att ångra dig, meddela Kraftringen och ange ditt namn och avtalsnummer '+row.trade.id+'.'];
  }
  function register(u, type, form) {
    if (!canUse() || !Object.hasOwn(labels,type)) return;
    const data = new FormData(form), date = data.get('date'), history = events(u), last = history.at(-1);
    const occupied = ['tenant','contract'].includes(status(u).state);
    if (!date || date < today() || (last && date < last.date)) return 'Välj dagens datum eller senare, tidigast datumet för den senaste planerade ändringen.';
    if (type === 'moveout' ? !occupied : occupied) return 'Kontrollera planerade händelser. Lägenheten måste vara uthyrd vid utflyttning och ledig vid inflyttning eller start av visningsel.';
    if (type === 'viewing' && status(u).state === 'viewing') return 'Visningsel är redan registrerad för perioden.';
    const row = {id:P.newId(),type,date,created:new Date().toISOString(),actor:P.prototypeUsers.current().name,viewing:data.has('viewing')};
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
  const pending = () => units.flatMap(unit => events(unit).map(row => ({unit,row})));
  const rentalCases = () => P.getPartner()?.type==='property' ? P.moveinService?.rows(P.partner) || [] : [];
  const sectionTabs = () => '<nav class="hub-tabs" aria-label="Fastighetstjänsten">'+[['estate-home','Översikt'],['estate-portfolio','Fastighetsbestånd'],['estate-cases','Ärenden']].map(([id,label]) =>
    '<button type="button" data-go="'+id+'" aria-current="'+(P.page===id?'page':'false')+'">'+label+'</button>').join('')+'</nav>';
  function shortcuts() {
    return '<div class="hub-actions"><button class="btn btn-primary" data-go="estate-register">Registrera inflyttning</button>'+
      (P.getPartner()?.type==='property'?'<button class="btn btn-secondary" data-go="property-import">Importera inflyttningar</button>':'')+'</div>';
  }
  function estateHome() {
    const upcoming=pending().filter(({row})=>row.date>today()).sort((a,b)=>a.row.date.localeCompare(b.row.date));
    const follow=pending().filter(({row})=>row.confirmation && row.confirmation.delivery!=='accepted').length;
    const supplement=rentalCases().filter(row=>row.handoverStatus==='needs_info').length;
    return '<div class="commercial-page"><h1>Fastigheter</h1>'+sectionTabs()+shortcuts()+
      '<section class="card hub-panel"><h2>Att följa upp</h2><p>'+follow+' orderbekräftelser utan kvittens · '+supplement+' underlag att komplettera</p><button class="text-button" data-go="estate-cases">Visa ärenden</button></section>'+
      '<section class="card hub-panel"><h2>Kommande förändringar</h2>'+ (upcoming.map(({unit,row})=>'<p><button class="text-button" data-estate-jump="'+unit.id+'">'+address(unit)+'</button> · '+labels[row.type]+' · '+e(row.date)+'</p>').join('')||'<p>Inga planerade förändringar.</p>')+
      '<p>Visningsel idag: '+units.filter(u=>status(u,today()).state==='viewing').map(address).join(', ')+'</p></section>'+
      (P.getPartner()?.type==='property'?'<details class="card hub-panel"><summary>Inställningar för fastighetstjänsten</summary><p>Grundval för nya inflyttningar: '+e(P.propertyDefaults.get())+'</p><button class="text-button" data-go="property-default">Ändra avtalsval</button></details>':'')+'</div>';
  }
  function cases() {
    const changes=pending().sort((a,b)=>b.row.created.localeCompare(a.row.created)).map(({unit,row})=>{
      const waiting=row.confirmation && row.confirmation.delivery!=='accepted';
      return '<li data-case-status="'+(waiting?'waiting':'registered')+'"><button class="text-button" data-estate-jump="'+unit.id+'" data-event="'+e(row.id)+'">'+address(unit)+' · '+labels[row.type]+'</button><span>'+e(row.date)+' · '+(waiting?'Väntar på bekräftelse':'Registrerad')+'</span></li>';
    });
    const old=rentalCases().map(row=>'<li data-case-status="'+(row.handoverStatus==='needs_info'?'missing':'service')+'"><button class="text-button" data-service-case="'+e(row.id)+'">'+e(row.address)+' · '+e(row.name)+'</button><span>Serviceunderlag · '+e(P.moveinService.statusLabel(row))+'</span></li>');
    return '<div class="commercial-page"><h1>Ärenden</h1>'+sectionTabs()+'<section class="card hub-panel"><label class="field">Visa ärenden<select data-case-filter><option value="">Alla</option><option value="waiting">Väntar på bekräftelse</option><option value="missing">Behöver kompletteras</option><option value="service">Övriga serviceunderlag</option><option value="registered">Registrerade förändringar</option></select></label><ul class="hub-list">'+[...changes,...old].join('')+'</ul><p data-case-empty '+(changes.length+old.length?'hidden':'')+'>Inga ärenden i urvalet.</p></section></div>';
  }
  function chooseUnit() {
    const available=units.filter(u=>!['tenant','contract'].includes(status(u).state));
    return '<div class="commercial-page"><h1>Registrera inflyttning</h1>'+sectionTabs()+'<section class="card hub-panel"><h2>Välj lägenhet</h2>'+ (available.map(u=>'<p><button class="text-button" data-estate-jump="'+u.id+'">'+address(u)+'</button></p>').join('')||'<p>Ingen ledig lägenhet i beståndet.</p>')+'</section></div>';
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
    P.register(page,{render:()=>canUse()?render():'',bind:bindLinks});
  }
  function overview() {
    return '<div class="commercial-page"><h1>Fastighetsbestånd</h1>'+sectionTabs()+'<label class="field">Sök adress eller lägenhetsnummer<input type="search" data-unit-search></label><p data-unit-empty hidden>Ingen lägenhet matchar sökningen.</p><p>'+e(P.getPartner().name)+' · Fiktiva hyresobjekt</p>'+buildings.map((b,i)=>'<section class="card"><h2>'+b+'</h2><div class="table-wrap"><table><thead><tr><th>Lägenhet</th><th>Elnät idag</th><th>Elhandel idag</th><th>Nästa planerade ändring</th></tr></thead><tbody>'+units.filter(u=>u.building===i).map(u=>{
      const [network,trade]=descriptions(status(u,today())), next=events(u).find(v=>v.date>today());
      return '<tr data-unit-address="'+address(u)+'"><td><button class="text-button" data-estate-unit="'+u.id+'">'+u.number+'</button></td><td>'+e(network)+'</td><td>'+e(trade)+'</td><td>'+(next?({movein:'Inkoppling · inflyttning',moveout:'Urkoppling · utflyttning',viewing:'Inkoppling · visningsel'}[next.type])+' · '+e(next.date):'—')+'</td></tr>';
    }).join('')+'</tbody></table></div></section>').join('')+'</div>';
  }
  function detail(u) {
    const [network,trade]=descriptions(status(u,today()));
    const history=events(u);
    return '<div class="commercial-page"><button class="text-button" data-estate-back>← Fastighetsbestånd</button><h1>'+address(u)+'</h1>'+sectionTabs()+'<section class="card"><h2>Avtal idag</h2><p>Elnät: '+e(network)+'</p><p>Elhandel: '+e(trade)+'</p></section><section class="card"><h2>Registrera ändring</h2><form id="estate-change"><label class="field">Åtgärd<select name="type">'+Object.entries(labels).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+'</select></label><label class="field">Anmält start- eller slutdatum<input required type="date" name="date" min="'+today()+'"></label><fieldset data-in><legend>Hyresgäst och fullmakt</legend><label class="field">Hyresgästens namn<input required name="name" maxlength="100"></label><label class="field">Hyresgästens testadress<input required type="email" name="email" placeholder="hyresgast@kund.example"></label><label class="field">Elhandelsavtal<select name="product">'+P.propertyDefaults.choices.map(v=>'<option '+(v===P.propertyDefaults.get()?'selected':'')+'>'+e(v)+'</option>').join('')+'</select></label><label class="field">Pris och avtalsvillkor enligt underlaget<input name="terms" maxlength="400" placeholder="Ange prisreferens eller exempelvillkor"></label><p>Nätägare: '+grid+'</p><label class="field">Fullmaktsreferens<input required name="authority" maxlength="120" placeholder="Exempelvis hyresavtalets referens"></label><label><input required type="checkbox" name="valid"> Jag har kontrollerat att testfullmakten omfattar både elhandel och elnät.</label></fieldset><fieldset data-out><legend>Efter utflyttning</legend><label><input type="checkbox" name="viewing"> Aktivera visningsel på fastighetsägarens bekostnad</label></fieldset><p class="ow-notice">Två lokala demoavtal skapas vid inflyttning. Orderbekräftelsen mejlas till labbets fasta testmottagare.</p><button class="btn btn-primary" type="submit">Registrera ändring</button><p role="alert"></p></form></section><section class="card"><h2>Planerade ändringar och historik</h2>'+([...history].reverse().map(v=>'<article tabindex="-1" id="estate-event-'+e(v.id)+'"><h3>'+labels[v.type]+' · '+e(v.date)+'</h3><p>'+(v.date>today()?'Planerad':'Gäller från angivet datum')+' · registrerad av '+e(v.actor)+(v.viewing?' · med visningsel':'')+'</p>'+(v.confirmation?'<p>Elhandel: '+e(v.trade.product)+' · '+e(v.trade.id)+'<br>Elnät: '+e(v.network.provider)+' · '+e(v.network.id)+'</p><details><summary>Visa hyresgästens orderbekräftelse</summary><p>Till '+e(v.confirmation.to)+' · '+e(new Date(v.confirmation.at).toLocaleString("sv-SE"))+'</p>'+v.confirmation.lines.map(s=>'<p>'+e(s)+'</p>').join('')+'</details>'+delivery(v):'')+'</article>').join('')||'<p>Inga ändringar registrerade.</p>')+'</section></div>';
  }
  P.estatePortfolio = {enabled,toggle,setting,shortcuts,attention:()=>pending().filter(({row})=>row.confirmation && row.confirmation.delivery!=='accepted').length+rentalCases().filter(row=>row.handoverStatus==='needs_info').length};
  P.register('estate-portfolio',{
    render:()=>{if(!canUse())return '';const u=selection?.partner===P.partner && units.find(u=>u.id===selection.unit);return u?detail(u):overview();},
    bind:()=>{
      const search=document.querySelector('[data-unit-search]');
      if(search)search.oninput=()=>{
        const rows=[...document.querySelectorAll('[data-unit-address]')];
        rows.forEach(row=>row.hidden=!row.dataset.unitAddress.toLowerCase().includes(search.value.trim().toLowerCase()));
        document.querySelector('[data-unit-empty]').hidden=rows.some(row=>!row.hidden);
      };
      document.querySelectorAll('[data-go="estate-portfolio"]').forEach(b=>b.addEventListener('click',()=>{selection=null;}));
      document.querySelectorAll('[data-estate-unit]').forEach(b=>b.onclick=()=>{selection={partner:P.partner,unit:b.dataset.estateUnit};P.render();});
      const back=document.querySelector('[data-estate-back]');
      if(back)back.onclick=()=>{selection=null;P.render();};
      const form=document.querySelector('#estate-change');
      if(!form)return;
      document.querySelectorAll('[data-estate-retry]').forEach(button=>button.onclick=()=>sendConfirmation(P.partner,selection.unit,button.dataset.estateRetry));
      const type=form.elements.type;
      const update=()=>{for(const [selector,show] of [['[data-in]',type.value==='movein'],['[data-out]',type.value==='moveout']]){const group=form.querySelector(selector);group.hidden=group.disabled=!show;}};
      type.onchange=update;update();
      form.onsubmit=event=>{event.preventDefault();if(!form.reportValidity())return;const error=register(units.find(u=>u.id===selection.unit),type.value,form);if(error)form.querySelector('[role=alert]').textContent=error;};
    }
  });
})();
