(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const statuses = {draft:'Utkast',sent:'Skickad',registered:'Registrerad',approved:'Godkänd',confirmation_sent:'Orderbekräftelse skickad',rejected:'Ej godkänd',cannot_confirm:'Kan inte bekräftas',needs_completion:'Behöver kompletteras',withdrawn:'Ångrad',confirmed:'Bindande avtal',lost_before_start:'Uppsagd före start',active:'Aktivt avtal',lost_after_start:'Uppsagd efter start'};
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
  const uid = prefix => prefix + '-' + P.newId();
  const clean = value => String(value ?? '').trim();
  const dateOK = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const num = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  const fmt = value => new Intl.NumberFormat('sv-SE',{maximumFractionDigits:2}).format(value);
  const money = value => fmt(value) + ' kr';
  const date = value => dateOK(value) ? new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value)) : '—';
  const sales = id => ['sales','field'].includes(P.getPartner(id)?.type);
  const inScope = id => P.role === 'partner' && sales(P.partner) && id === P.partner && (!P.prototypeUsers || P.prototypeUsers.scope(id));
  // Default to orders for ordinary partner links; only an explicit rollback opts out.
  let enabled = new URLSearchParams(location.search).get('proposal') !== 'legacy';
  try { if (!new URLSearchParams(location.search).has('proposal')) enabled = localStorage.getItem('partnerlabb.orders.enabled') !== 'false'; } catch {}
  const filters = new Map();
  function filter() { if (!filters.has(P.partner)) filters.set(P.partner,{mode:'month',year:today().slice(0,4),month:today().slice(5,7),week:isoWeek(today()).slice(6),status:'all',query:''}); return filters.get(P.partner); }
  function isoWeek(day) { const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7)); const year=d.getUTCFullYear(); const start=new Date(Date.UTC(year,0,1)); return `${year}-W${String(Math.ceil((((d-start)/86400000)+1)/7)).padStart(2,'0')}`; }
  function matchPeriod(row, f) { const d=(f.status==='sent-history'?row.sentAt?.slice(0,10):null)||row.registeredAt || row.createdAt; if(!dateOK(d))return false; if(f.mode==='week')return isoWeek(d)===`${f.year}-W${f.week}`; return d.startsWith(f.year+(f.mode==='month'?'-'+f.month:'')); }
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
  const historyStages=['draft','sent','registered','approved','confirmation_sent','confirmed','awaiting_start','active','rejected','cannot_confirm','needs_completion','withdrawn','lost_before_start','lost_after_start'];
  const statusDefinitions={sent:'Offerten har accepterats för utskick av mejltjänsten. Inväntar kompletta handlingar och Kraftringens mottagning.',draft:'Påbörjad order som ännu inte registrerats.',registered:'Registrerad order som väntar på granskning.',approved:'Ordern har godkänts. Godkännandemånaden styr provisionsförskottet.',confirmation_sent:'Orderbekräftelsen har skickats. Ordern kan nu ångras och räknas ännu inte som ett bindande avtal i provisionen.',rejected:'Ordern klarade inte den första granskningen.',cannot_confirm:'Godkänd order som inte kan bekräftas. Slutligt bortfall före utskick, exempelvis saknat nätavtal, felaktig adress eller kreditbedömning.',needs_completion:'Godkänd order som behöver rättas eller kompletteras före utskick. Ett vänteläge, inte ett slutligt bortfall.',withdrawn:'Ordern har ångrats efter skickad orderbekräftelse men innan avtalet blivit bindande. Äldre historik kan följa det tidigare flödet.',confirmed:'Avtalet har blivit bindande och väntar på avtalsstart. Bindandedatum används för avräkning mot godkännandemånadens förskott. Tidigare Bekräftad och Väntar på avtalsstart är nu samma status.',lost_before_start:'Ordern eller avtalet har avslutats före avtalsstart. Kan ske från registrering till bindande avtal. Tidigare uppnådda steg bevaras.',active:'Avtalets leverans har startat.',lost_after_start:'Ett tidigare aktivt avtal har avslutats.'};
  function historyFor(row) {
    const result=Array.isArray(row.statusHistory)?row.statusHistory.filter(h=>historyLabels[h.status]&&dateOK(h.at?.slice(0,10))&&Number.isFinite(Date.parse(h.at))).map(h=>({...h})):[];
    for(const [status,field] of [['draft','createdAt'],['registered','registeredAt'],['approved','approvedAt'],['confirmation_sent','confirmationSentAt'],['confirmed','confirmedAt']])if((status!=='draft'||row.status==='draft')&&dateOK(row[field])&&!result.some(h=>h.status===status))result.push({status,at:row[field]});
    return result.sort((a,b)=>a.at.localeCompare(b.at)||(historyStages.indexOf(a.status)-historyStages.indexOf(b.status)));
  }
  const stageIndex=status=>flowStages.indexOf(status==='needs_completion'?'approved':currentStatus(status));
  const terminalStatuses=new Set(['rejected','cannot_confirm','withdrawn','lost_before_start','lost_after_start']);
  // null means the exit phase cannot be established. Never fabricate dates or mutate legacy rows.
  function flowPosition(row) {
    if(['draft','sent'].includes(row.status))return -1;
    const history=historyFor(row),known=Math.max(-1,...history.map(h=>stageIndex(h.status)));
    const current=stageIndex(row.status);
    if(current>=0)return current;
    let exit={rejected:0,cannot_confirm:1,lost_after_start:4}[row.status];
    if(row.status==='withdrawn')exit=known===2?2:null;
    if(row.status==='lost_before_start') {
      const explicit=stageIndex(row.cancellationFrom);
      const lastExit=history.findLastIndex(h=>h.status==='lost_before_start');
      const prior=lastExit>0?stageIndex(history[lastExit-1].status):-1;
      exit=explicit>=0?explicit:prior>=0?prior:known===3?3:null;
      if(exit===4)exit=null;
    }
    return Number.isInteger(exit)&&known<=exit?exit:null;
  }
  function reached(row,stage) {const index=flowPosition(row),target=flowStages.indexOf(stage);return index!==null&&target>=0&&index>=target;}
  function matchesFlow(row,value) {
    if(value==='flow:unknown')return row.status!=='draft'&&flowPosition(row)===null;
    const [prefix,kind,key,status]=value.split(':');
    if(prefix==='stage')return reached(row,kind);
    if(value==='sent-history')return !!row.mailReceipt;
    if(prefix!=='flow')return value==='all'||row.status===value;
    const index=flowStages.indexOf(key);if(index<0||flowPosition(row)!==index)return false;
    return kind==='remaining'?!terminalStatuses.has(row.status):kind==='loss'&&row.status===status;
  }
  function flowSummary(rows) {
    const unknown=rows.filter(r=>matchesFlow(r,'flow:unknown'));
    const stages=flowStages.map((key,i)=>{
      const entered=rows.filter(r=>reached(r,key)).length;
      const next=i<4?rows.filter(r=>reached(r,flowStages[i+1])).length:0;
      const remaining=rows.filter(r=>matchesFlow(r,'flow:remaining:'+key)).length;
      const lost=rows.filter(r=>flowPosition(r)===i&&terminalStatuses.has(r.status)).length;
      return {key,entered,next,remaining,lost,difference:entered-next-remaining-lost};
    });
    return {stages,unknown,drafts:rows.filter(r=>r.status==='draft').length,sent:rows.filter(r=>r.status==='sent').length};
  }
  function flowOptions() {return [['flow:unknown','Okänd bortfallsfas'],...flowStages.flatMap((key,i)=>[['flow:remaining:'+key,(i===4?'Aktiva nu':'Kvar efter')+': '+statuses[key]],...(i<4?[[`flow:loss:${key}:lost_before_start`,`Uppsagd före start · ${i+1}–${i+2}`]]:[]),...({0:['rejected'],1:['cannot_confirm'],2:['withdrawn'],4:['lost_after_start']}[i]||[]).map(status=>[`flow:loss:${key}:${status}`,statuses[status]+' · efter steg '+(i+1)])])];}
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
  const allOrders = () => healthy()?data().orders.filter(r=>r&&statuses[currentStatus(r.status)]):[];
  const orders = () => allOrders().filter(r=>inScope(r.partner)&&(!P.prototypeUsers||P.prototypeUsers.canRead(r))).map(r=>r.status==='awaiting_start'?{...r,status:'confirmed'}:r);
  const selectedOrders = () => orders().filter(r=>!P.prototypeUsers||P.prototypeUsers.selected(r));
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
    if(old?.mailAttempt)return {ok:false,message:'Orderversionen är låst av ett utskicksförsök. Bevara underlaget för avstämning.'};
    const correcting=!!old&&old.status!=='draft'&&P.prototypeUsers?.canManage();
    if(correcting&&!clean(input.correctionReason))return {ok:false,message:'Ange orsaken till rättningen.'};
    if(correcting&&(input.category!==old.category||input.product!==old.product||clean(input.priceListId)!==clean(old.priceListId||'standard-demo-v1')))return {ok:false,message:'Produkt och prislista bevaras på registrerade ordrar.'};
    if(!correcting&&P.learningProgram){const access=P.learningProgram.check(input.category,input.product);if(!access.ok)return access;}
    if(correcting)register=true; // Validate a complete order without changing its lifecycle.
    if(old && old.status!=='draft'&&!correcting)return {ok:false,message:'En registrerad order kan inte skrivas om. Använd statusflödet.'};
    const customer=customers().find(c=>c.id===input.customerId);
    const category=clean(input.category), product=clean(input.product);
    if(!customer)return {ok:false,message:'Välj eller skapa en kund.'};
    if(!products[category]?.includes(product)||!correcting&&P.productCatalog&&!P.productCatalog.allowed(category,product,P.partner))return {ok:false,message:'Välj produktkategori och produkt.'};
    if((customer.type==='private')!==(category==='consumer'))return {ok:false,message:'Privatperson använder Elhandel privat. Företag och enskild firma använder Elhandel företag.'};
    const priceListId=clean(input.priceListId)||old?.priceListId||'standard-demo-v1';
    const priceSnapshot=correcting?old.priceSnapshot:P.productCatalog?.snapshot(priceListId,category,product,P.partner);
    if(!correcting&&P.productCatalog&&!priceSnapshot)return {ok:false,message:'Välj en tillgänglig prislista för denna partner och produkt.'};
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
    return mutate(d=>{const row={...old,id:old?.id||uid('order'),partner:P.partner,...(P.prototypeUsers?{sellerId:old?P.prototypeUsers.owner(old):P.prototypeUsers.current()?.partner===P.partner?P.prototypeUsers.current().id:'',createdBy:old?.createdBy||P.prototypeUsers.current()?.id}:{}),customerId:customer.id,requiresPowerOfAttorney:input.requiresPowerOfAttorney===true,category,product,...(priceSnapshot?{priceListId,priceSnapshot}:{}),facilities,startDate:input.startDate||'',termType,termMonths:termType==='fixed'?clean(input.termMonths):'',createdAt:old?.createdAt||today(),registeredAt:correcting?old.registeredAt:register?today():'',status:correcting?old.status:register?'registered':'draft',statusHistory:correcting?old.statusHistory:old?[...historyFor(old),...(register?[{status:'registered',at:new Date().toISOString()}]:[])]:[{status:register?'registered':'draft',at:new Date().toISOString()}],events:[{at:new Date().toISOString(),actor:P.prototypeUsers?.current()?.id,text:correcting?'Rättad order: '+clean(input.correctionReason):register?'Registrerad i lokal demo. Inget avtal har skickats.':'Utkast sparat.',...(correcting?{changes:Object.fromEntries(['customerId','facilities','startDate','termType','termMonths'].filter(k=>JSON.stringify(old[k])!==JSON.stringify(k==='facilities'?facilities:input[k])).map(k=>[k,{before:old[k]??null,after:k==='facilities'?facilities:input[k]??null}]))}:{})},...(old?.events||[])]};if(old)d.orders[d.orders.findIndex(r=>r.id===id)]=row;else d.orders.push(row);return {ok:true,id:row.id};});
  }
  function assignOrder(id,sellerId,reason) {
    const access=P.prototypeUsers;
    if(!access?.canManage())return {ok:false,message:'Endast säljledare och Kraftringen får omfördela ordrar.'};
    return mutate(d=>{const row=d.orders.find(r=>r.id===id&&inScope(r.partner)&&access.canRead(r));
      const seller=access.users().find(u=>u.id===sellerId&&u.active&&['seller','manager'].includes(u.role)&&u.partner===row?.partner);
      if(!row||!seller||!clean(reason))return {ok:false,message:'Välj en aktiv säljare hos samma partner och ange orsak.'};
      const from=access.owner(row);if(from===sellerId)return {ok:false,message:'Ordern har redan denna ansvariga säljare.'};
      row.sellerId=sellerId;row.events=[{at:new Date().toISOString(),actor:access.current().id,text:`Omfördelad: ${access.users().find(u=>u.id===from)?.name||'Ej tilldelad'} → ${seller.name}. ${clean(reason)}`,assignment:{from,to:sellerId}},...(row.events||[])];return {ok:true,id};});
  }
  const transitions={draft:[],sent:['registered'],registered:['approved','rejected','lost_before_start'],approved:['confirmation_sent','cannot_confirm','needs_completion','lost_before_start'],needs_completion:['approved','cannot_confirm','lost_before_start'],cannot_confirm:[],confirmation_sent:['confirmed','withdrawn','lost_before_start'],rejected:[],confirmed:['active','lost_before_start'],withdrawn:[],lost_before_start:[],active:['lost_after_start'],lost_after_start:[]};
  const issueReasons={network:'Nätavtal saknas',address:'Felaktig adress',credit:'Kreditbedömning',other:'Annat'};
  function setStatus(id,status,reason='') {if(P.prototypeUsers&&!P.prototypeUsers.internal())return {ok:false,message:'Kraftringens handläggare hanterar orderstatus i prototypen.'};return mutate(d=>{
    const row=d.orders.find(r=>r.id===id&&inScope(r.partner));
    if(!row||!transitions[currentStatus(row.status)]?.includes(status))return {ok:false,message:'Statusändringen är inte tillgänglig.'};
    if(['cannot_confirm','needs_completion'].includes(status)&&!issueReasons[reason])return {ok:false,message:'Välj en orsak.'};
    const before=currentStatus(row.status),at=new Date().toISOString();
    row.statusHistory=[...historyFor(row),{status,at,...(issueReasons[reason]?{reason}: {})}];
    if(status==='lost_before_start')row.cancellationFrom=before;
    row.status=status;
    if(status==='registered'){if(reason!=='complete-demo-receipt')return {ok:false,message:'Bekräfta kompletta handlingar och demomottagning först.'};row.registeredAt=today();}
    if(status==='approved'&&!row.approvedAt)row.approvedAt=today();
    if(status==='confirmation_sent'&&!row.confirmationSentAt)row.confirmationSentAt=today();
    if(status==='confirmed'&&!row.confirmedAt)row.confirmedAt=today();
    row.events=[{at,text:`${status==='registered'?'Kompletta handlingar bekräftade. Mottagning i demo (ingen CRM-kvittens). ':''}Demostatus: ${statuses[before]} → ${statuses[status]}.${issueReasons[reason]?' Orsak: '+issueReasons[reason]+'.':''}`},...(row.events||[])];return {ok:true,id};
  });}
  function issueDialog(id,status) {
    P.openDialog(statuses[status]+' · demo',`<form id="ow-issue-form" class="ow-form"><p>Välj orsaken till ${e(statuses[status].toLowerCase())}. Inga verkliga kontroller eller utskick görs.</p><label class="ow-field">Orsak<select name="reason" required><option value="">Välj orsak</option>${options(Object.entries(issueReasons),'')}</select></label><p role="alert" tabindex="-1"></p><div class="ow-actions ow-form-footer"><button type="submit" class="btn btn-primary">Spara demostatus</button><button type="button" class="btn btn-secondary" data-ow-open="${e(id)}">Avbryt</button></div></form>`);
    document.querySelector('#ow-issue-form').addEventListener('submit',ev=>{ev.preventDefault();const form=ev.currentTarget,result=setStatus(id,status,form.elements.reason.value);if(!result.ok)return showError(form,result.message);P.render();detail(id);});
  }
  function periodRows() { return selectedOrders().filter(r=>matchPeriod(r,filter())); }
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
  function heading(title) { return `<div class="ow-head"><div><span class="eyebrow">${e(P.getPartner()?.name)} / PARTNERFÖRSLAG</span><h1>${e(title)}</h1><p>Din försäljning, från första utkast till aktivt avtal.</p></div><div class="ow-actions"><button class="btn btn-secondary" data-ow-customer>＋ Ny kund</button><button class="btn btn-primary" data-ow-order>＋ Ny order</button></div></div><div class="ow-notice"><span>Exempeldata · Lokala orderdata · Testmejl kan skickas till Håkan</span><button class="text-button" data-ow-login>Byt demoinloggning</button><button class="text-button" data-ow-legacy>Återgå till tidigare vy</button></div>`; }
  function periodControls() {
    const f=filter(), years=[...new Set([today().slice(0,4),...orders().map(r=>(r.registeredAt||r.createdAt||'').slice(0,4))])].filter(y=>/^\d{4}$/.test(y)).sort().reverse();
    return `<section class="ow-period card" aria-label="Periodfilter"><label>Period<select data-ow-filter="mode">${options([['year','År'],['month','Månad'],['week','Vecka']],f.mode)}</select></label><label>${f.mode==='week'?'Veckoår':'År'}<select data-ow-filter="year">${options(years.map(y=>[y,y]),f.year)}</select></label>${f.mode==='month'?`<label>Månad<select data-ow-filter="month">${options(months.map((m,i)=>[String(i+1).padStart(2,'0'),m]),f.month)}</select></label>`:''}${f.mode==='week'?`<label>ISO-vecka<select data-ow-filter="week">${options(Array.from({length:Number(isoWeek(f.year+'-12-28').slice(6))},(_,i)=>[String(i+1).padStart(2,'0'),'Vecka '+(i+1)]),f.week)}</select></label>`:''}<p>Urval efter <strong>registreringsdatum</strong>.<br>Utkast och Skickad följer skapandedatum. Skickade ordrar väljer i stället utskicksdatum. ${f.mode==='week'?'ISO-veckor: måndag–söndag.':''}</p></section>`;
  }
  let flowView = 'waterfall';
  function cards() {
    const rows=periodRows(),f=filter(),summary=flowSummary(rows),count=value=>rows.filter(r=>matchesFlow(r,value)).length;
    const chip=(value,label,cls='',hint='')=>`<button class="ow-chip ${cls}" data-ow-status="${value}" aria-pressed="${f.status===value}" title="${e(hint||statusDefinitions[value]||label)}">${e(label)} <strong>${count(value)}</strong></button>`;
    const registered=rows.length-summary.drafts-summary.sent, max=Math.max(1,summary.stages[0].entered);
    const percent=n=>(100*n/max).toFixed(4);
    return `<section class="card ow-flow" data-flow-view="${flowView}" aria-label="Orderflöde för vald period"><div class="ow-flow-intro"><strong>Från order till aktivt avtal</strong>${chip('all','Alla')}${chip('draft','Utkast')}${chip('sent','Skickad')}</div><div class="ow-w-toolbar"><span class="ow-w-desktop">${flowView==='steps'?'Steg för steg':'Vattenfall'} · antal ordrar</span><span class="ow-w-mobile">Orderflöde · steg för steg</span><div class="ow-w-switch" aria-label="Visning av orderflöde"><button data-ow-view="waterfall" aria-pressed="${flowView==='waterfall'}">Vattenfall</button><button data-ow-view="steps" aria-pressed="${flowView==='steps'}">Steg för steg</button></div></div><p class="ow-v-caption">${registered} registrerade i vald period · dagens läge för samma ordergrupp.<br>Flödet visar <strong>${summary.stages[0].entered} med känd fas</strong>. ${summary.unknown.length} med okänd bortfallsfas redovisas separat.</p><p class="ow-w-legend"><span><i class="ow-w-key total"></i>Har nått steget</span><span><i class="ow-w-key pending"></i>Kvar här – inte bortfall</span><span><i class="ow-w-key loss"></i>Bortfall</span></p><div class="ow-v-flow">${summary.stages.map((stage,i)=>{
      const key=stage.key,gap=i===4?'Efter 5':`${i+1}–${i+2}`,loss={0:'rejected',1:'cannot_confirm',2:'withdrawn',4:'lost_after_start'}[i];
      return `<div class="ow-w-step"><div class="ow-w-plot" aria-hidden="true" style="--entered:${percent(stage.entered)}%;--next:${percent(i===4?stage.remaining:stage.next)}%;--pending:${percent(i===4?0:stage.remaining)}%;--lost:${percent(stage.lost)}%;--loss-top:${percent(stage.entered-(i===4?0:stage.remaining))}%"><div class="ow-w-total"></div>${i<4?`<div class="ow-w-deduction ow-w-pending" title="${stage.remaining} kvar i steget"></div>`:''}<div class="ow-w-deduction ow-w-loss" title="${stage.lost} bortfall"></div>${i<4?'<span class="ow-w-connector"></span>':''}<span class="ow-w-value">${stage.entered}</span><span class="ow-w-zero">0</span></div><article class="ow-v-stage" data-ow-column="${key}"><button data-ow-stage="${key}" aria-pressed="${f.status==='stage:'+key}" title="${e(statusDefinitions[key])}"><span class="ow-v-number">${i+1}</span><span>${statuses[key]}</span><span class="ow-v-count"><strong>${stage.entered}</strong><small>har nått steget</small></span></button></article><div class="ow-v-gap${key==='confirmation_sent'?' ow-withdrawal-branch':''}" data-ow-between="${gap}"><span class="ow-v-arrow" aria-hidden="true">${i===4?'↳':'↓'}</span><div class="ow-v-outcomes">${chip('flow:remaining:'+key,i===4?'Aktiva nu':'Kvar här','',i===1?'Inklusive ordrar som behöver kompletteras':'Ordrar som fortfarande är kvar i detta steg')}${i===1?`<span class="ow-v-completion">varav ${chip('needs_completion','Behöver kompletteras')}</span>`:''}${loss?chip(`flow:loss:${key}:${loss}`,statuses[loss],'ow-v-loss',statusDefinitions[loss]):''}${i<4?chip(`flow:loss:${key}:lost_before_start`,'Uppsagd före start','ow-v-loss',`Uppsagd mellan steg ${i+1} och ${i+2}`):''}</div></div></div>`;
    }).join('')}</div><div class="ow-v-unknown">${chip('flow:unknown','Okänd bortfallsfas')}<span>Ingår i totalen, men inte i det avstämda flödet. Klicka för att se ordrarna.</span></div><details class="ow-flow-help"><summary>Så stämmer siffrorna</summary><p>Staplarna har samma skala och nollinje. Efter varje blå total visar det flytande gula segmentet ordrar som är kvar, och det rosa segmentet bortfall. Den streckade linjen leder till nästa steg. Efter sista steget visar den rosa delen uppsägningar efter start; återstoden är aktiva nu. På små skärmar visas samma uppdelning lodrätt.</p><p>För varje steg gäller: <strong>Har nått steget = vidare till nästa steg + kvar här + bortfall här.</strong> Samma order räknas en gång i respektive uppnått steg; stegens totalsiffror ska inte summeras.</p><ul class="ow-v-balances">${summary.stages.map((stage,i)=>`<li data-ow-balance="${stage.key}" data-difference="${stage.difference}">${i+1}. ${statuses[stage.key]}: <strong>${stage.entered}</strong> = ${i<4?`${stage.next} vidare + `:''}${stage.remaining} ${i===4?'aktiva nu':'kvar'} + ${stage.lost} bortfall${stage.difference?' · Avvikelse: '+stage.difference:''}</li>`).join('')}</ul><p>Totalt ${rows.length} ordrar = ${summary.stages[0].entered} med känd fas + ${summary.unknown.length} med okänd bortfallsfas + ${summary.drafts} utkast + ${summary.sent} skickade. Komplettering ingår i Kvar här efter Godkänd och räknas inte dubbelt. Ånger och uppsägning är separata bortfallsorsaker.</p><p>Varje uppsägning hänförs till den fas där den skedde, med stöd av sparad övergång eller historik. Äldre bortfall som inte säkert kan placeras visas separat; datum, status och provisionsunderlag skrivs inte om. Detta är dagens läge för registreringsperiodens ordrar, inte ett historiskt månadsbokslut.</p><dl>${Object.entries(statuses).map(([key,label])=>`<dt>${label}</dt><dd>${e(statusDefinitions[key])}</dd>`).join('')}</dl></details></section>`;
  }
  function resultSummary() {
    if(P.prototypeUsers)return P.prototypeUsers.results(selectedOrders());
    const rows=periodRows(),registered=rows.filter(r=>!['draft','sent'].includes(r.status)),confirmed=rows.filter(r=>reached(r,'confirmed')),active=rows.filter(r=>r.status==='active');
    const volume=active.length&&active.some(r=>annualVolume(r)===null)?null:active.reduce((sum,r)=>sum+(annualVolume(r)||0),0);
    const years=filter().year;
    const timeline=months.map((label,i)=>{const m=years+'-'+String(i+1).padStart(2,'0');const group=orders().filter(r=>r.registeredAt?.startsWith(m));return {label,group,n:group.length,c:group.filter(r=>reached(r,'confirmed')).length};});
    const max=Math.max(1,...timeline.map(m=>m.n));
    return `<section class="ow-results" aria-label="Resultat för periodens ordergrupp"><div><strong>${registered.length?fmt(confirmed.length/registered.length*100)+' %':'—'}</strong><span>${confirmed.length} av ${registered.length} registrerade har blivit bindande</span></div><div><strong>${active.length}</strong><span>aktiva avtal just nu</span></div><div><strong>${volume===null?'Underlag saknas':fmt(volume)+' kWh'}</strong><span>årsvolym för gruppens aktiva avtal</span></div><button class="btn btn-secondary" data-go="order-commission">Visa provisionsstatistik →</button></section><details class="card ow-rule ow-result-details"><summary>Resultatutveckling ${e(years)} och äldre rapporter</summary><p>Registrerade ordrar per månad i valt år. Den mörka delen visar hur många som hittills blivit bindande. Samma orderunderlag som flödet; ingen separat statistik kopieras in.</p><div class="ow-trend">${timeline.map(m=>`<div><span>${m.label}</span><div class="ow-trend-track"><i style="width:${m.n/max*100}%"><b style="width:${m.n?m.c/m.n*100:0}%"></b></i></div><span>${m.c} / ${m.n}</span></div>`).join('')}</div><p>Äldre rapporter har ett separat, oförändrat exempelunderlag och ingår inte i totalsiffrorna ovan.</p><button class="text-button" data-go="partner-sales">Öppna äldre resultatrapport</button> · <button class="text-button" data-go="partner-insights">Öppna äldre Insikter</button></details>`;
  }
  function table(rows=periodRows(),commissionView=false) {
    const f=filter();const cs=customers();const selected=rows.filter(r=>matchesFlow(r,f.status)&&(!f.query||`${r.id} ${cs.find(c=>c.id===r.customerId)?.name||''} ${r.product}`.toLocaleLowerCase('sv').includes(f.query.toLocaleLowerCase('sv'))));
    return `<section class="card ow-list" id="ow-order-list"><div class="ow-list-head"><h2>${commissionView?'Orderunderlag':f.status==='all'?'Alla ordrar':e(flowOptions().find(([key])=>key===f.status)?.[1]||(f.status==='sent-history'?'Skickade ordrar':statuses[f.status])||(f.status.startsWith('stage:')?'Har nått: '+statuses[f.status.slice(6)]:'Valda ordrar'))} <span class="pill">${selected.length}</span></h2><div class="ow-list-filters"><label>Status<select data-ow-filter="status">${options([['all','Alla statusar'],['sent-history','Skickade ordrar (utskicksdatum)'],...Object.entries(statuses),...flowStages.map(key=>['stage:'+key,'Har nått: '+statuses[key]]),...flowOptions()],f.status)}</select></label><label>Sök order eller kund<input type="search" data-ow-search value="${e(f.query)}" placeholder="Kund, produkt eller order-ID"></label></div></div><div class="table-wrap"><table><thead><tr><th>Order / kund</th><th>Produkt</th><th>Registrerad</th><th>Status</th><th>Anläggningar</th><th>Total årsvolym</th><th>Avtalstid</th></tr></thead><tbody>${selected.map(r=>`<tr data-ow-row="${e(r.id)}"><td><strong>${e(cs.find(c=>c.id===r.customerId)?.name||'Kund saknas')}</strong><button class="text-button ow-id" data-ow-open="${e(r.id)}" aria-label="Visa statushistorik för ${e(r.id)}">${e(r.id)} · historik</button>${P.prototypeUsers?`<span class="pu-order-owner">Ansvarig: ${e(P.prototypeUsers.ownerName(r))}</span>`:''}</td><td>${e(r.product)}</td><td>${date(r.registeredAt)}${r.status==='draft'?`<small class="ow-id">Skapad ${date(r.createdAt)}</small>`:''}</td><td><span class="ow-status ow-${r.status}">${statuses[r.status]}</span></td><td>${r.facilities.length}</td><td>${volumeLabel(r)}</td><td>${e(termLabel(r))}</td></tr>`).join('')||'<tr><td colspan="7">Inga ordrar för detta urval. Prova en annan period eller skapa en ny order.</td></tr>'}</tbody></table></div></section>`;
  }
  function renderHome() {
    if(!healthy())return heading('Underlaget behöver kontrolleras')+'<p role="alert">Sparade orderdata kan inte läsas. Inget har återställts eller skrivits över.</p>';
    return `<div class="ow-page">${heading('Ordrar & resultat')}${P.prototypeUsers?.sellerFilter()||''}${P.prototypeUsers?resultSummary():''}${P.prototypeUsers?'<h2>Orderflöde · registreringsperiod</h2>':''}${periodControls()}${cards()}${P.prototypeUsers?'':resultSummary()}${table()}<nav class="ow-deepen" aria-label="Fördjupning">${[['academy','Utbildning'],['products','Produkter'],['support','Hjälp & support']].map(([id,title])=>`<button data-go="${id}" class="card"><strong>${title} →</strong></button>`).join('')}</nav></div>`;
  }
  function renderCommission() {
    if(P.prototypeUsers&&!P.prototypeUsers.commission())return '<p>Provision visas för säljledare och Kraftringen.</p>';
    if(P.partner==='vast'&&P.face2faceCommission)return P.face2faceCommission.render(orders(),heading('Din provisionsöversikt'));
    const c=commission(orders().filter(r=>matchPeriod(r,filter())));return `<div class="ow-page">${heading('Din provisionsstatistik')}${periodControls()}<p class="ow-notice">Beräkningsförslag med påhittade exempelvillkor. Belopp är inte intjänad eller utbetald ersättning. Verkliga regler måste fastställas per partner.</p><div class="ow-metrics"><article class="card"><span>Godkända, inklusive bindande avtal</span><strong>${c.eligible.length}</strong><small>Godkända, utskickade, bindande och aktiva i registreringsperioden</small></article><article class="card"><span>Bindande avtal</span><strong>${c.confirmed.length}</strong><small>Registrerade i vald period, oavsett när avtalet blev bindande</small></article><article class="card"><span>Illustrativ provision</span><strong>${c.amount===null?'—':money(c.amount)}</strong><small>${e(c.rule?.label||'Partnerspecifika provisionsregler saknas')}</small></article></div><section class="card ow-rule"><h2>Så räknar detta förslag</h2><p>${c.rule?`${fmt(c.units)} ${c.rule.kind==='order'?'bindande ordrar':'uppskattade års-MWh'} × ${money(c.rule.rate)} = <strong>${money(c.amount)}</strong>.`:'Ingen beräkning görs innan denna partner har en definierad regel.'}</p><p>Godkända ordrar, även med skickad orderbekräftelse, som ännu inte är bindande visas i statistiken och ger inget exempelbelopp. Bindande avtal väntar på avtalsstart. Aktiva avtal räknas fortsatt som bindande. Ej godkända, ångrade och bortfall ingår inte i exempelbeloppet. Verklig hantering av återkrav vid bortfall är inte beslutad. Detta är aktuell status för en registreringskohort, inte en historisk månadsbokslutsbild eller en betalningsplan.</p></section>${table(undefined,true)}</div>`;
  }
  function renderCustomers() {return `<div class="ow-page">${heading('Dina kunder')}<section class="card ow-list"><h2>Kundregister <span class="pill">${customers().length}</span></h2><div class="table-wrap"><table><thead><tr><th>Kund</th><th>Kundtyp</th><th>E-post</th><th>Telefon</th><th>${P.prototypeUsers?.current()?.role==='seller'?'Dina ordrar':'Ordrar'}</th></tr></thead><tbody>${customers().map(c=>`<tr><td><button class="text-button" data-ow-customer="${e(c.id)}">${e(c.name)}</button></td><td>${{private:'Privatperson',company:'Företag',sole:'Enskild firma'}[c.type]}</td><td>${e(c.email)||'—'}</td><td>${e(c.phone)||'—'}</td><td>${orders().filter(o=>o.customerId===c.id).length}</td></tr>`).join('')||'<tr><td colspan="5">Inga kunder ännu.</td></tr>'}</tbody></table></div></section></div>`;}
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
    const correcting=!!existing&&existing.status!=='draft'&&P.prototypeUsers?.canManage();
    if(existing&&existing.status!=='draft'&&!correcting)return detail(id);
    if(!customers().length&&!preset){P.toast('Skapa en kund innan du registrerar en order.');return customerDialog(undefined,()=>orderDialog());}
    let draft=existing?JSON.parse(JSON.stringify(existing)):{customerId:customers()[0]?.id||'',category:customers()[0]?.type==='private'?'consumer':'business',product:'Rörligt månadspris',startDate:'',termType:'rolling',termMonths:'',facilities:[{installationId:'',annualKwh:'',area:'SE4',network:'',profile:Array(12).fill('')}]};
    if(!existing&&!preset&&!allowedProducts(draft.category)?.includes(draft.product)){draft.category=categories.find(cat=>allowedProducts(cat).length);draft.product=allowedProducts(draft.category)[0];draft.customerId=customers().find(c=>(c.type==='private'?'consumer':'business')===draft.category)?.id||'';}
    if(preset&&!existing){draft={...draft,...preset};draft.customerId='';}
    draft.priceListId=correcting?(existing.priceListId||'standard-demo-v1'):draft.priceListId||P.productCatalog?.selected(P.partner)||'standard-demo-v1';
    draft.customerType=customers().find(c=>c.id===draft.customerId)?.type||(draft.category==='consumer'?'private':'company');draft.termType=termTypeFor(draft)||'rolling';
    function capture(form) {
      draft.requiresPowerOfAttorney=!!form.elements.requiresPowerOfAttorney?.checked;const fd=new FormData(form);for(const field of ['customerType','customerId','category','product','priceListId','startDate','termType','termMonths','correctionReason'])if(fd.has(field))draft[field]=fd.get(field);
      draft.facilities=[...form.querySelectorAll('[data-facility]')].map((el,i)=>{const f={...draft.facilities[i],profile:[...(draft.facilities[i]?.profile||Array(12).fill(''))]};for(const n of ['installationId','annualKwh','area','network']){const v=el.querySelector(`[data-field="${n}"]`);if(v)f[n]=v.value;}el.querySelectorAll('[data-month]').forEach(v=>f.profile[Number(v.dataset.month)]=v.value);return f;});
    }
    function draw() {
      const business=draft.category==='business';const profile=business&&profiled.has(draft.product);
      const scopedOptions=catalog?.restrictedOptions||options;
      P.openDialog(correcting?'Rätta order':existing?'Redigera utkast':'Ny order',`<form id="ow-order-form" class="ow-form">${correcting?'':P.learningProgram?.gate(draft.category,draft.product)||''}<p>${correcting?'Rättningen loggas. Status, historik, produkt och sparad prisbild bevaras.':'Spara först ett utkast. Öppna sedan ordern för att skicka ett riktigt testmejl med textbilaga till hakan.rusk@kraftringen.se.'}</p>${correcting?input('correctionReason','Orsak till rättningen *',draft.correctionReason,'text','required maxlength="500"'):''}<div role="alert" tabindex="-1"></div><div class="ow-grid"><label class="ow-field">Kundtyp *<select name="customerType">${scopedOptions([['company','Företag'],['sole','Enskild firma'],['private','Privatperson']].filter(([id])=>categories.includes(id==='private'?'consumer':'business')),draft.customerType)}</select></label><label class="ow-field">Kund *<select name="customerId">${options([['','Välj kund'],...customers().filter(c=>c.type===draft.customerType).map(c=>[c.id,c.name])],draft.customerId)}</select></label><label class="ow-field">Produktkategori *<select name="category">${scopedOptions([['consumer','Elhandel privat'],['business','Elhandel företag']].filter(([id])=>categories.includes(id)),draft.category)}</select></label><label class="ow-field">Produktnamn *<select name="product">${scopedOptions(allowedProducts(draft.category).map(p=>[p,p]),draft.product)}</select></label>${P.productCatalog?.orderFields(draft)||''}${input('startDate','Önskat startdatum',draft.startDate,'date')}<label class="ow-field">Avtalstid<select name="termType">${options([['rolling','Rörlig'],['fixed','Antal månader']],draft.termType)}</select></label>${draft.termType==='fixed'?input('termMonths','Avtalstid (månader)',draft.termMonths,'number','min="1" step="1"'):''}</div>${correcting?(P.productCatalog?.savedPrice(existing)||''):(P.productCatalog?.orderPrice(draft)||'')}<button type="button" class="btn btn-secondary" data-ow-create-inline>＋ Skapa kund för ordern</button><label><input type="checkbox" name="requiresPowerOfAttorney" ${draft.requiresPowerOfAttorney?'checked':''}> Bifoga fullmakt för inhämtning av anläggningsuppgifter (testtext)</label><h3>Anläggningar</h3>${draft.facilities.map((f,i)=>`<fieldset data-facility="${i}"><legend>Anläggning ${i+1}</legend><div class="ow-grid"><label class="ow-field">Anläggnings-ID<input data-field="installationId" value="${e(f.installationId)}" inputmode="numeric" maxlength="18"></label><label class="ow-field">Uppskattad årlig förbrukning (kWh)<input data-field="annualKwh" type="number" min="0" step="any" value="${e(f.annualKwh)}"></label><label class="ow-field">Elområdeskod<select data-field="area">${options(['SE1','SE2','SE3','SE4'].map(x=>[x,x]),f.area)}</select></label>${business?`<label class="ow-field">Nätområdeskod<input data-field="network" maxlength="3" value="${e(f.network)}"></label>`:''}</div>${profile?`<div class="ow-profile"><h4>Årsprofil · uppskattad förbrukning per månad (kWh)</h4><p>Januari–december under ett normalår. Summan ska motsvara årsförbrukningen.</p><div class="ow-months">${months.map((m,n)=>`<label>${m}<input type="number" min="0" step="any" data-month="${n}" value="${e(f.profile?.[n]||'')}"></label>`).join('')}</div></div>`:''}${draft.facilities.length>1?`<button type="button" class="text-button" data-ow-remove="${i}">Ta bort anläggning ${i+1}</button>`:''}</fieldset>`).join('')}<button type="button" class="btn btn-secondary" data-ow-add>＋ Lägg till anläggning</button><div class="ow-actions ow-form-footer"><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button><button type="submit" class="btn btn-secondary" value="draft">Spara utkast</button><button type="submit" class="btn btn-primary" value="register">Registrera order · demo</button></div></form>`,()=>{
        const form=document.querySelector('#ow-order-form');
        if(!correcting)form.querySelector('[value="register"]').hidden=true;
        if(!correcting&&P.learningProgram&&!P.learningProgram.check(draft.category,draft.product).ok)form.querySelector('[value="draft"]').disabled=true;
        if(correcting){for(const name of ['category','product','priceListId','customerType'])form.elements[name].disabled=true;form.querySelector('[data-ow-create-inline]').hidden=true;form.elements.priceListId.closest('label').hidden=true;form.querySelector('[value="draft"]').hidden=true;form.querySelector('[value="register"]').textContent='Spara rättning';}
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
        form.onsubmit=ev=>{ev.preventDefault();capture(form);const result=saveOrder(draft,existing?.id,ev.submitter?.value==='register');if(!result.ok)return showError(form,result.message);P.closeDialog();P.go('overview');P.toast(correcting?'Ordern rättad lokalt; ändringen är loggad.':ev.submitter?.value==='register'?'Exempelordern registrerad lokalt. Inget avtal har skickats.':'Utkastet sparat lokalt.');};
      });
    }
    draw();
  }

  function mailPanel(row) {
    if(row.mailReceipt){
      const receipt=row.mailReceipt;
      return `<section class="card"><h3>Skickade dokument</h3><p>Första utskicket accepterades av Resend ${e(row.sentAt)} till ${e(receipt.recipient)}.</p>
        ${receipt.files?.map((file,index)=>`<details><summary>${e(file.filename)} · ${documentStatus(row,index)}</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${e(file.text)}</pre></details>`).join('')||`<p>${receipt.documents.map(e).join(' · ')}</p><p>Det här äldre utskicket har bara sparade filnamn.</p>`}
        <p>Meddelande-ID: ${e(receipt.providerMessageId)}</p>
        ${receipt.approvalUrl?'<p>Kundlänk finns i utskicket.</p><button type="button" class="btn btn-secondary" data-approval-id="'+e(receipt.approvalId)+'" data-approval-order="'+e(row.id)+'">Uppdatera kundens godkännanden</button><p role="status" id="approval-status"></p>':''}
        ${receipt.files? `<button type="button" class="btn btn-secondary" data-ow-send="${e(row.id)}">${row.resendAttempt?'Återuppta återsändning':'Skicka om testmejlet'}</button><p role="status" id="ow-mail-message"></p>`:''}</section>`;
    }
    if(row.status!=='draft')return '';
    return `<section class="card"><h3>Skicka testoffert</h3><p>Riktigt mejl med orderns nyckeluppgifter i en textfil${row.requiresPowerOfAttorney?' och en separat fullmaktstext':''}. Endast fiktiva uppgifter. Mottagare: hakan.rusk@kraftringen.se.</p><button type="button" class="btn btn-primary" data-ow-send="${e(row.id)}">${row.mailAttempt?'Återuppta samma utskick':'Skicka testmejl med TXT'}</button><p role="status" id="ow-mail-message">${row.mailAttempt?'Tidigare utskicksförsök finns. Samma underlag används för att undvika dubbla mejl.':''}</p></section>`;
  }
  const mailing=new Set();
  async function sendMail(id,button) {
    if(mailing.has(id))return {ok:false,message:'Utskicket pågår.'};
    let row=orders().find(r=>r.id===id);
    if(row&&P.learningProgram){const access=P.learningProgram.check(row.category,row.product);if(!access.ok){P.toast(access.message);return access;}}
    const resending=!!row?.mailReceipt?.files;
    if(!row||(!resending&&row.status!=='draft')||P.demoMode)return {ok:false,message:'Öppna ett eget utkast i den vanliga portalen.'};
    if(resending&&!row.resendAttempt){
      if(!window.confirm('Skicka samma dokument igen till '+row.mailReceipt.recipient+'?'))return;
      const attempt={...row.mailAttempt,attemptId:P.newId(),createdAt:new Date().toISOString(),resendFiles:row.mailReceipt.files,approvalId:row.mailReceipt.approvalId||row.mailAttempt.attemptId};
      const saved=mutate(d=>{const target=d.orders.find(r=>r.id===id);target.resendAttempt=attempt;return {ok:true};});
      if(!saved.ok){P.toast(saved.message);return saved;}
      row=orders().find(r=>r.id===id);
    }
    if(!row.mailAttempt) {
      const customer=customers().find(c=>c.id===row.customerId);
      const attempt={attemptId:P.newId(),createdAt:new Date().toISOString(),order:{id:row.id,customer:customer?.name||'',partner:P.getPartner(row.partner)?.name||row.partner,seller:P.prototypeUsers?.ownerName(row)||'',product:row.product,price:row.priceSnapshot?JSON.stringify(row.priceSnapshot):'Underlag saknas',startDate:row.startDate,term:termLabel(row),poa:row.requiresPowerOfAttorney===true,facilities:row.facilities.map(f=>({id:f.installationId,area:f.area,kwh:f.annualKwh,network:f.network}))}};
      const saved=mutate(d=>{const target=d.orders.find(r=>r.id===id);target.mailAttempt=attempt;return {ok:true};});
      if(!saved.ok){P.toast(saved.message);return saved;}row=orders().find(r=>r.id===id);
    }
    const attempt=resending?row.resendAttempt:row.mailAttempt;mailing.add(id);if(button)button.disabled=true;
    let result;
    try {
      const response=await fetch('/api/order-mail',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt),signal:AbortSignal.timeout(25000)});
      const receipt=await response.json();
      if(!response.ok||receipt.accepted!==true)throw new Error(receipt.error||'Mejltjänsten är inte tillgänglig.');
      // A response may arrive after a demo-account switch; retain the frozen attempt,
      // but never apply it to another order or overwrite newer local state.
      result=mutate(d=>{const target=d.orders.find(r=>r.id===id);
        if(resending){
          if(target?.resendAttempt?.attemptId!==attempt.attemptId)return {ok:false,message:'Ordern har ändrats. Kontrollera utskicket i Resend.'};
          target.events=[{at:receipt.acceptedAt,text:'Testmejl återsänt till '+receipt.recipient+'. ID: '+receipt.providerMessageId},...(target.events||[])];
          delete target.resendAttempt;
          return {ok:true};
        }
        if(!target||target.mailAttempt?.attemptId!==attempt.attemptId||target.status!=='draft')return {ok:false,message:'Mejlet accepterades, men ordern har ändrats. Kontrollera utskicket i Resend.'};target.mailReceipt=receipt;target.sentAt=receipt.acceptedAt;target.status='sent';target.statusHistory=[...historyFor(target),{status:'sent',at:receipt.acceptedAt}];target.events=[{at:receipt.acceptedAt,text:'Testmejl accepterat av Resend till '+receipt.recipient+'. ID: '+receipt.providerMessageId},...(target.events||[])];return {ok:true};});
      if(!result.ok)result.message='Mejlet accepterades men kvittensen kunde inte sparas lokalt. Återuppta samma utskick inom 22 timmar. '+result.message;
    }catch(error){result={ok:false,message:error.name==='AbortError'||error.name==='TimeoutError'?'Resultatet är okänt. Återuppta samma utskick inom 22 timmar; skapa inte ett nytt.':error.message};}
    finally{mailing.delete(id);if(button)button.disabled=false;}
    P.toast(result.ok?(resending?'Återsändningen accepterades av Resend.':'Testmejlet accepterades av Resend. Ordern är Skickad.'):result.message);
    if(result.ok){P.render();detail(id);}else{const message=document.querySelector('#ow-mail-message');if(message)message.textContent=result.message;}
    return result;
  }

  function documentStatus(row,index) {
    const signed=row.documentApprovals?.[index?'poa':'order'];
    if(signed)return 'Godkänd av '+e(signed.name)+' '+e(new Date(signed.at).toLocaleString('sv-SE'));
    return row.mailReceipt?.approvalUrl?'Inväntar godkännande':'Godkännandestatus saknas för äldre utskick';
  }
  const approvalRequests=new Set();
  async function refreshApprovals(id) {
    const row=orders().find(order=>order.id===id);
    const version=row?.mailReceipt?.approvalId;
    if(!row?.mailReceipt?.approvalUrl||approvalRequests.has(id))return;
    approvalRequests.add(id);
    try {
      const response=await fetch('/api/order-approval?id='+encodeURIComponent(version),{cache:'no-store',signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'Godkännanden kunde inte hämtas.');
      const parse=value=>{
        if(!value)return null;
        const receipt=JSON.parse(value);
        if(receipt.version!==version||!Number.isFinite(Date.parse(receipt.at))||typeof receipt.name!=='string')throw Error('Godkännandets dokumentversion kunde inte verifieras.');
        return receipt;
      };
      const approvals={order:parse(data.order_signed),poa:parse(data.poa_signed)};
      const result=mutate(d=>{
        const target=d.orders.find(order=>order.id===id);
        if(!orders().some(order=>order.id===id)||target?.mailReceipt?.approvalId!==version)return {ok:false,message:'Ordern har ändrats. Öppna den igen.'};
        target.documentApprovals={order:approvals.order||target.documentApprovals?.order||null,poa:approvals.poa||target.documentApprovals?.poa||null};
        const complete=target.documentApprovals.order&&(target.mailReceipt.files.length===1||target.documentApprovals.poa);
        if(complete&&target.status==='sent'){
          const at=new Date(Math.max(Date.parse(target.documentApprovals.order.at),Date.parse(target.documentApprovals.poa?.at||target.documentApprovals.order.at))).toISOString();
          target.statusHistory=[...historyFor(target),{status:'registered',at}];
          target.status='registered';target.registeredAt=at.slice(0,10);
          target.events=[{at,text:'Registrerad automatiskt när kunden godkänt samtliga utskickade handlingar.'},...(target.events||[])];
        }
        return {ok:true};
      });
      if(!result.ok)throw Error(result.message);
      if(document.querySelector('[data-approval-order]')?.dataset.approvalOrder===id){P.render();detail(id,false);}
    } catch(error) {
      if(document.querySelector('[data-approval-order]')?.dataset.approvalOrder===id){
        const output=document.querySelector('#approval-status');
        if(output)output.textContent='Kunde inte uppdatera. Senast sparad status visas. '+error.message;
      }
    } finally {approvalRequests.delete(id);}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-approval-order]');
    if(button)refreshApprovals(button.dataset.approvalOrder);
  });
  setInterval(()=>{
    if(document.hidden)return;
    const button=document.querySelector('[data-approval-order]');
    if(button)refreshApprovals(button.dataset.approvalOrder);
  },15000);
  function detail(id,refresh=true) {
    const r=orders().find(o=>o.id===id);if(!r)return;

    const c=customers().find(c=>c.id===r.customerId);
    const history=historyFor(r);
    P.openDialog('Order · '+statuses[r.status],`<div class="ow-form">${mailPanel(r)}${!r.mailAttempt&&(r.status==='draft'||P.prototypeUsers?.canManage())?`<button class="btn btn-primary" data-ow-edit="${e(id)}">${r.status==='draft'?'Redigera utkast':'Rätta order'}</button>`:''}${P.prototypeUsers?`<p>Ansvarig: <strong>${e(P.prototypeUsers.ownerName(r))}</strong></p>${P.prototypeUsers.canManage()?`<button class="btn btn-secondary" data-pu-assign="${e(id)}">Omfördela order</button>`:''}`:''}<h3>${e(c?.name||'Kund saknas')}</h3><p>${e(r.product)} · ${e(r.id)}</p><dl class="ow-detail"><div><dt>Registrerad</dt><dd>${date(r.registeredAt)}</dd></div><div><dt>Önskad start</dt><dd>${date(r.startDate)}</dd></div><div><dt>Avtalstid</dt><dd>${e(termLabel(r))}</dd></div><div><dt>Total årsvolym</dt><dd>${volumeLabel(r)}</dd></div></dl>${P.productCatalog?.savedPrice(r)||''}${r.facilities.map((f,i)=>`<section class="card ow-rule"><h4>Anläggning ${i+1}</h4><p>${e(f.installationId)} · ${e(f.area)}${f.network?' · '+e(f.network):''}<br>${fmt(Number(f.annualKwh))} kWh/år</p>${profiled.has(r.product)?`<p>${months.map((m,n)=>`${m}: ${fmt(Number(f.profile[n]))} kWh`).join(' · ')}</p>`:''}</section>`).join('')}${flowPosition(r)===null?'<p class="ow-notice">Okänd bortfallsfas: underlaget räcker inte för att placera bortfallet mellan två steg. Ordern finns i totalen men utanför det avstämda flödet. Sparad historik är oförändrad.</p>':''}<section class="ow-status-history"><h3>Statushistorik</h3><ol>${history.map(h=>`<li><strong>${historyLabels[h.status]}${issueReasons[h.reason]?`<small class="ow-history-reason">Orsak: ${issueReasons[h.reason]}</small>`:''}</strong><time datetime="${e(h.at)}">${h.at.includes('T')?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',dateStyle:'medium',timeStyle:'short'}).format(new Date(h.at)):date(h.at)}</time></li>`).join('')||'<li>Inga daterade statussteg finns sparade.</li>'}</ol>${history.some(h=>h.status===r.status)?'':`<p>Aktuell status: ${statuses[r.status]} · Datum saknas i äldre underlag.</p>`}<p class="muted">Endast sparade datum visas. Övriga äldre mellanled, exempelvis datum för skickad orderbekräftelse, kan saknas. Tidigare Bekräftad och Väntar på avtalsstart räknas nu som Bindande avtal. Äldre steg visas med sina ursprungliga datum; saknat bindandedatum härleds inte från väntestatusen.</p></section>${!P.prototypeUsers||P.prototypeUsers.internal()?'<h3>Simulera nästa status</h3><p>Kraftringens lokala demohandläggning. Inga verkliga utskick görs.</p>':'<p>Kraftringen hanterar orderns status.</p>'}<div class="ow-actions">${(!P.prototypeUsers||P.prototypeUsers.internal()?transitions[r.status]:[]).map(s=>`<button class="btn btn-secondary" data-ow-transition="${s}" data-order="${e(id)}">${statuses[s]} · demo</button>`).join('')||'<span>Inga ytterligare statussteg.</span>'}</div><details><summary>Övrig händelselogg</summary><ul>${(r.events||[]).map(ev=>`<li>${e(ev.text)} <small>${e(ev.at.slice(0,10))}${ev.actor?' · '+e(P.prototypeUsers?.users().find(u=>u.id===ev.actor)?.name||ev.actor):''}</small>${ev.changes?`<ul>${Object.entries(ev.changes).map(([key,v])=>`<li>${e({customerId:'Kund',startDate:'Önskad start',termType:'Avtalstid',termMonths:'Antal månader',facilities:'Anläggningar'}[key]||key)}: ${e(key==='facilities'?`${v.before?.length||0} anläggningar uppdaterades till ${v.after?.length||0} anläggningar (detaljer sparade i händelseloggen)`:key==='customerId'?`${customers().find(c=>c.id===v.before)?.name||'—'} → ${customers().find(c=>c.id===v.after)?.name||'—'}`:`${v.before??'—'} → ${v.after??'—'}`)}</li>`).join('')}</ul>`:''}</li>`).join('')}</ul></details></div>`);
    if(refresh)refreshApprovals(id);
  }
  function enable(value) {
    if(P.prototypeUsers&&!value)return;
    enabled=value;try{localStorage.setItem('partnerlabb.orders.enabled',String(value));}catch{P.toast('Vyn gäller bara denna session; inställningen kunde inte sparas.');}
    const url=new URL(location.href);url.searchParams.set('proposal',value?'orders':'legacy');history.replaceState(null,'',url);
  }
  function login() {
    if(P.prototypeUsers)return P.prototypeUsers.login();
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
    const b=ev.target.closest('[data-ow-send],[data-ow-view],[data-ow-partner],[data-ow-entry],[data-ow-login],[data-ow-legacy],[data-ow-customer],[data-ow-order],[data-ow-cancel],[data-ow-status],[data-ow-stage],[data-ow-edit],[data-ow-row],[data-ow-open],[data-ow-transition]');if(!b)return;
    if(b.hasAttribute('data-ow-view')){flowView=b.dataset.owView==='steps'?'steps':'waterfall';P.render();document.querySelector(`[data-ow-view="${flowView}"]`)?.focus();return;}
    if(b.hasAttribute('data-ow-partner')){if(sales(b.dataset.owPartner)){enable(true);P.previewPartner(b.dataset.owPartner);}return;}
    if(b.hasAttribute('data-ow-entry')||b.hasAttribute('data-ow-login'))return login();
    if(b.hasAttribute('data-ow-legacy')){enable(false);P.go('overview');P.toast('Tidigare vy återställd. Dina testordrar och kunder är kvar till nästa gång du provar förslaget.');return;}
    if(b.hasAttribute('data-ow-cancel'))return P.closeDialog();
    if(!enabled||!inScope(P.partner))return;
    if(b.hasAttribute('data-ow-customer'))return customerDialog(b.dataset.owCustomer);
    if(b.hasAttribute('data-ow-order'))return orderDialog();
    if(b.hasAttribute('data-ow-send'))return sendMail(b.dataset.owSend,b);
    if(b.hasAttribute('data-ow-edit'))return orderDialog(b.dataset.owEdit);
    if(b.hasAttribute('data-ow-stage')){filter().status='stage:'+b.dataset.owStage;P.render();const list=document.querySelector('#ow-order-list');list?.setAttribute('tabindex','-1');list?.focus();list?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.hasAttribute('data-ow-row'))return detail(b.dataset.owRow);
    if(b.hasAttribute('data-ow-status')){filter().status=b.dataset.owStatus;P.render();const list=document.querySelector('#ow-order-list');list?.setAttribute('tabindex','-1');list?.focus();list?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.hasAttribute('data-ow-open'))return detail(b.dataset.owOpen);
    if(b.hasAttribute('data-ow-transition')){if(['cannot_confirm','needs_completion'].includes(b.dataset.owTransition))return issueDialog(b.dataset.order,b.dataset.owTransition);if(!confirm(b.dataset.owTransition==='registered'?'Bekräftar du att offerten och eventuell fullmakt är kompletta och godkända? Simulera därefter Kraftringens mottagning. Detta är inte en CRM-kvittens.':`Simulera ${statuses[b.dataset.owTransition]} för denna exempelorder?`))return;const result=setStatus(b.dataset.order,b.dataset.owTransition,b.dataset.owTransition==='registered'?'complete-demo-receipt':'');if(!result.ok)return P.toast(result.message);P.render();detail(b.dataset.order);}
  });
  document.addEventListener('DOMContentLoaded',()=>{installExamples();if(!enabled||P.demoMode||P.prototypeUsers)return;const params=new URLSearchParams(location.search);if(params.has('workspace')||params.has('partner')||params.has('movein'))return;let id;try{id=localStorage.getItem('partnerlabb.orders.identity');}catch{}if(sales(id))P.previewPartner(id);else if(params.get('proposal')==='orders')login();});
  P.orderWorkspace={sendMail,assignOrder,allOrders:()=>!P.prototypeUsers||P.prototypeUsers.internal()?allOrders():orders(),startProductOrder:preset=>{if(!inScope(P.partner)||P.demoMode)return;enable(true);orderDialog(undefined,preset);},statuses,products,customers,orders,saveCustomer,saveOrder,setStatus,matchPeriod,isoWeek,commission,enable,login,healthy,annualVolume,termLabel,reached,flowPosition,matchesFlow,flowSummary,historyFor,extraExamples,installExamples};
})();
