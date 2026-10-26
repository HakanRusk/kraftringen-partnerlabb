(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const statuses = {draft:'Utkast',registered:'Registrerad',approved:'Godkänd',rejected:'Ej godkänd',withdrawn:'Ångrad',confirmed:'Bekräftad',awaiting_start:'Väntar på avtalsstart',lost_before_start:'Bortfall före start',active:'Aktivt avtal',lost_after_start:'Bortfall efter start'};
  const products = {
    consumer:['Rörligt månadspris','Rörligt kvartspris','Kraftringen Opti'],
    business:['Rörligt månadspris','Rörligt kvartspris','Individuell indexportfölj','Kraftringen Stabil','Kraftringen Direkt','Poolportfölj – offensiv','Poolportfölj – trygg']
  };
  const profiled = new Set(['Individuell indexportfölj','Kraftringen Stabil','Kraftringen Direkt']);
  const months = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const uid = prefix => prefix + '-' + crypto.randomUUID();
  const clean = value => String(value ?? '').trim();
  const dateOK = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const num = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  const fmt = value => new Intl.NumberFormat('sv-SE',{maximumFractionDigits:2}).format(value);
  const money = value => fmt(value) + ' kr';
  const date = value => dateOK(value) ? new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value)) : '—';
  const sales = id => ['sales','field'].includes(P.getPartner(id)?.type);
  const inScope = id => P.role === 'partner' && sales(P.partner) && id === P.partner;
  // Default to orders for ordinary partner links; only an explicit rollback opts out.
  let enabled = new URLSearchParams(location.search).get('proposal') !== 'legacy';
  try { if (!new URLSearchParams(location.search).has('proposal')) enabled = localStorage.getItem('partnerlabb.orders.enabled') !== 'false'; } catch {}
  const filters = new Map();
  function filter() { if (!filters.has(P.partner)) filters.set(P.partner,{mode:'month',year:today().slice(0,4),month:today().slice(5,7),week:isoWeek(today()).slice(6),status:'all',query:''}); return filters.get(P.partner); }
  function isoWeek(day) { const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7)); const year=d.getUTCFullYear(); const start=new Date(Date.UTC(year,0,1)); return `${year}-W${String(Math.ceil((((d-start)/86400000)+1)/7)).padStart(2,'0')}`; }
  function matchPeriod(row, f) { const d=row.registeredAt || row.createdAt; if(!dateOK(d))return false; if(f.mode==='week')return isoWeek(d)===`${f.year}-W${f.week}`; return d.startsWith(f.year+(f.mode==='month'?'-'+f.month:'')); }
  function fixture() {
    const customers=[],orders=[];
    for (const partner of ['vast','syd']) {
      const category=partner==='vast'?'consumer':'business';
      for(let i=0;i<20;i++) {
        const customerId=`order-demo-${partner}-customer-${i}`;
        customers.push({id:customerId,partner,name:category==='consumer'?`Exempelperson ${i+1}`:`Exempelföretag ${i+1} AB`,type:category==='consumer'?'private':'company',identifier:'',postalAddress:'Exempelgatan 1, 222 22 Exempelstad',visitAddress:'Exempelgatan 1, Exempelstad',email:`kund${i+1}@kund.example`,phone:'',createdAt:'2026-10-01'});
        const status=Object.keys(statuses)[i%10], registeredAt=status==='draft'?'':`2026-${i<10?'10':'09'}-${String(5+i).padStart(2,'0')}`;
        orders.push({id:`order-demo-${partner}-${i+1}`,partner,customerId,category,product:products[category][i%2],status,approvedAt:['approved','confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(status)?registeredAt:'',confirmedAt:['confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(status)?registeredAt:'',createdAt:registeredAt||'2026-10-05',registeredAt,startDate:['active','lost_after_start'].includes(status)?registeredAt:'2026-12-01',termMonths:category==='business'?'12':'',facilities:[{installationId:'735999999999999999',annualKwh:category==='consumer'?'8000':'120000',area:'SE4',network:category==='business'?'DEM':'',profile:Array(12).fill('')}],events:[{at:'2026-10-01T09:00:00Z',text:'Fiktivt exempel för det nya orderförslaget.'}]});
      }
    }
    return {version:1,customers,orders};
  }
  const seed=fixture();
  function data() { return P.state.orderWorkspace === undefined ? seed : P.state.orderWorkspace; }
  function healthy() { const d=data();return d&&d.version===1&&Array.isArray(d.customers)&&Array.isArray(d.orders); }
  const customers = () => healthy()?data().customers.filter(r=>r&&inScope(r.partner)):[];
  const orders = () => healthy()?data().orders.filter(r=>r&&inScope(r.partner)&&statuses[r.status]):[];
  function mutate(run) {
    if(!healthy())return {ok:false,message:'Det sparade orderunderlaget kan inte läsas. Inga data har skrivits över.'};
    const previous=P.state.orderWorkspace;
    const next=JSON.parse(JSON.stringify(data()));
    const result=run(next);
    if(!result.ok)return result;
    P.state.orderWorkspace=next;
    if(!P.save()){if(previous===undefined)delete P.state.orderWorkspace;else P.state.orderWorkspace=previous;return {ok:false,message:'Ändringen kunde inte sparas. Tidigare uppgifter är kvar. Kopiera inmatningen innan omladdning.'};}
    return result;
  }
  function saveCustomer(input,id) {
    if(!inScope(P.partner))return {ok:false,message:'Välj en säljpartners demovy.'};
    const row={};for(const field of ['name','type','identifier','postalAddress','visitAddress','email','phone'])row[field]=clean(input[field]);
    if(!row.name || !['company','sole','private'].includes(row.type))return {ok:false,message:'Ange kundens namn och kundtyp.'};
    if(row.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))return {ok:false,message:'Kontrollera e-postadressen.'};
    if(row.identifier && !(row.type==='company'?/^\d{6}-?\d{4}$/:/^(?:\d{8}|\d{6})[-+]?\d{4}$/).test(row.identifier))return {ok:false,message:'Kontrollera formatet på organisations-/personnumret (10 eller 12 siffror för personnummer).'};
    return mutate(d=>{const old=id?d.customers.find(r=>r.id===id&&inScope(r.partner)):null;if(id&&!old)return {ok:false,message:'Kunden finns inte i denna partnerdomän.'};const value={...old,...row,id:old?.id||uid('kund'),partner:P.partner,createdAt:old?.createdAt||today()};if(old)d.customers[d.customers.indexOf(old)]=value;else d.customers.push(value);return {ok:true,id:value.id};});
  }
  function saveOrder(input,id,register=false) {
    if(!inScope(P.partner))return {ok:false,message:'Välj en säljpartners demovy.'};
    const old=id?orders().find(r=>r.id===id):null;
    if(id&&!old)return {ok:false,message:'Ordern finns inte i denna partnerdomän.'};
    if(old && old.status!=='draft')return {ok:false,message:'En registrerad order kan inte skrivas om. Använd statusflödet.'};
    const customer=customers().find(c=>c.id===input.customerId);
    const category=clean(input.category), product=clean(input.product);
    if(!customer)return {ok:false,message:'Välj eller skapa en kund.'};
    if(!products[category]?.includes(product))return {ok:false,message:'Välj produktkategori och produkt.'};
    if((customer.type==='private')!==(category==='consumer'))return {ok:false,message:'Privatperson använder Elhandel privat. Företag och enskild firma använder Elhandel företag.'};
    if(!Array.isArray(input.facilities)||!input.facilities.length)return {ok:false,message:'Lägg till minst en anläggning.'};
    const facilities=[];const ids=new Set();
    for(const [i,raw] of input.facilities.entries()) {
      const f={installationId:clean(raw.installationId),annualKwh:clean(raw.annualKwh),area:clean(raw.area),network:category==='business'?clean(raw.network).toUpperCase():'',profile:category==='business'&&profiled.has(product)?Array.from({length:12},(_,n)=>clean(raw.profile?.[n])):Array(12).fill('')};
      const fail=message=>({ok:false,message:`Anläggning ${i+1}: ${message}`});
      if((register||f.installationId)&&!/^\d{18}$/.test(f.installationId))return fail('anläggnings-ID ska ha 18 siffror.');
      if(f.installationId&&ids.has(f.installationId))return fail('anläggnings-ID förekommer redan i ordern.');ids.add(f.installationId);
      if((register||f.annualKwh)&&!num(f.annualKwh))return fail('ange uppskattad årsförbrukning i kWh.');
      if((register||f.area)&&!['SE1','SE2','SE3','SE4'].includes(f.area))return fail('välj elområde.');
      if(category==='business'&&(register||f.network)&&! /^[A-Z]{3}$/.test(f.network))return fail('nätområdeskoden ska ha tre bokstäver.');
      if(category==='business'&&profiled.has(product)) {
        if(f.profile.some(v=>v!==''&&!num(v)) || (register&&f.profile.some(v=>!num(v))))return fail('ange förbrukningen i kWh för årets tolv månader.');
        if(f.profile.every(num)&&num(f.annualKwh)&&Math.abs(f.profile.reduce((s,v)=>s+Number(v),0)-Number(f.annualKwh))>0.01)return fail('månadsprofilens summa ska motsvara årsförbrukningen.');
      }
      facilities.push(f);
    }
    if((register||input.startDate)&&!dateOK(input.startDate))return {ok:false,message:'Ange ett giltigt önskat startdatum.'};
    const termType=input.termType || (category==='business'&&clean(input.termMonths)!==''&&Number(input.termMonths)!==0?'fixed':'rolling');
    if(!['rolling','fixed'].includes(termType))return {ok:false,message:'Välj rörlig avtalstid eller ett angivet antal månader.'};
    if(termType==='fixed'&&(register||clean(input.termMonths)!=='')&&(!/^\d+$/.test(clean(input.termMonths))||!Number.isSafeInteger(Number(input.termMonths))||Number(input.termMonths)<1))return {ok:false,message:'Ange avtalstiden som ett positivt heltal månader.'};
    return mutate(d=>{const row={...old,id:old?.id||uid('order'),partner:P.partner,customerId:customer.id,category,product,facilities,startDate:input.startDate||'',termType,termMonths:termType==='fixed'?clean(input.termMonths):'',createdAt:old?.createdAt||today(),registeredAt:register?today():'',status:register?'registered':'draft',events:[{at:new Date().toISOString(),text:register?'Registrerad i lokal demo. Inget avtal har skickats.':'Utkast sparat.'},...(old?.events||[])]};if(old)d.orders[d.orders.findIndex(r=>r.id===id)]=row;else d.orders.push(row);return {ok:true,id:row.id};});
  }
  const transitions={draft:[],registered:['approved','rejected','withdrawn'],approved:['confirmed','withdrawn'],rejected:['withdrawn'],confirmed:['withdrawn','awaiting_start','lost_before_start'],withdrawn:[],awaiting_start:['active','lost_before_start'],lost_before_start:[],active:['lost_after_start'],lost_after_start:[]};
  function setStatus(id,status) {return mutate(d=>{const row=d.orders.find(r=>r.id===id&&inScope(r.partner));if(!row||!transitions[row.status]?.includes(status))return {ok:false,message:'Statusändringen är inte tillgänglig.'};const before=row.status;row.status=status;if(status==='approved'&&!row.approvedAt)row.approvedAt=today();if(status==='confirmed'&&!row.confirmedAt)row.confirmedAt=today();row.events=[{at:new Date().toISOString(),text:`Demostatus: ${statuses[before]} → ${statuses[status]}.`},...(row.events||[])];return {ok:true,id};});}
  function periodRows() { return orders().filter(r=>matchPeriod(r,filter())); }
  function commission(rows=P.partner==='vast'?orders():periodRows()) {
    if(P.partner==='vast'&&P.face2faceCommission){const f=filter(),month=f.year+'-'+f.month;const c=P.face2faceCommission.calculate(rows,month);return {eligible:rows.filter(r=>r.approvedAt?.startsWith(month)),confirmed:rows.filter(r=>r.confirmedAt?.startsWith(month)),amount:c.amount,rule:{kind:'order',rate:1500,label:'Face2face · 1 500 kr per avtal, 80 % garanterat förskott'},units:c.confirmed};}
    const eligible=rows.filter(r=>['approved','confirmed','awaiting_start','active'].includes(r.status));
    const confirmed=eligible.filter(r=>['confirmed','awaiting_start','active'].includes(r.status));
    const rule=P.partner==='syd'?{kind:'mwh',rate:30,label:'Savera · exempel: 30 kr per uppskattad års-MWh på bekräftade ordrar'}:null;
    const units=rule?.kind==='order'?confirmed.length:confirmed.reduce((sum,r)=>sum+r.facilities.reduce((s,f)=>s+Number(f.annualKwh||0)/1000,0),0);
    return {eligible,confirmed,rule,units,amount:rule?units*rule.rate:null};
  }
  function annualVolume(row) {
    if(!Array.isArray(row.facilities)||!row.facilities.length||row.facilities.some(f=>!f||f.annualKwh==null||clean(f.annualKwh)===''||!num(f.annualKwh)))return null;
    const total=row.facilities.reduce((sum,f)=>sum+Number(f.annualKwh),0);return Number.isFinite(total)?total:null;
  }
  function termTypeFor(row) {
    if(['rolling','fixed'].includes(row.termType))return row.termType;
    if(clean(row.termMonths)!==''&&num(row.termMonths))return Number(row.termMonths)===0?'rolling':'fixed';
    return row.category==='consumer'?'rolling':'';
  }
  function termLabel(row) { const type=termTypeFor(row);return type==='rolling'?'Rörlig':type==='fixed'&&Number(row.termMonths)>0?`${fmt(Number(row.termMonths))} månader`:'Ej angiven'; }
  const volumeLabel=row=>annualVolume(row)===null?'Underlag saknas':`${fmt(annualVolume(row))} kWh/år`;
  const options=(items,value)=>items.map(([key,label])=>`<option value="${e(key)}"${key===value?' selected':''}>${e(label)}</option>`).join('');
  const input=(name,label,value='',type='text',extra='')=>`<label class="ow-field">${e(label)}<input name="${e(name)}" type="${type}" value="${e(value)}" ${extra}></label>`;
  function heading(title) { return `<div class="ow-head"><div><span class="eyebrow">${e(P.getPartner()?.name)} / PARTNERFÖRSLAG</span><h1>${e(title)}</h1><p>Din försäljning, från första utkast till aktivt avtal.</p></div><div class="ow-actions"><button class="btn btn-secondary" data-ow-customer>＋ Ny kund</button><button class="btn btn-primary" data-ow-order>＋ Ny order</button></div></div><div class="ow-notice"><span>Exempeldata · Lokal demoinloggning · Inga avtal skickas</span><button class="text-button" data-ow-login>Byt demoinloggning</button><button class="text-button" data-ow-legacy>Återgå till tidigare vy</button></div>`; }
  function periodControls() {
    const f=filter(), years=[...new Set([today().slice(0,4),...orders().map(r=>(r.registeredAt||r.createdAt||'').slice(0,4))])].filter(y=>/^\d{4}$/.test(y)).sort().reverse();
    return `<section class="ow-period card" aria-label="Periodfilter"><label>Period<select data-ow-filter="mode">${options([['year','År'],['month','Månad'],['week','Vecka']],f.mode)}</select></label><label>${f.mode==='week'?'Veckoår':'År'}<select data-ow-filter="year">${options(years.map(y=>[y,y]),f.year)}</select></label>${f.mode==='month'?`<label>Månad<select data-ow-filter="month">${options(months.map((m,i)=>[String(i+1).padStart(2,'0'),m]),f.month)}</select></label>`:''}${f.mode==='week'?`<label>ISO-vecka<select data-ow-filter="week">${options(Array.from({length:Number(isoWeek(f.year+'-12-28').slice(6))},(_,i)=>[String(i+1).padStart(2,'0'),'Vecka '+(i+1)]),f.week)}</select></label>`:''}<p>Urval efter <strong>registreringsdatum</strong>.<br>Utkast följer skapandedatum. ${f.mode==='week'?'ISO-veckor: måndag–söndag.':''}</p></section>`;
  }
  function cards() { const rows=periodRows();return `<div class="ow-stats" aria-label="Orderstatus för vald period">${[['all','Alla ordrar'],...Object.entries(statuses)].map(([key,label])=>`<button class="ow-stat ${filter().status===key?'selected':''}" data-ow-status="${key}" aria-pressed="${filter().status===key}"><span>${label}</span><strong>${key==='all'?rows.length:rows.filter(r=>r.status===key).length}</strong><small>Visa ordrar →</small></button>`).join('')}</div>`; }
  function table(rows=periodRows(),commissionView=false) {
    const f=filter();const cs=customers();const selected=rows.filter(r=>(f.status==='all'||r.status===f.status)&&(!f.query||`${r.id} ${cs.find(c=>c.id===r.customerId)?.name||''} ${r.product}`.toLocaleLowerCase('sv').includes(f.query.toLocaleLowerCase('sv'))));
    return `<section class="card ow-list" id="ow-order-list"><div class="ow-list-head"><h2>${commissionView?'Orderunderlag':'Alla ordrar'} <span class="pill">${selected.length}</span></h2><div class="ow-list-filters"><label>Status<select data-ow-filter="status">${options([['all','Alla statusar'],...Object.entries(statuses)],f.status)}</select></label><label>Sök order eller kund<input type="search" data-ow-search value="${e(f.query)}" placeholder="Kund, produkt eller order-ID"></label></div></div><div class="table-wrap"><table><thead><tr><th>Order / kund</th><th>Produkt</th><th>Registrerad</th><th>Status</th><th>Anläggningar</th><th>Total årsvolym</th><th>Avtalstid</th></tr></thead><tbody>${selected.map(r=>`<tr><td><button class="text-button ow-open" data-ow-open="${e(r.id)}">${e(cs.find(c=>c.id===r.customerId)?.name||'Kund saknas')}</button><small class="ow-id">${e(r.id)}</small></td><td>${e(r.product)}</td><td>${date(r.registeredAt)}${r.status==='draft'?`<small class="ow-id">Skapad ${date(r.createdAt)}</small>`:''}</td><td><span class="ow-status ow-${r.status}">${statuses[r.status]}</span></td><td>${r.facilities.length}</td><td>${volumeLabel(r)}</td><td>${e(termLabel(r))}</td></tr>`).join('')||'<tr><td colspan="7">Inga ordrar för detta urval. Prova en annan period eller skapa en ny order.</td></tr>'}</tbody></table></div></section>`;
  }
  function renderHome() {
    if(!healthy())return heading('Underlaget behöver kontrolleras')+'<p role="alert">Sparade orderdata kan inte läsas. Inget har återställts eller skrivits över.</p>';
    const c=commission();
    return `<div class="ow-page">${heading('Din orderöversikt')}${periodControls()}${cards()}<div class="ow-summary"><div><span class="eyebrow">PROVISION / VALD PERIOD</span><h2>${P.partner==='vast'?'Förskott och tillägg per månad':c.confirmed.length+' '+(c.confirmed.length===1?'bekräftad order':'bekräftade ordrar')}</h2><p>${P.partner==='vast'?'Se godkännanden, sena bekräftelser och berättigad provision per månad.':c.eligible.length+' godkända inklusive bekräftade.'} Följ beräkningsunderlaget för ${e(P.getPartner()?.name)}.</p></div><button class="btn btn-secondary" data-go="order-commission">Visa provisionsstatistik →</button></div>${table()}<nav class="ow-deepen" aria-label="Fördjupning">${[['academy','Utbildning','Kurser, filmer och utbildningsmaterial'],['product-facts','Avtalsfakta','Fördjupa dig i produkter och avtal'],['support','Hjälp & support','Hitta stöd i ditt partnerarbete']].map(([id,title,text])=>`<button data-go="${id}" class="card"><strong>${title} →</strong><span>${text}</span></button>`).join('')}</nav></div>`;
  }
  function renderCommission() {
    if(P.partner==='vast'&&P.face2faceCommission)return P.face2faceCommission.render(orders(),heading('Din provisionsöversikt'));
    const c=commission();return `<div class="ow-page">${heading('Din provisionsstatistik')}${periodControls()}<p class="ow-notice">Beräkningsförslag med påhittade exempelvillkor. Belopp är inte intjänad eller utbetald ersättning. Verkliga regler måste fastställas per partner.</p><div class="ow-metrics"><article class="card"><span>Godkända, inklusive bekräftade</span><strong>${c.eligible.length}</strong><small>Godkända, bekräftade, väntande start och aktiva i registreringsperioden</small></article><article class="card"><span>Bekräftade</span><strong>${c.confirmed.length}</strong><small>Registrerade i vald period, oavsett när bekräftelsen skedde</small></article><article class="card"><span>Illustrativ provision</span><strong>${c.amount===null?'—':money(c.amount)}</strong><small>${e(c.rule?.label||'Partnerspecifika provisionsregler saknas')}</small></article></div><section class="card ow-rule"><h2>Så räknar detta förslag</h2><p>${c.rule?`${fmt(c.units)} ${c.rule.kind==='order'?'bekräftade ordrar':'uppskattade års-MWh'} × ${money(c.rule.rate)} = <strong>${money(c.amount)}</strong>.`:'Ingen beräkning görs innan denna partner har en definierad regel.'}</p><p>Godkända men ännu inte bekräftade ordrar visas i statistiken och ger inget exempelbelopp. Väntande avtalsstart och aktiva avtal räknas fortsatt som bekräftade. Ej godkända, ångrade och bortfall ingår inte i exempelbeloppet. Verklig hantering av återkrav vid bortfall är inte beslutad. Detta är aktuell status för en registreringskohort, inte en historisk månadsbokslutsbild eller en betalningsplan.</p></section>${table(undefined,true)}</div>`;
  }
  function renderCustomers() {return `<div class="ow-page">${heading('Dina kunder')}<section class="card ow-list"><h2>Kundregister <span class="pill">${customers().length}</span></h2><div class="table-wrap"><table><thead><tr><th>Kund</th><th>Kundtyp</th><th>E-post</th><th>Telefon</th><th>Ordrar</th></tr></thead><tbody>${customers().map(c=>`<tr><td><button class="text-button" data-ow-customer="${e(c.id)}">${e(c.name)}</button></td><td>${{private:'Privatperson',company:'Företag',sole:'Enskild firma'}[c.type]}</td><td>${e(c.email)||'—'}</td><td>${e(c.phone)||'—'}</td><td>${orders().filter(o=>o.customerId===c.id).length}</td></tr>`).join('')||'<tr><td colspan="5">Inga kunder ännu.</td></tr>'}</tbody></table></div></section></div>`;}
  function showError(form,message) {const el=form.querySelector('[role="alert"]');el.textContent=message;el.focus();}
  function customerDialog(id,onSaved,onCancel) {
    const c=customers().find(r=>r.id===id)||{};
    P.openDialog(c.id?'Redigera kund':'Ny kund',`<form id="ow-customer-form" class="ow-form"><p>Fiktiva uppgifter i denna partnerdomän. Namn och kundtyp krävs; övriga uppgifter kan kompletteras senare.</p><div role="alert" tabindex="-1"></div><div class="ow-grid">${input('name','Kundens namn *',c.name,'text','required maxlength="160"')}<label class="ow-field">Kundtyp *<select name="type">${options([['private','Privatperson'],['company','Företag'],['sole','Enskild firma']],c.type||(P.getPartner()?.audience==='consumer'?'private':'company'))}</select></label><label class="ow-field"><span id="ow-identifier-label">Organisationsnr/personnr</span><input name="identifier" value="${e(c.identifier||'')}" inputmode="numeric"></label>${input('postalAddress','Postadress',c.postalAddress)}${input('visitAddress','Besöksadress',c.visitAddress)}${input('email','E-postadress',c.email,'email')}${input('phone','Telefonnummer',c.phone,'tel')}</div><p class="muted">Nummer kontrolleras bara till formatet, inte mot person- eller företagsregister.</p><div class="ow-actions"><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button><button class="btn btn-primary" type="submit">Spara kund</button></div></form>`,()=>{const form=document.querySelector('#ow-customer-form');const label=()=>{form.querySelector('#ow-identifier-label').textContent=form.elements.type.value==='company'?'Organisationsnummer':'Personnummer';};label();form.elements.type.onchange=label;if(onCancel)form.querySelector('[data-ow-cancel]').onclick=ev=>{ev.stopPropagation();onCancel();};form.onsubmit=ev=>{ev.preventDefault();const result=saveCustomer(Object.fromEntries(new FormData(form)),c.id);if(!result.ok)return showError(form,result.message);P.closeDialog();if(onSaved)onSaved(result.id);else P.go('order-customers');P.toast('Kunden sparad lokalt. Du kan nu skapa en order.');};});
  }
  function orderDialog(id) {
    const existing=orders().find(r=>r.id===id);
    if(existing&&existing.status!=='draft')return detail(id);
    if(!customers().length){P.toast('Skapa en kund innan du registrerar en order.');return customerDialog(undefined,()=>orderDialog());}
    let draft=existing?JSON.parse(JSON.stringify(existing)):{customerId:customers()[0].id,category:customers()[0].type==='private'?'consumer':'business',product:'Rörligt månadspris',startDate:'',termType:'rolling',termMonths:'',facilities:[{installationId:'',annualKwh:'',area:'SE4',network:'',profile:Array(12).fill('')}]};
    draft.customerType=customers().find(c=>c.id===draft.customerId)?.type||'private';draft.termType=termTypeFor(draft)||'rolling';
    function capture(form) {
      const fd=new FormData(form);for(const field of ['customerType','customerId','category','product','startDate','termType','termMonths'])if(fd.has(field))draft[field]=fd.get(field);
      draft.facilities=[...form.querySelectorAll('[data-facility]')].map((el,i)=>{const f={...draft.facilities[i],profile:[...(draft.facilities[i]?.profile||Array(12).fill(''))]};for(const n of ['installationId','annualKwh','area','network']){const v=el.querySelector(`[data-field="${n}"]`);if(v)f[n]=v.value;}el.querySelectorAll('[data-month]').forEach(v=>f.profile[Number(v.dataset.month)]=v.value);return f;});
    }
    function draw() {
      const business=draft.category==='business';const profile=business&&profiled.has(draft.product);
      P.openDialog(existing?'Redigera utkast':'Ny order',`<form id="ow-order-form" class="ow-form"><p>Fyll i ett utkast eller registrera en komplett exempelorder. Ingen order skickas till Kraftringen.</p><div role="alert" tabindex="-1"></div><div class="ow-grid"><label class="ow-field">Kundtyp *<select name="customerType">${options([['company','Företag'],['sole','Enskild firma'],['private','Privatperson']],draft.customerType)}</select></label><label class="ow-field">Kund *<select name="customerId">${options([['','Välj kund'],...customers().filter(c=>c.type===draft.customerType).map(c=>[c.id,c.name])],draft.customerId)}</select></label><label class="ow-field">Produktkategori *<select name="category">${options([['consumer','Elhandel privat'],['business','Elhandel företag']],draft.category)}</select></label><label class="ow-field">Produktnamn *<select name="product">${options(products[draft.category].map(p=>[p,p]),draft.product)}</select></label>${input('startDate','Önskat startdatum',draft.startDate,'date')}<label class="ow-field">Avtalstid<select name="termType">${options([['rolling','Rörlig'],['fixed','Antal månader']],draft.termType)}</select></label>${draft.termType==='fixed'?input('termMonths','Avtalstid (månader)',draft.termMonths,'number','min="1" step="1"'):''}</div><button type="button" class="btn btn-secondary" data-ow-create-inline>＋ Skapa kund för ordern</button><h3>Anläggningar</h3>${draft.facilities.map((f,i)=>`<fieldset data-facility="${i}"><legend>Anläggning ${i+1}</legend><div class="ow-grid"><label class="ow-field">Anläggnings-ID<input data-field="installationId" value="${e(f.installationId)}" inputmode="numeric" maxlength="18"></label><label class="ow-field">Uppskattad årlig förbrukning (kWh)<input data-field="annualKwh" type="number" min="0" step="any" value="${e(f.annualKwh)}"></label><label class="ow-field">Elområdeskod<select data-field="area">${options(['SE1','SE2','SE3','SE4'].map(x=>[x,x]),f.area)}</select></label>${business?`<label class="ow-field">Nätområdeskod<input data-field="network" maxlength="3" value="${e(f.network)}"></label>`:''}</div>${profile?`<div class="ow-profile"><h4>Årsprofil · uppskattad förbrukning per månad (kWh)</h4><p>Januari–december under ett normalår. Summan ska motsvara årsförbrukningen.</p><div class="ow-months">${months.map((m,n)=>`<label>${m}<input type="number" min="0" step="any" data-month="${n}" value="${e(f.profile?.[n]||'')}"></label>`).join('')}</div></div>`:''}${draft.facilities.length>1?`<button type="button" class="text-button" data-ow-remove="${i}">Ta bort anläggning ${i+1}</button>`:''}</fieldset>`).join('')}<button type="button" class="btn btn-secondary" data-ow-add>＋ Lägg till anläggning</button><div class="ow-actions ow-form-footer"><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button><button type="submit" class="btn btn-secondary" value="draft">Spara utkast</button><button type="submit" class="btn btn-primary" value="register">Registrera order · demo</button></div></form>`,()=>{
        const form=document.querySelector('#ow-order-form');
        form.onchange=ev=>{
          const target=ev.target.name;if(!['customerType','customerId','category','product','termType'].includes(target))return;capture(form);
          if(target==='customerId'){draft.customerType=customers().find(c=>c.id===draft.customerId)?.type||draft.customerType;draft.category=draft.customerType==='private'?'consumer':'business';}
          if(target==='customerType')draft.category=draft.customerType==='private'?'consumer':'business';
          if(target==='category')draft.customerType=draft.category==='consumer'?'private':draft.customerType==='sole'?'sole':'company';
          if(['customerType','category'].includes(target)&&!customers().some(c=>c.id===draft.customerId&&c.type===draft.customerType))draft.customerId=customers().find(c=>c.type===draft.customerType)?.id||'';
          if(!products[draft.category].includes(draft.product))draft.product=products[draft.category][0];draw();document.querySelector(`[name="${target}"]`)?.focus();
        };
        form.querySelector('[data-ow-create-inline]').onclick=()=>{capture(form);customerDialog(undefined,id=>{draft.customerId=id;draft.customerType=customers().find(c=>c.id===id).type;draft.category=draft.customerType==='private'?'consumer':'business';if(!products[draft.category].includes(draft.product))draft.product=products[draft.category][0];draw();},draw);const type=document.querySelector('#ow-customer-form [name="type"]');type.value=draft.customerType;type.onchange();};
        form.querySelector('[data-ow-add]').onclick=()=>{capture(form);draft.facilities.push({installationId:'',annualKwh:'',area:'SE4',network:'',profile:Array(12).fill('')});draw();document.querySelectorAll('[data-facility]')[draft.facilities.length-1]?.querySelector('input')?.focus();};
        form.querySelectorAll('[data-ow-remove]').forEach(button=>button.onclick=()=>{capture(form);draft.facilities.splice(Number(button.dataset.owRemove),1);draw();document.querySelector('[data-ow-add]').focus();});
        form.onsubmit=ev=>{ev.preventDefault();capture(form);const result=saveOrder(draft,existing?.id,ev.submitter?.value==='register');if(!result.ok)return showError(form,result.message);P.closeDialog();P.go('overview');P.toast(ev.submitter?.value==='register'?'Exempelordern registrerad lokalt. Inget avtal har skickats.':'Utkastet sparat lokalt.');};
      });
    }
    draw();
  }
  function detail(id) {
    const r=orders().find(o=>o.id===id);if(!r)return;
    if(r.status==='draft')return orderDialog(id);
    const c=customers().find(c=>c.id===r.customerId);
    P.openDialog('Order · '+statuses[r.status],`<div class="ow-form"><h3>${e(c?.name||'Kund saknas')}</h3><p>${e(r.product)} · ${e(r.id)}</p><dl class="ow-detail"><div><dt>Registrerad</dt><dd>${date(r.registeredAt)}</dd></div><div><dt>Önskad start</dt><dd>${date(r.startDate)}</dd></div><div><dt>Avtalstid</dt><dd>${e(termLabel(r))}</dd></div><div><dt>Total årsvolym</dt><dd>${volumeLabel(r)}</dd></div></dl>${r.facilities.map((f,i)=>`<section class="card ow-rule"><h4>Anläggning ${i+1}</h4><p>${e(f.installationId)} · ${e(f.area)}${f.network?' · '+e(f.network):''}<br>${fmt(Number(f.annualKwh))} kWh/år</p>${profiled.has(r.product)?`<p>${months.map((m,n)=>`${m}: ${fmt(Number(f.profile[n]))} kWh`).join(' · ')}</p>`:''}</section>`).join('')}<h3>Simulera nästa status</h3><p>Endast för att prova förslaget. En riktig partner ska inte kunna godkänna sina egna ordrar; handläggning och behörigheter behöver byggas separat.</p><div class="ow-actions">${transitions[r.status].map(s=>`<button class="btn btn-secondary" data-ow-transition="${s}" data-order="${e(id)}">${statuses[s]} · demo</button>`).join('')||'<span>Inga ytterligare statussteg.</span>'}</div><h3>Historik</h3><ul>${r.events.map(ev=>`<li>${e(ev.text)} <small>${e(ev.at.slice(0,10))}</small></li>`).join('')}</ul></div>`);
  }
  function enable(value) {
    enabled=value;try{localStorage.setItem('partnerlabb.orders.enabled',String(value));}catch{P.toast('Vyn gäller bara denna session; inställningen kunde inte sparas.');}
    const url=new URL(location.href);url.searchParams.set('proposal',value?'orders':'legacy');history.replaceState(null,'',url);
  }
  function login() {
    P.openDialog('Välj demoinloggning',`<form id="ow-login" class="ow-form"><p>Prova partnerstyrd start. Detta simulerar en inloggning och ger inga riktiga behörigheter. Sites-inloggningen är fortfarande separat.</p><label class="ow-field">Demoidentitet / partnerdomän<select name="partner">${options(P.partnerRegistry.filter(p=>sales(p.id)).map(p=>[p.id,`${p.name} · demoanvändare`]),P.partner)}</select></label><button class="btn btn-primary" type="submit">Öppna partnerns startsida</button></form>`,()=>{document.querySelector('#ow-login').onsubmit=ev=>{ev.preventDefault();const id=new FormData(ev.target).get('partner');if(!sales(id))return;enable(true);try{localStorage.setItem('partnerlabb.orders.identity',id);}catch{}P.closeDialog();P.previewPartner(id);};});
  }
  function bind() {
    P.face2faceCommission?.bind();
    document.querySelectorAll('[data-ow-filter]').forEach(el=>el.onchange=()=>{const key=el.dataset.owFilter;filter()[key]=el.value;if(filter().mode==='week'&&Number(filter().week)>Number(isoWeek(filter().year+'-12-28').slice(6)))filter().week='01';P.render();document.querySelector(`[data-ow-filter="${key}"]`)?.focus();});
    const search=document.querySelector('[data-ow-search]');if(search)search.oninput=()=>{filter().query=search.value;const start=search.selectionStart;P.render();const next=document.querySelector('[data-ow-search]');next?.focus();try{next?.setSelectionRange(start,start);}catch{}};
  }
  const oldHome=P.routes['sales-partner-overview'];
  P.register('sales-partner-overview',{render:()=>enabled?renderHome():oldHome.render(),bind:()=>enabled?bind():oldHome.bind?.()});
  P.register('order-list',{render:()=>inScope(P.partner)?`<div class="ow-page">${heading('Dina ordrar')}${periodControls()}${cards()}${table()}</div>`:'<p>Öppna en säljpartners demovy.</p>',bind});
  P.register('order-customers',{render:()=>inScope(P.partner)?renderCustomers():'<p>Öppna en säljpartners demovy.</p>',bind});
  P.register('order-commission',{render:()=>inScope(P.partner)?renderCommission():'<p>Öppna en säljpartners demovy.</p>',bind});
  const areaLinks=[['overview','Översikt'],['order-list','Ordrar'],['order-customers','Kunder'],['order-commission','Provision'],['partner-sales','Mina resultat'],['partner-insights','Insikter'],['product-facts','Avtalsfakta'],['academy','Utbildning'],['support','Hjälp & support']];
  function areaNavigation() {
    const internal=P.role==='internal';const partner=internal?P.selectedPartnerId:P.partner;
    if(!enabled||!sales(partner))return;
    const internalPages=['partner-detail','partner-sales','partner-insights','product-facts','academy','support'];
    if(internal&&!internalPages.includes(P.page))return;
    const links=internal?[['partner-detail','Partneröversikt'],['partner-sales','Kunder & avtal'],['partner-insights','Insikter'],['product-facts','Avtalsfakta'],['academy','Utbildning'],['support','Hjälp & support']]:areaLinks;
    const strip=document.createElement('nav');strip.className='ow-tabs';strip.setAttribute('aria-label','Partnerns områden');
    strip.innerHTML=links.map(([id,label])=>`<button type="button" data-go="${id}" aria-current="${P.page===id?'page':'false'}">${label}</button>`).join('');
    document.querySelector('#view')?.prepend(strip);
    document.querySelector('.sr-partner-tabs')?.remove();
  }
  const previousAfter=P.afterRender;
  P.afterRender=()=>{previousAfter?.();areaNavigation();if(!document.querySelector('[data-ow-entry]')){const button=document.createElement('button');button.className='text-button';button.dataset.owEntry='';button.textContent='Prova nya partnerflödet';document.querySelector('.demo-banner')?.append(button);}if(P.role==='internal'&&['partner-detail','partner-sales','partner-insights'].includes(P.page)&&sales(P.selectedPartnerId)){const button=document.createElement('button');button.className='btn btn-primary';button.dataset.owPartner=P.selectedPartnerId;button.textContent='Visa ordrar & status';document.querySelector('.commercial-head, .sr-heading')?.append(button);}
    if(!enabled||!inScope(P.partner))return;
    const nav=document.querySelector('#nav');const links=[['overview','Start','home'],['order-list','Ordrar','file'],['order-customers','Kunder','users'],['order-commission','Provision','money']];
    if(P.getPartner()?.crmMode==='portal')links.push(['crm','CRM-översikt','users']);
    nav.innerHTML=links.map(([id,label,icon])=>`<button class="nav-button ${P.page===id?'active':''}" data-go="${id}" aria-current="${P.page===id?'page':'false'}">${P.icon(icon)}<span>${label}</span></button>`).join('')+nav.innerHTML.replace(/<button\b[^>]*data-go="(?:overview|commission)"[\s\S]*?<\/button>/g,'');
  };
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-ow-partner],[data-ow-entry],[data-ow-login],[data-ow-legacy],[data-ow-customer],[data-ow-order],[data-ow-cancel],[data-ow-status],[data-ow-open],[data-ow-transition]');if(!b)return;
    if(b.hasAttribute('data-ow-partner')){if(sales(b.dataset.owPartner)){enable(true);P.previewPartner(b.dataset.owPartner);}return;}
    if(b.hasAttribute('data-ow-entry')||b.hasAttribute('data-ow-login'))return login();
    if(b.hasAttribute('data-ow-legacy')){enable(false);P.go('overview');P.toast('Tidigare vy återställd. Dina testordrar och kunder är kvar till nästa gång du provar förslaget.');return;}
    if(b.hasAttribute('data-ow-cancel'))return P.closeDialog();
    if(!enabled||!inScope(P.partner))return;
    if(b.hasAttribute('data-ow-customer'))return customerDialog(b.dataset.owCustomer);
    if(b.hasAttribute('data-ow-order'))return orderDialog();
    if(b.hasAttribute('data-ow-status')){filter().status=b.dataset.owStatus;P.render();const list=document.querySelector('#ow-order-list');list?.setAttribute('tabindex','-1');list?.focus();list?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.hasAttribute('data-ow-open'))return detail(b.dataset.owOpen);
    if(b.hasAttribute('data-ow-transition')){if(!confirm(`Simulera ${statuses[b.dataset.owTransition]} för denna exempelorder?`))return;const result=setStatus(b.dataset.order,b.dataset.owTransition);if(!result.ok)return P.toast(result.message);P.render();detail(b.dataset.order);}
  });
  document.addEventListener('DOMContentLoaded',()=>{if(!enabled||P.demoMode)return;const params=new URLSearchParams(location.search);if(params.has('workspace')||params.has('partner')||params.has('movein'))return;let id;try{id=localStorage.getItem('partnerlabb.orders.identity');}catch{}if(sales(id))P.previewPartner(id);else if(params.get('proposal')==='orders')login();});
  P.orderWorkspace={statuses,products,customers,orders,saveCustomer,saveOrder,setStatus,matchPeriod,isoWeek,commission,enable,login,healthy,annualVolume,termLabel};
})();
