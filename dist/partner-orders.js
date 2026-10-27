(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const statuses = {draft:'Utkast',registered:'Registrerad',approved:'Godkänd',confirmation_sent:'Orderbekräftelse skickad',rejected:'Ej godkänd',cannot_confirm:'Kan inte bekräftas',needs_completion:'Behöver kompletteras',withdrawn:'Ångrad',confirmed:'Bindande avtal',lost_before_start:'Uppsagd före start',active:'Aktivt avtal',lost_after_start:'Uppsagd efter start'};
  // Read legacy waiting rows as the same binding state; never rewrite stored dates.
  const currentStatus = status => status==='awaiting_start'?'confirmed':status;
  const historyLabels = {...statuses,awaiting_start:'Väntar på avtalsstart (tidigare status)'};
  const products = P.productCatalog?.products || {
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
  function extraExamples() {
    const customers=[],orders=[];
    for(const month of ['07','08','09'])for(let i=0;i<30;i++) {
      const id=`flow-2026-${month}-${String(i+1).padStart(2,'0')}`,customerId=id+'-kund';
      const approvedAt=`2026-${month}-10`, registeredAt=`2026-${month}-08`;
      const offset=i<15?0:i<24?1:i<27?2:null;
      const cm=offset===null?null:Number(month)+offset;
      const confirmedAt=cm&&cm<=10?`2026-${String(cm).padStart(2,'0')}-15`:'';
      const started=confirmedAt&&cm<10,startDate=started?`2026-${String(cm+1).padStart(2,'0')}-01`:'2026-11-01';
      const status=started?'active':confirmedAt?'confirmed':i===29?'withdrawn':i===28?'confirmation_sent':'approved';
      const statusHistory=[{status:'draft',at:`2026-${month}-07`},{status:'registered',at:registeredAt},{status:'approved',at:approvedAt}];
      const confirmationSentAt=(confirmedAt||status==='withdrawn'||status==='confirmation_sent')?`2026-${month}-12`:'';
      if(confirmationSentAt)statusHistory.push({status:'confirmation_sent',at:confirmationSentAt});
      if(confirmedAt)statusHistory.push({status:'confirmed',at:confirmedAt});
      if(started)statusHistory.push({status:'active',at:startDate});
      if(status==='withdrawn')statusHistory.push({status:'withdrawn',at:`2026-${month}-25`});
      customers.push({id:customerId,partner:'vast',name:`Exempelkund ${month}–${String(i+1).padStart(2,'0')}`,type:'private',identifier:'',postalAddress:'Exempelgatan 1',visitAddress:'',email:`${id}@kund.example`,phone:'',createdAt:`2026-${month}-07`});
      orders.push({id,partner:'vast',customerId,category:'consumer',product:products.consumer[i%3],createdAt:`2026-${month}-07`,registeredAt,approvedAt,confirmationSentAt,confirmedAt,startDate,termType:'rolling',termMonths:'',status,statusHistory,examplePack:'flow2026',facilities:[{installationId:String(735999000000000000n+BigInt(Number(month)*100+i)),annualKwh:String(4000+(i%6)*2500),area:['SE3','SE4'][i%2],network:'',profile:Array(12).fill('')}],events:[{at:`2026-${month}-07T10:00:00Z`,text:'Fiktivt exempel med avtal som blir bindande senare. Inga verkliga kunduppgifter.'}]});
    }return {customers,orders};
  }
  const flowStages=['registered','approved','confirmation_sent','confirmed','active'];
  const historyStages=['draft','registered','approved','confirmation_sent','confirmed','awaiting_start','active','rejected','cannot_confirm','needs_completion','withdrawn','lost_before_start','lost_after_start'];
  const statusDefinitions={draft:'Påbörjad order som ännu inte registrerats.',registered:'Registrerad order som väntar på granskning.',approved:'Ordern har godkänts. Godkännandemånaden styr provisionsförskottet.',confirmation_sent:'Orderbekräftelsen har skickats. Ordern kan nu ångras och räknas ännu inte som ett bindande avtal i provisionen.',rejected:'Ordern klarade inte den första granskningen.',cannot_confirm:'Godkänd order som inte kan bekräftas. Slutligt bortfall före utskick, exempelvis saknat nätavtal, felaktig adress eller kreditbedömning.',needs_completion:'Godkänd order som behöver rättas eller kompletteras före utskick. Ett vänteläge, inte ett slutligt bortfall.',withdrawn:'Ordern har ångrats efter skickad orderbekräftelse men innan avtalet blivit bindande. Äldre historik kan följa det tidigare flödet.',confirmed:'Avtalet har blivit bindande och väntar på avtalsstart. Bindandedatum används för avräkning mot godkännandemånadens förskott. Tidigare Bekräftad och Väntar på avtalsstart är nu samma status.',lost_before_start:'Ordern eller avtalet har avslutats före avtalsstart. Kan ske från registrering till bindande avtal. Tidigare uppnådda steg bevaras.',active:'Avtalets leverans har startat.',lost_after_start:'Ett tidigare aktivt avtal har avslutats.'};
  function historyFor(row) {
    const result=Array.isArray(row.statusHistory)?row.statusHistory.filter(h=>historyLabels[h.status]&&dateOK(h.at?.slice(0,10))&&Number.isFinite(Date.parse(h.at))).map(h=>({...h})):[];
    for(const [status,field] of [['draft','createdAt'],['registered','registeredAt'],['approved','approvedAt'],['confirmation_sent','confirmationSentAt'],['confirmed','confirmedAt']])if((status!=='draft'||row.status==='draft')&&dateOK(row[field])&&!result.some(h=>h.status===status))result.push({status,at:row[field]});
    return result.sort((a,b)=>a.at.localeCompare(b.at)||(historyStages.indexOf(a.status)-historyStages.indexOf(b.status)));
  }
  function reached(row,stage) {
    const known=[row.status,...historyFor(row).map(h=>h.status)].map(currentStatus);
    if(known.includes('lost_after_start'))known.push('active');
    if(known.includes('lost_before_start'))known.push(row.cancellationFrom||'confirmed'); // Legacy loss rows belonged to binding agreements.
    if(known.includes('cannot_confirm')||known.includes('needs_completion'))known.push('approved');
    if(known.includes('rejected')||known.includes('withdrawn'))known.push('registered');
    return Math.max(-1,...known.map(x=>flowStages.indexOf(x)))>=flowStages.indexOf(stage);
  }
  function installExamples() {
    if(P.demoMode||P.state.orderWorkspace===undefined||!healthy()||data().samplePacks?.flow2026)return;
    const extra=extraExamples();const result=mutate(d=>{for(const key of ['customers','orders'])for(const row of extra[key])if(!d[key].some(r=>r.id===row.id))d[key].push(row);d.samplePacks={...d.samplePacks,flow2026:true};return {ok:true};});
    if(!result.ok)P.toast('De nya exempelordrarna kunde inte sparas. Dina befintliga uppgifter är kvar.');
    else P.render();
  }
  function fixture() {
    const customers=[],orders=[];
    for (const partner of ['vast','syd']) {
      const category=partner==='vast'?'consumer':'business';
      for(let i=0;i<20;i++) {
        const customerId=`order-demo-${partner}-customer-${i}`;
        customers.push({id:customerId,partner,name:category==='consumer'?`Exempelperson ${i+1}`:`Exempelföretag ${i+1} AB`,type:category==='consumer'?'private':'company',identifier:'',postalAddress:'Exempelgatan 1, 222 22 Exempelstad',visitAddress:'Exempelgatan 1, Exempelstad',email:`kund${i+1}@kund.example`,phone:'',createdAt:'2026-10-01'});
        const status=['draft','registered','approved','rejected','withdrawn','confirmed','confirmed','lost_before_start','active','lost_after_start'][i%10], registeredAt=status==='draft'?'':`2026-${i<10?'10':'09'}-${String(5+i).padStart(2,'0')}`;
        orders.push({id:`order-demo-${partner}-${i+1}`,partner,customerId,category,product:products[category][i%2],status,approvedAt:['approved','confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(status)?registeredAt:'',confirmedAt:['confirmed','awaiting_start','active','lost_before_start','lost_after_start'].includes(status)?registeredAt:'',createdAt:registeredAt||'2026-10-05',registeredAt,startDate:['active','lost_after_start'].includes(status)?registeredAt:'2026-12-01',termMonths:category==='business'?'12':'',facilities:[{installationId:'735999999999999999',annualKwh:category==='consumer'?'8000':'120000',area:'SE4',network:category==='business'?'DEM':'',profile:Array(12).fill('')}],events:[{at:'2026-10-01T09:00:00Z',text:'Fiktivt exempel för det nya orderförslaget.'}]});
      }
    }
    const extra=extraExamples();return {version:1,customers:[...customers,...extra.customers],orders:[...orders,...extra.orders],samplePacks:{flow2026:true}};
  }
  const seed=fixture();
  function data() { return P.state.orderWorkspace === undefined ? seed : P.state.orderWorkspace; }
  function healthy() { const d=data();return d&&d.version===1&&Array.isArray(d.customers)&&Array.isArray(d.orders); }
  const customers = () => healthy()?data().customers.filter(r=>r&&inScope(r.partner)):[];
  const orders = () => healthy()?data().orders.filter(r=>r&&inScope(r.partner)&&statuses[currentStatus(r.status)]).map(r=>r.status==='awaiting_start'?{...r,status:'confirmed'}:r):[];
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
    if(!products[category]?.includes(product)||P.productCatalog&&!P.productCatalog.allowed(category,product,P.partner))return {ok:false,message:'Välj produktkategori och produkt.'};
    if((customer.type==='private')!==(category==='consumer'))return {ok:false,message:'Privatperson använder Elhandel privat. Företag och enskild firma använder Elhandel företag.'};
    const priceListId=clean(input.priceListId)||old?.priceListId||'standard-demo-v1';
    const priceSnapshot=P.productCatalog?.snapshot(priceListId,category,product,P.partner);
    if(P.productCatalog&&!priceSnapshot)return {ok:false,message:'Välj en tillgänglig prislista för denna partner och produkt.'};
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
    return mutate(d=>{const row={...old,id:old?.id||uid('order'),partner:P.partner,customerId:customer.id,category,product,...(priceSnapshot?{priceListId,priceSnapshot}:{}),facilities,startDate:input.startDate||'',termType,termMonths:termType==='fixed'?clean(input.termMonths):'',createdAt:old?.createdAt||today(),registeredAt:register?today():'',status:register?'registered':'draft',statusHistory:old?[...historyFor(old),...(register?[{status:'registered',at:new Date().toISOString()}]:[])]:[{status:register?'registered':'draft',at:new Date().toISOString()}],events:[{at:new Date().toISOString(),text:register?'Registrerad i lokal demo. Inget avtal har skickats.':'Utkast sparat.'},...(old?.events||[])]};if(old)d.orders[d.orders.findIndex(r=>r.id===id)]=row;else d.orders.push(row);return {ok:true,id:row.id};});
  }
  const transitions={draft:[],registered:['approved','rejected','lost_before_start'],approved:['confirmation_sent','cannot_confirm','needs_completion','lost_before_start'],needs_completion:['approved','cannot_confirm','lost_before_start'],cannot_confirm:[],confirmation_sent:['confirmed','withdrawn','lost_before_start'],rejected:[],confirmed:['active','lost_before_start'],withdrawn:[],lost_before_start:[],active:['lost_after_start'],lost_after_start:[]};
  const issueReasons={network:'Nätavtal saknas',address:'Felaktig adress',credit:'Kreditbedömning',other:'Annat'};
  function setStatus(id,status,reason='') {return mutate(d=>{
    const row=d.orders.find(r=>r.id===id&&inScope(r.partner));
    if(!row||!transitions[currentStatus(row.status)]?.includes(status))return {ok:false,message:'Statusändringen är inte tillgänglig.'};
    if(['cannot_confirm','needs_completion'].includes(status)&&!issueReasons[reason])return {ok:false,message:'Välj en orsak.'};
    const before=currentStatus(row.status),at=new Date().toISOString();
    row.statusHistory=[...historyFor(row),{status,at,...(issueReasons[reason]?{reason}: {})}];
    if(status==='lost_before_start')row.cancellationFrom=before;
    row.status=status;
    if(status==='approved'&&!row.approvedAt)row.approvedAt=today();
    if(status==='confirmation_sent'&&!row.confirmationSentAt)row.confirmationSentAt=today();
    if(status==='confirmed'&&!row.confirmedAt)row.confirmedAt=today();
    row.events=[{at,text:`Demostatus: ${statuses[before]} → ${statuses[status]}.${issueReasons[reason]?' Orsak: '+issueReasons[reason]+'.':''}`},...(row.events||[])];return {ok:true,id};
  });}
  function issueDialog(id,status) {
    P.openDialog(statuses[status]+' · demo',`<form id="ow-issue-form" class="ow-form"><p>Välj orsaken till ${e(statuses[status].toLowerCase())}. Inga verkliga kontroller eller utskick görs.</p><label class="ow-field">Orsak<select name="reason" required><option value="">Välj orsak</option>${options(Object.entries(issueReasons),'')}</select></label><p role="alert" tabindex="-1"></p><div class="ow-actions ow-form-footer"><button type="submit" class="btn btn-primary">Spara demostatus</button><button type="button" class="btn btn-secondary" data-ow-open="${e(id)}">Avbryt</button></div></form>`);
    document.querySelector('#ow-issue-form').addEventListener('submit',ev=>{ev.preventDefault();const form=ev.currentTarget,result=setStatus(id,status,form.elements.reason.value);if(!result.ok)return showError(form,result.message);P.render();detail(id);});
  }
  function periodRows() { return orders().filter(r=>matchPeriod(r,filter())); }
  function commission(rows=P.partner==='vast'?orders():periodRows()) {
    if(P.partner==='vast'&&P.face2faceCommission){const f=filter(),month=f.year+'-'+f.month;const c=P.face2faceCommission.calculate(rows,month);return {eligible:rows.filter(r=>r.approvedAt?.startsWith(month)),confirmed:rows.filter(r=>r.confirmedAt?.startsWith(month)),amount:c.amount,rule:{kind:'order',rate:1500,label:'Face2face · 1 500 kr per avtal, 80 % garanterat förskott'},units:c.confirmed};}
    const eligible=rows.filter(r=>['approved','needs_completion','confirmation_sent','confirmed','awaiting_start','active'].includes(r.status));
    const confirmed=eligible.filter(r=>['confirmed','awaiting_start','active'].includes(r.status));
    const rule=P.partner==='syd'?{kind:'mwh',rate:30,label:'Savera · exempel: 30 kr per uppskattad års-MWh på bindande ordrar'}:null;
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
  function cards() {
    const rows=periodRows(),f=filter(),count=key=>rows.filter(r=>r.status===key).length,base=rows.filter(r=>reached(r,'registered')).length;
    const chip=(key,label)=>`<button class="ow-chip" data-ow-status="${key}" aria-pressed="${f.status===key}" title="${e(statusDefinitions[key]||'Alla ordrar i perioden')}">${e(label)} <strong>${key==='all'?rows.length:count(key)}</strong></button>`;
    const gaps=[['rejected','1–2'],['cannot_confirm','2–3'],['withdrawn','3–4'],null,['lost_after_start','Efter 5']];
    return `<section class="card ow-flow" aria-label="Orderflöde för vald period"><div class="ow-flow-intro"><strong>Från order till aktivt avtal</strong><span>Klicka på ett antal för att se ordrarna.</span>${chip('all','Alla')}${chip('draft','Utkast')}</div><p class="ow-scroll-hint">Svep i flödet för att se alla steg och bortfall →</p><div class="ow-flow-scroll" tabindex="0" role="region" aria-label="Fem ordersteg med bortfall mellan stegen"><div class="ow-flow-track">${flowStages.map((key,i)=>{const n=rows.filter(r=>reached(r,key)).length,gap=gaps[i];return `<article class="ow-flow-stage" data-ow-column="${key}" style="grid-column:${i*2+1}"><button data-ow-stage="${key}" aria-pressed="${f.status==='stage:'+key}" title="${e(statusDefinitions[key])}"><span>${i+1}. ${statuses[key]}</span><strong>${n}</strong><small>har nått steget</small><span class="ow-flow-bar" aria-hidden="true"><i style="width:${base?n/base*100:0}%"></i></span></button><button class="ow-current" data-ow-status="${key}" aria-pressed="${f.status===key}" title="${e(statusDefinitions[key])}">${count(key)} ${key==='active'?'aktiva nu':'kvar i steget'}</button></article><div class="ow-flow-gap${gap?' ow-loss-branch':''}${key==='confirmation_sent'?' ow-withdrawal-branch':''}" style="grid-column:${i*2+2}" data-ow-between="${gap?.[1]||'4–5'}"><span class="ow-gap-arrow" aria-hidden="true">${i===4?'↘':'→'}</span>${gap?`<span class="ow-gap-down" aria-hidden="true">↓</span>${chip(gap[0],statuses[gap[0]])}`:''}</div>`;}).join('')}<div class="ow-cancel-band"><span class="ow-cancel-bracket" aria-hidden="true"></span>${chip('lost_before_start',statuses.lost_before_start)}<span>Kan ske under hela processen före avtalsstart · steg 1–4</span></div></div></div><div class="ow-completion">${chip('needs_completion',statuses.needs_completion)}<span>Väntar på rättning före steg 3 · inget slutligt bortfall</span></div><details class="ow-flow-help"><summary>Så läser du flödet och statusarna</summary><p>Alla steg följer samma grupp: ordrar registrerade under vald period. Antalet som <strong>har nått steget</strong> är kumulativt och kan inte öka åt höger. Senare bortfall tar inte bort redan uppnådda steg. Stegen ska därför inte summeras.</p><p><strong>Kvar i steget / aktiva nu</strong> visar aktuell status. Dessa antal, utkast, kompletteringar och bortfall är separata grupper som tillsammans blir alla ordrar. Detta visar dagens läge för periodens ordergrupp, inte ett historiskt månadsbokslut. Äldre saknade datum fylls inte i.</p><p>Bortfallen ligger mellan stegen: Ej godkänd mellan 1 och 2, Kan inte bekräftas mellan 2 och 3 och Ångrad mellan 3 och 4. Uppsagd före start kan ske under steg 1–4. Uppsagd efter start visas efter steg 5. Ordrar som behöver kompletteras har nått Godkänd men har inte fallit bort.</p><p>Ånger kan bara ske efter skickad orderbekräftelse och före bindande avtal. Äldre ångrade ordrar behåller sin historik. Uppsägningar och felorsaker ändrar inte den överenskomna provisionsmodellen.</p><dl>${Object.entries(statuses).map(([key,label])=>`<dt>${label}</dt><dd>${e(statusDefinitions[key])}</dd>`).join('')}</dl></details></section>`;
  }
  function resultSummary() {
    const rows=periodRows(),registered=rows.filter(r=>reached(r,'registered')),confirmed=rows.filter(r=>reached(r,'confirmed')),active=rows.filter(r=>r.status==='active');
    const volume=active.length&&active.some(r=>annualVolume(r)===null)?null:active.reduce((sum,r)=>sum+(annualVolume(r)||0),0);
    const years=filter().year;
    const timeline=months.map((label,i)=>{const m=years+'-'+String(i+1).padStart(2,'0');const group=orders().filter(r=>r.registeredAt?.startsWith(m));return {label,group,n:group.length,c:group.filter(r=>reached(r,'confirmed')).length};});
    const max=Math.max(1,...timeline.map(m=>m.n));
    return `<section class="ow-results" aria-label="Resultat för periodens ordergrupp"><div><strong>${registered.length?fmt(confirmed.length/registered.length*100)+' %':'—'}</strong><span>har blivit bindande</span></div><div><strong>${active.length}</strong><span>aktiva avtal just nu</span></div><div><strong>${volume===null?'Underlag saknas':fmt(volume)+' kWh'}</strong><span>årsvolym för gruppens aktiva avtal</span></div><button class="btn btn-secondary" data-go="order-commission">Visa provisionsstatistik →</button></section><details class="card ow-rule ow-result-details"><summary>Resultatutveckling ${e(years)} och äldre rapporter</summary><p>Registrerade ordrar per månad i valt år. Den mörka delen visar hur många som hittills blivit bindande. Samma orderunderlag som flödet; ingen separat statistik kopieras in.</p><div class="ow-trend">${timeline.map(m=>`<div><span>${m.label}</span><div class="ow-trend-track"><i style="width:${m.n/max*100}%"><b style="width:${m.n?m.c/m.n*100:0}%"></b></i></div><span>${m.c} / ${m.n}</span></div>`).join('')}</div><p>Äldre rapporter har ett separat, oförändrat exempelunderlag och ingår inte i totalsiffrorna ovan.</p><button class="text-button" data-go="partner-sales">Öppna äldre resultatrapport</button> · <button class="text-button" data-go="partner-insights">Öppna äldre Insikter</button></details>`;
  }
  function table(rows=periodRows(),commissionView=false) {
    const f=filter();const cs=customers();const selected=rows.filter(r=>(f.status==='all'||(f.status.startsWith('stage:')?reached(r,f.status.slice(6)):r.status===f.status))&&(!f.query||`${r.id} ${cs.find(c=>c.id===r.customerId)?.name||''} ${r.product}`.toLocaleLowerCase('sv').includes(f.query.toLocaleLowerCase('sv'))));
    return `<section class="card ow-list" id="ow-order-list"><div class="ow-list-head"><h2>${commissionView?'Orderunderlag':'Alla ordrar'} <span class="pill">${selected.length}</span></h2><div class="ow-list-filters"><label>Status<select data-ow-filter="status">${options([['all','Alla statusar'],...Object.entries(statuses),...flowStages.map(key=>['stage:'+key,'Har nått: '+statuses[key]])],f.status)}</select></label><label>Sök order eller kund<input type="search" data-ow-search value="${e(f.query)}" placeholder="Kund, produkt eller order-ID"></label></div></div><div class="table-wrap"><table><thead><tr><th>Order / kund</th><th>Produkt</th><th>Registrerad</th><th>Status</th><th>Anläggningar</th><th>Total årsvolym</th><th>Avtalstid</th></tr></thead><tbody>${selected.map(r=>`<tr data-ow-row="${e(r.id)}"><td><strong>${e(cs.find(c=>c.id===r.customerId)?.name||'Kund saknas')}</strong><button class="text-button ow-id" data-ow-open="${e(r.id)}" aria-label="Visa statushistorik för ${e(r.id)}">${e(r.id)} · historik</button></td><td>${e(r.product)}</td><td>${date(r.registeredAt)}${r.status==='draft'?`<small class="ow-id">Skapad ${date(r.createdAt)}</small>`:''}</td><td><span class="ow-status ow-${r.status}">${statuses[r.status]}</span></td><td>${r.facilities.length}</td><td>${volumeLabel(r)}</td><td>${e(termLabel(r))}</td></tr>`).join('')||'<tr><td colspan="7">Inga ordrar för detta urval. Prova en annan period eller skapa en ny order.</td></tr>'}</tbody></table></div></section>`;
  }
  function renderHome() {
    if(!healthy())return heading('Underlaget behöver kontrolleras')+'<p role="alert">Sparade orderdata kan inte läsas. Inget har återställts eller skrivits över.</p>';
    return `<div class="ow-page">${heading('Ordrar & resultat')}${periodControls()}${cards()}${resultSummary()}${table()}<nav class="ow-deepen" aria-label="Fördjupning">${[['academy','Utbildning'],['products','Produkter'],['support','Hjälp & support']].map(([id,title])=>`<button data-go="${id}" class="card"><strong>${title} →</strong></button>`).join('')}</nav></div>`;
  }
  function renderCommission() {
    if(P.partner==='vast'&&P.face2faceCommission)return P.face2faceCommission.render(orders(),heading('Din provisionsöversikt'));
    const c=commission();return `<div class="ow-page">${heading('Din provisionsstatistik')}${periodControls()}<p class="ow-notice">Beräkningsförslag med påhittade exempelvillkor. Belopp är inte intjänad eller utbetald ersättning. Verkliga regler måste fastställas per partner.</p><div class="ow-metrics"><article class="card"><span>Godkända, inklusive bindande avtal</span><strong>${c.eligible.length}</strong><small>Godkända, utskickade, bindande och aktiva i registreringsperioden</small></article><article class="card"><span>Bindande avtal</span><strong>${c.confirmed.length}</strong><small>Registrerade i vald period, oavsett när avtalet blev bindande</small></article><article class="card"><span>Illustrativ provision</span><strong>${c.amount===null?'—':money(c.amount)}</strong><small>${e(c.rule?.label||'Partnerspecifika provisionsregler saknas')}</small></article></div><section class="card ow-rule"><h2>Så räknar detta förslag</h2><p>${c.rule?`${fmt(c.units)} ${c.rule.kind==='order'?'bindande ordrar':'uppskattade års-MWh'} × ${money(c.rule.rate)} = <strong>${money(c.amount)}</strong>.`:'Ingen beräkning görs innan denna partner har en definierad regel.'}</p><p>Godkända ordrar, även med skickad orderbekräftelse, som ännu inte är bindande visas i statistiken och ger inget exempelbelopp. Bindande avtal väntar på avtalsstart. Aktiva avtal räknas fortsatt som bindande. Ej godkända, ångrade och bortfall ingår inte i exempelbeloppet. Verklig hantering av återkrav vid bortfall är inte beslutad. Detta är aktuell status för en registreringskohort, inte en historisk månadsbokslutsbild eller en betalningsplan.</p></section>${table(undefined,true)}</div>`;
  }
  function renderCustomers() {return `<div class="ow-page">${heading('Dina kunder')}<section class="card ow-list"><h2>Kundregister <span class="pill">${customers().length}</span></h2><div class="table-wrap"><table><thead><tr><th>Kund</th><th>Kundtyp</th><th>E-post</th><th>Telefon</th><th>Ordrar</th></tr></thead><tbody>${customers().map(c=>`<tr><td><button class="text-button" data-ow-customer="${e(c.id)}">${e(c.name)}</button></td><td>${{private:'Privatperson',company:'Företag',sole:'Enskild firma'}[c.type]}</td><td>${e(c.email)||'—'}</td><td>${e(c.phone)||'—'}</td><td>${orders().filter(o=>o.customerId===c.id).length}</td></tr>`).join('')||'<tr><td colspan="5">Inga kunder ännu.</td></tr>'}</tbody></table></div></section></div>`;}
  function showError(form,message) {const el=form.querySelector('[role="alert"]');el.textContent=message;el.focus();}
  function customerDialog(id,onSaved,onCancel) {
    const c=customers().find(r=>r.id===id)||{};
    P.openDialog(c.id?'Redigera kund':'Ny kund',`<form id="ow-customer-form" class="ow-form"><p>Fiktiva uppgifter i denna partnerdomän. Namn och kundtyp krävs; övriga uppgifter kan kompletteras senare.</p><div role="alert" tabindex="-1"></div><div class="ow-grid">${input('name','Kundens namn *',c.name,'text','required maxlength="160"')}<label class="ow-field">Kundtyp *<select name="type">${options([['private','Privatperson'],['company','Företag'],['sole','Enskild firma']],c.type||(P.getPartner()?.audience==='consumer'?'private':'company'))}</select></label><label class="ow-field"><span id="ow-identifier-label">Organisationsnr/personnr</span><input name="identifier" value="${e(c.identifier||'')}" inputmode="numeric"></label>${input('postalAddress','Postadress',c.postalAddress)}${input('visitAddress','Besöksadress',c.visitAddress)}${input('email','E-postadress',c.email,'email')}${input('phone','Telefonnummer',c.phone,'tel')}</div><p class="muted">Nummer kontrolleras bara till formatet, inte mot person- eller företagsregister.</p><div class="ow-actions"><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button><button class="btn btn-primary" type="submit">Spara kund</button></div></form>`,()=>{const form=document.querySelector('#ow-customer-form');const label=()=>{form.querySelector('#ow-identifier-label').textContent=form.elements.type.value==='company'?'Organisationsnummer':'Personnummer';};label();form.elements.type.onchange=label;if(onCancel)form.querySelector('[data-ow-cancel]').onclick=ev=>{ev.stopPropagation();onCancel();};form.onsubmit=ev=>{ev.preventDefault();const result=saveCustomer(Object.fromEntries(new FormData(form)),c.id);if(!result.ok)return showError(form,result.message);P.closeDialog();if(onSaved)onSaved(result.id);else P.go('order-customers');P.toast('Kunden sparad lokalt. Du kan nu skapa en order.');};});
  }
  function orderDialog(id,preset) {
    if(!inScope(P.partner)||P.demoMode)return;
    const catalog=P.productCatalog, allowedProducts=cat=>catalog?catalog.availableProducts(cat,P.partner):products[cat];
    const categories=catalog?catalog.allowedCategories(P.partner):['consumer','business'];
    const existing=orders().find(r=>r.id===id);
    if(!existing&&catalog&&(!categories.some(cat=>allowedProducts(cat).length)||!catalog.lists(P.partner).length)){P.toast('Inga produkter eller prislistor är tilldelade. Kontakta Kraftringen.');return;}
    if(preset&&catalog&&!catalog.snapshot(preset.priceListId,preset.category,preset.product,P.partner)){P.toast('Produkten eller prislistan är inte tillgänglig.');return;}
    if(existing&&existing.status!=='draft')return detail(id);
    if(!customers().length&&!preset){P.toast('Skapa en kund innan du registrerar en order.');return customerDialog(undefined,()=>orderDialog());}
    let draft=existing?JSON.parse(JSON.stringify(existing)):{customerId:customers()[0]?.id||'',category:customers()[0]?.type==='private'?'consumer':'business',product:'Rörligt månadspris',startDate:'',termType:'rolling',termMonths:'',facilities:[{installationId:'',annualKwh:'',area:'SE4',network:'',profile:Array(12).fill('')}]};
    if(!existing&&!preset&&!allowedProducts(draft.category)?.includes(draft.product)){draft.category=categories.find(cat=>allowedProducts(cat).length);draft.product=allowedProducts(draft.category)[0];draft.customerId=customers().find(c=>(c.type==='private'?'consumer':'business')===draft.category)?.id||'';}
    if(preset&&!existing){draft={...draft,...preset};draft.customerId='';}
    draft.priceListId=draft.priceListId||P.productCatalog?.selected(P.partner)||'standard-demo-v1';
    draft.customerType=customers().find(c=>c.id===draft.customerId)?.type||(draft.category==='consumer'?'private':'company');draft.termType=termTypeFor(draft)||'rolling';
    function capture(form) {
      const fd=new FormData(form);for(const field of ['customerType','customerId','category','product','priceListId','startDate','termType','termMonths'])if(fd.has(field))draft[field]=fd.get(field);
      draft.facilities=[...form.querySelectorAll('[data-facility]')].map((el,i)=>{const f={...draft.facilities[i],profile:[...(draft.facilities[i]?.profile||Array(12).fill(''))]};for(const n of ['installationId','annualKwh','area','network']){const v=el.querySelector(`[data-field="${n}"]`);if(v)f[n]=v.value;}el.querySelectorAll('[data-month]').forEach(v=>f.profile[Number(v.dataset.month)]=v.value);return f;});
    }
    function draw() {
      const business=draft.category==='business';const profile=business&&profiled.has(draft.product);
      const scopedOptions=catalog?.restrictedOptions||options;
      P.openDialog(existing?'Redigera utkast':'Ny order',`<form id="ow-order-form" class="ow-form"><p>Fyll i ett utkast eller registrera en komplett exempelorder. Ingen order skickas till Kraftringen.</p><div role="alert" tabindex="-1"></div><div class="ow-grid"><label class="ow-field">Kundtyp *<select name="customerType">${scopedOptions([['company','Företag'],['sole','Enskild firma'],['private','Privatperson']].filter(([id])=>categories.includes(id==='private'?'consumer':'business')),draft.customerType)}</select></label><label class="ow-field">Kund *<select name="customerId">${options([['','Välj kund'],...customers().filter(c=>c.type===draft.customerType).map(c=>[c.id,c.name])],draft.customerId)}</select></label><label class="ow-field">Produktkategori *<select name="category">${scopedOptions([['consumer','Elhandel privat'],['business','Elhandel företag']].filter(([id])=>categories.includes(id)),draft.category)}</select></label><label class="ow-field">Produktnamn *<select name="product">${scopedOptions(allowedProducts(draft.category).map(p=>[p,p]),draft.product)}</select></label>${P.productCatalog?.orderFields(draft)||''}${input('startDate','Önskat startdatum',draft.startDate,'date')}<label class="ow-field">Avtalstid<select name="termType">${options([['rolling','Rörlig'],['fixed','Antal månader']],draft.termType)}</select></label>${draft.termType==='fixed'?input('termMonths','Avtalstid (månader)',draft.termMonths,'number','min="1" step="1"'):''}</div>${P.productCatalog?.orderPrice(draft)||''}<button type="button" class="btn btn-secondary" data-ow-create-inline>＋ Skapa kund för ordern</button><h3>Anläggningar</h3>${draft.facilities.map((f,i)=>`<fieldset data-facility="${i}"><legend>Anläggning ${i+1}</legend><div class="ow-grid"><label class="ow-field">Anläggnings-ID<input data-field="installationId" value="${e(f.installationId)}" inputmode="numeric" maxlength="18"></label><label class="ow-field">Uppskattad årlig förbrukning (kWh)<input data-field="annualKwh" type="number" min="0" step="any" value="${e(f.annualKwh)}"></label><label class="ow-field">Elområdeskod<select data-field="area">${options(['SE1','SE2','SE3','SE4'].map(x=>[x,x]),f.area)}</select></label>${business?`<label class="ow-field">Nätområdeskod<input data-field="network" maxlength="3" value="${e(f.network)}"></label>`:''}</div>${profile?`<div class="ow-profile"><h4>Årsprofil · uppskattad förbrukning per månad (kWh)</h4><p>Januari–december under ett normalår. Summan ska motsvara årsförbrukningen.</p><div class="ow-months">${months.map((m,n)=>`<label>${m}<input type="number" min="0" step="any" data-month="${n}" value="${e(f.profile?.[n]||'')}"></label>`).join('')}</div></div>`:''}${draft.facilities.length>1?`<button type="button" class="text-button" data-ow-remove="${i}">Ta bort anläggning ${i+1}</button>`:''}</fieldset>`).join('')}<button type="button" class="btn btn-secondary" data-ow-add>＋ Lägg till anläggning</button><div class="ow-actions ow-form-footer"><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button><button type="submit" class="btn btn-secondary" value="draft">Spara utkast</button><button type="submit" class="btn btn-primary" value="register">Registrera order · demo</button></div></form>`,()=>{
        const form=document.querySelector('#ow-order-form');
        form.onchange=ev=>{
          const target=ev.target.name;if(!['customerType','customerId','category','product','priceListId','termType'].includes(target))return;capture(form);
          if(target==='customerId'){draft.customerType=customers().find(c=>c.id===draft.customerId)?.type||draft.customerType;draft.category=draft.customerType==='private'?'consumer':'business';}
          if(target==='customerType')draft.category=draft.customerType==='private'?'consumer':'business';
          if(target==='category')draft.customerType=draft.category==='consumer'?'private':draft.customerType==='sole'?'sole':'company';
          if(['customerType','category'].includes(target)&&!customers().some(c=>c.id===draft.customerId&&c.type===draft.customerType))draft.customerId=customers().find(c=>c.type===draft.customerType)?.id||'';
          if(['customerType','customerId','category'].includes(target)&&!allowedProducts(draft.category).includes(draft.product))draft.product=allowedProducts(draft.category)[0]||'';draw();document.querySelector(`[name="${target}"]`)?.focus();
        };
        form.querySelector('[data-ow-create-inline]').onclick=()=>{capture(form);customerDialog(undefined,id=>{draft.customerId=id;draft.customerType=customers().find(c=>c.id===id).type;draft.category=draft.customerType==='private'?'consumer':'business';if(!allowedProducts(draft.category).includes(draft.product))draft.product=allowedProducts(draft.category)[0]||'';draw();},draw);const type=document.querySelector('#ow-customer-form [name="type"]');type.value=draft.customerType;type.onchange();};
        form.querySelector('[data-ow-add]').onclick=()=>{capture(form);draft.facilities.push({installationId:'',annualKwh:'',area:'SE4',network:'',profile:Array(12).fill('')});draw();document.querySelectorAll('[data-facility]')[draft.facilities.length-1]?.querySelector('input')?.focus();};
        form.querySelectorAll('[data-ow-remove]').forEach(button=>button.onclick=()=>{capture(form);draft.facilities.splice(Number(button.dataset.owRemove),1);draw();document.querySelector('[data-ow-add]').focus();});
        form.onsubmit=ev=>{ev.preventDefault();capture(form);const result=saveOrder(draft,existing?.id,ev.submitter?.value==='register');if(!result.ok)return showError(form,result.message);P.closeDialog();P.go('overview');P.toast(ev.submitter?.value==='register'?'Exempelordern registrerad lokalt. Inget avtal har skickats.':'Utkastet sparat lokalt.');};
      });
    }
    draw();
  }
  function detail(id) {
    const r=orders().find(o=>o.id===id);if(!r)return;

    const c=customers().find(c=>c.id===r.customerId);
    const history=historyFor(r);
    P.openDialog('Order · '+statuses[r.status],`<div class="ow-form">${r.status==='draft'?`<button class="btn btn-primary" data-ow-edit="${e(id)}">Redigera utkast</button>`:''}<h3>${e(c?.name||'Kund saknas')}</h3><p>${e(r.product)} · ${e(r.id)}</p><dl class="ow-detail"><div><dt>Registrerad</dt><dd>${date(r.registeredAt)}</dd></div><div><dt>Önskad start</dt><dd>${date(r.startDate)}</dd></div><div><dt>Avtalstid</dt><dd>${e(termLabel(r))}</dd></div><div><dt>Total årsvolym</dt><dd>${volumeLabel(r)}</dd></div></dl>${P.productCatalog?.savedPrice(r)||''}${r.facilities.map((f,i)=>`<section class="card ow-rule"><h4>Anläggning ${i+1}</h4><p>${e(f.installationId)} · ${e(f.area)}${f.network?' · '+e(f.network):''}<br>${fmt(Number(f.annualKwh))} kWh/år</p>${profiled.has(r.product)?`<p>${months.map((m,n)=>`${m}: ${fmt(Number(f.profile[n]))} kWh`).join(' · ')}</p>`:''}</section>`).join('')}<section class="ow-status-history"><h3>Statushistorik</h3><ol>${history.map(h=>`<li><strong>${historyLabels[h.status]}${issueReasons[h.reason]?`<small class="ow-history-reason">Orsak: ${issueReasons[h.reason]}</small>`:''}</strong><time datetime="${e(h.at)}">${h.at.includes('T')?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',dateStyle:'medium',timeStyle:'short'}).format(new Date(h.at)):date(h.at)}</time></li>`).join('')||'<li>Inga daterade statussteg finns sparade.</li>'}</ol>${history.some(h=>h.status===r.status)?'':`<p>Aktuell status: ${statuses[r.status]} · Datum saknas i äldre underlag.</p>`}<p class="muted">Endast sparade datum visas. Övriga äldre mellanled, exempelvis datum för skickad orderbekräftelse, kan saknas. Tidigare Bekräftad och Väntar på avtalsstart räknas nu som Bindande avtal. Äldre steg visas med sina ursprungliga datum; saknat bindandedatum härleds inte från väntestatusen.</p></section><h3>Simulera nästa status</h3><p>Endast för att prova förslaget. En riktig partner ska inte kunna godkänna sina egna ordrar; handläggning och behörigheter behöver byggas separat.</p><div class="ow-actions">${transitions[r.status].map(s=>`<button class="btn btn-secondary" data-ow-transition="${s}" data-order="${e(id)}">${statuses[s]} · demo</button>`).join('')||'<span>Inga ytterligare statussteg.</span>'}</div><details><summary>Övrig händelselogg</summary><ul>${(r.events||[]).map(ev=>`<li>${e(ev.text)} <small>${e(ev.at.slice(0,10))}</small></li>`).join('')}</ul></details></div>`);
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
  P.register('order-list',{render:()=>inScope(P.partner)?renderHome():'<p>Öppna en säljpartners demovy.</p>',bind});
  P.register('order-customers',{render:()=>inScope(P.partner)?renderCustomers():'<p>Öppna en säljpartners demovy.</p>',bind});
  P.register('order-commission',{render:()=>inScope(P.partner)?renderCommission():'<p>Öppna en säljpartners demovy.</p>',bind});
  const areaLinks=[['overview','Ordrar & resultat'],['order-commission','Provision'],['order-customers','Kunder'],['products','Produkter'],['academy','Utbildning'],['support','Hjälp & support']];
  function areaNavigation() {
    const internal=P.role==='internal';const partner=internal?P.selectedPartnerId:P.partner;
    if(!enabled||!sales(partner))return;
    const internalPages=['product-access','partner-detail','partner-sales','partner-insights','products','product-facts','academy','support'];
    if(internal&&!internalPages.includes(P.page))return;
    const links=internal?[['partner-detail','Partneröversikt'],['partner-sales','Kunder & avtal'],['partner-insights','Insikter'],['product-access','Sortiment & prislistor'],['products','Produkter'],['academy','Utbildning'],['support','Hjälp & support']]:['partner-sales','partner-insights'].includes(P.page)?[['overview','Ordrar & resultat'],['partner-sales','Äldre resultat'],['partner-insights','Äldre Insikter'],...areaLinks.slice(1)]:areaLinks;
    const strip=document.createElement('nav');strip.className='ow-tabs';strip.setAttribute('aria-label','Partnerns områden');
    strip.innerHTML=links.map(([id,label])=>`<button type="button" data-go="${id}" aria-current="${P.page===id||(id==='overview'&&P.page==='order-list')||(id==='products'&&P.page==='product-facts')?'page':'false'}">${label}</button>`).join('');
    document.querySelector('#view')?.prepend(strip);
    document.querySelector('.sr-partner-tabs')?.remove();
  }
  const previousAfter=P.afterRender;
  P.afterRender=()=>{previousAfter?.();areaNavigation();if(!document.querySelector('[data-ow-entry]')){const button=document.createElement('button');button.className='text-button';button.dataset.owEntry='';button.textContent='Prova nya partnerflödet';document.querySelector('.demo-banner')?.append(button);}if(P.role==='internal'&&['partner-detail','partner-sales','partner-insights'].includes(P.page)&&sales(P.selectedPartnerId)){const button=document.createElement('button');button.className='btn btn-primary';button.dataset.owPartner=P.selectedPartnerId;button.textContent='Visa ordrar & status';document.querySelector('.commercial-head, .sr-heading')?.append(button);}
    if(!enabled||!inScope(P.partner))return;
    const nav=document.querySelector('#nav');const links=[['overview','Ordrar & resultat','home'],['order-commission','Provision','money'],['order-customers','Kunder','users'],['products','Produkter','book']];
    if(P.getPartner()?.crmMode==='portal')links.push(['crm','CRM-översikt','users']);
    nav.innerHTML=links.map(([id,label,icon])=>`<button class="nav-button ${P.page===id?'active':''}" data-go="${id}" aria-current="${P.page===id||(id==='overview'&&P.page==='order-list')||(id==='products'&&P.page==='product-facts')?'page':'false'}">${P.icon(icon)}<span>${label}</span></button>`).join('')+nav.innerHTML.replace(/<button\b[^>]*data-go="(?:overview|commission|partner-sales|partner-insights|products|product-facts|savera|insikter)"[\s\S]*?<\/button>/g,'');
  };
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-ow-partner],[data-ow-entry],[data-ow-login],[data-ow-legacy],[data-ow-customer],[data-ow-order],[data-ow-cancel],[data-ow-status],[data-ow-stage],[data-ow-edit],[data-ow-row],[data-ow-open],[data-ow-transition]');if(!b)return;
    if(b.hasAttribute('data-ow-partner')){if(sales(b.dataset.owPartner)){enable(true);P.previewPartner(b.dataset.owPartner);}return;}
    if(b.hasAttribute('data-ow-entry')||b.hasAttribute('data-ow-login'))return login();
    if(b.hasAttribute('data-ow-legacy')){enable(false);P.go('overview');P.toast('Tidigare vy återställd. Dina testordrar och kunder är kvar till nästa gång du provar förslaget.');return;}
    if(b.hasAttribute('data-ow-cancel'))return P.closeDialog();
    if(!enabled||!inScope(P.partner))return;
    if(b.hasAttribute('data-ow-customer'))return customerDialog(b.dataset.owCustomer);
    if(b.hasAttribute('data-ow-order'))return orderDialog();
    if(b.hasAttribute('data-ow-edit'))return orderDialog(b.dataset.owEdit);
    if(b.hasAttribute('data-ow-stage')){filter().status='stage:'+b.dataset.owStage;P.render();const list=document.querySelector('#ow-order-list');list?.setAttribute('tabindex','-1');list?.focus();list?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.hasAttribute('data-ow-row'))return detail(b.dataset.owRow);
    if(b.hasAttribute('data-ow-status')){filter().status=b.dataset.owStatus;P.render();const list=document.querySelector('#ow-order-list');list?.setAttribute('tabindex','-1');list?.focus();list?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.hasAttribute('data-ow-open'))return detail(b.dataset.owOpen);
    if(b.hasAttribute('data-ow-transition')){if(['cannot_confirm','needs_completion'].includes(b.dataset.owTransition))return issueDialog(b.dataset.order,b.dataset.owTransition);if(!confirm(`Simulera ${statuses[b.dataset.owTransition]} för denna exempelorder?`))return;const result=setStatus(b.dataset.order,b.dataset.owTransition);if(!result.ok)return P.toast(result.message);P.render();detail(b.dataset.order);}
  });
  document.addEventListener('DOMContentLoaded',()=>{installExamples();if(!enabled||P.demoMode)return;const params=new URLSearchParams(location.search);if(params.has('workspace')||params.has('partner')||params.has('movein'))return;let id;try{id=localStorage.getItem('partnerlabb.orders.identity');}catch{}if(sales(id))P.previewPartner(id);else if(params.get('proposal')==='orders')login();});
  P.orderWorkspace={startProductOrder:preset=>{if(!inScope(P.partner)||P.demoMode)return;enable(true);orderDialog(undefined,preset);},statuses,products,customers,orders,saveCustomer,saveOrder,setStatus,matchPeriod,isoWeek,commission,enable,login,healthy,annualVolume,termLabel,reached,historyFor,extraExamples,installExamples};
})();
