(() => {
  const P=window.Portal;
  if(!P||P.demoMode)return;
  const e=P.e,A=P.prototypeUsers,departments=['Utbildning','Omsorg','Teknik & fastighet'];
  const contracts=[
    {id:'DEMO-FIB-101',name:'Fiberanslutning',department:'Utbildning',place:'Exempelskolan',start:'2025-01-01',term:'Löpande enligt demoavtal',contact:'Kim Fiber'},
    {id:'DEMO-IOT-201',name:'IoT · inomhusmiljö',department:'Utbildning',place:'Exempelskolan',start:'2026-01-01',term:'24 månader · fiktivt exempel',contact:'Robin IoT'},
    {id:'DEMO-IOT-202',name:'IoT · läckageövervakning',department:'Omsorg',place:'Exempelboendet',start:'2026-03-01',term:'24 månader · fiktivt exempel',contact:'Robin IoT'},
    {id:'DEMO-FIB-102',name:'Fiber och kommunikation',department:'Teknik & fastighet',place:'Exempeldepån',start:'2025-06-01',term:'Löpande enligt demoavtal',contact:'Kim Fiber'}
  ];
  const sensors=[
    {id:'S-101',name:'Temperatur och luftfuktighet',place:'Exempelskolan · rum 12',contract:'DEMO-IOT-201',department:'Utbildning'},
    {id:'S-102',name:'Koldioxid',place:'Exempelskolan · sal 3',contract:'DEMO-IOT-201',department:'Utbildning'},
    {id:'S-201',name:'Vattenläckage',place:'Exempelboendet · teknikrum',contract:'DEMO-IOT-202',department:'Omsorg'}
  ];
  const catalog=[
    {id:'climate',name:'Temperatur och luftfuktighet',use:'Följ inomhusmiljön i lokaler.',conditions:'Placering och täckning kontrolleras före installation.'},
    {id:'co2',name:'Koldioxid',use:'Underlag för dialog om ventilation och nyttjande.',conditions:'Placering ska vara representativ för lokalen.'},
    {id:'leak',name:'Vattenläckage',use:'Upptäck vatten vid utsatta installationer.',conditions:'Kräver överenskommen larmmottagare.'}
  ];
  const labels={department:'Förvaltning',owner:'Verksamhetsägare',manager:'Förvaltare',contract:'Avtal',challenge:'Utmaning och nuläge',today:'Dagens arbetssätt',outcome:'Önskat resultat',meeting:'Mötesönskemål',conditions:'Förutsättningar',sensor:'Sensor / tjänst',quantity:'Antal',place:'Placering',purpose:'Syfte och behov',invoice:'Fakturareferens',payer:'Betalningsansvarig',issue:'Ärendetyp',problem:'Problem',started:'När problemet uppstod',impact:'Verksamhetspåverkan',urgency:'Brådska',help:'Önskad hjälp',benefit:'Verksamhetsnytta'};
  const types={dialog:'Dialog om verksamhetsutmaning',order:'Beställning av sensor',support:'Supportärende'};
  const stages={dialog:['Inskickad','Under beredning','Möte föreslaget','Möte bokat','Fortsatt arbete','Avslutad'],order:['Inskickad','Behöver granskas','Mottagen','Bekräftad','Installation planerad','Levererad','Avslutad'],support:['Inskickat','Mottaget','Felsökning pågår','Väntar på komplettering','Åtgärdat','Avslutat']};
  const customer=()=>A.current()?.role.startsWith('customer');
  const department=()=>A.current()?.department||'Utbildning';
  const allDepartments=()=>A.internal()||A.current()?.role==='customer_admin';
  const visible=row=>allDepartments()||row.department===department();
  const canSee=row=>A.internal()||customer()&&visible(row)&&(A.current().role!=='customer'||row.createdBy===A.current().id);
  const store=()=>P.state.customerServices;
  const cases=()=>Array.isArray(store()?.cases)?store().cases:[];
  let stale=false;
  window.addEventListener('storage',event=>{if(event.key==='partnerlabb.portal.v2')stale=true;});
  function save(change){
    if(stale){P.toast('En annan flik har uppdaterat underlaget. Ladda om före ändringen.');return false;}
    if(store()!==undefined&&!Array.isArray(store()?.cases)){P.toast('Ärendeunderlaget kan inte läsas.');return false;}
    const before=store(),next=JSON.parse(JSON.stringify(before||{cases:[]}));
    change(next);P.state.customerServices=next;
    if(P.save())return true;
    if(before===undefined)delete P.state.customerServices;else P.state.customerServices=before;
    P.toast('Kunde inte spara. Tidigare uppgifter är kvar.');return false;
  }
  const button=(label,attrs)=>'<button class="btn btn-secondary" '+attrs+'>'+e(label)+'</button>';
  const field=(name,label,value='',type='text')=>'<label class="ow-field">'+e(label)+'<input name="'+name+'" type="'+type+'" value="'+e(value)+'" required maxlength="1000"></label>';
  const area=(name,label)=>'<label class="ow-field">'+e(label)+'<textarea name="'+name+'" required maxlength="3000"></textarea></label>';
  const select=(name,label,values,value='')=>'<label class="ow-field">'+e(label)+'<select name="'+name+'">'+values.map(v=>'<option '+(v===value?'selected':'')+'>'+e(v)+'</option>').join('')+'</select></label>';
  const heading=title=>'<div class="ow-page"><span class="eyebrow">EXEMPELKÖPINGS KOMMUN · FIKTIV DEMO</span><h1>'+e(title)+'</h1><p>Avtal, personer och verksamheter är påhittade. Ärenden sparas i denna webbläsare och kan provas från kundens och handläggarens demokonton.</p>';
  function caseList(compact=false){
    const all=cases().filter(canSee);const rows=compact?all.filter(r=>r.status!=='Avslutad').slice(0,3):all;
    return '<section class="card"><div class="cs-section-head"><h2>'+(compact?'Senaste öppna ärenden':'Pågående och avslutade ärenden')+'</h2>'+(compact?button('Visa alla ärenden','data-go="customer-cases"'):customer()?button('Skapa nytt kundärende','data-cs-create'):'')+'</div>'+ (rows.length?'<div class="table-wrap"><table><thead><tr><th>Ärende</th><th>Förvaltning</th><th>Status</th><th>Nästa steg</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><button class="text-button" data-cs-open="'+e(r.id)+'">'+e(r.id)+' · '+e(types[r.type])+'</button></td><td>'+e(r.department)+'</td><td>'+e(r.status)+'</td><td>'+e(r.next)+'</td></tr>').join('')+'</tbody></table></div>':'<p>Inga ärenden i ditt urval ännu. Skapa en förfrågan för att prova flödet.</p>')+'</section>';
  }
  function home(){
    const agreements=contracts.filter(visible),open=cases().filter(canSee).filter(row=>row.status!=='Avslutad');
    return `<div class="ow-page cs-home"><section class="cs-welcome"><div><span class="cs-kicker">MIN KUNDPORTAL · EXEMPELKÖPINGS KOMMUN</span><h1>Välkommen, ${e(A.current()?.name)}!</h1><p>Här samlar du dina avtal, beställningar och kontakten med oss.</p><span class="cs-department">${e(department())}</span></div><img src="assets/brand/logo-white.png" alt="Kraftringen" width="234" height="40"></section>
      <div class="cs-overview"><div><strong>${agreements.length}</strong><span>Aktiva avtal och tjänster</span></div><div><strong>${open.length}</strong><span>Öppna ärenden i ditt urval</span></div><button class="btn btn-primary" data-cs-create>＋ Skapa nytt kundärende</button></div>
      <div class="cs-actions">${[['dialog','Boka en dialog','Berätta om en utmaning i verksamheten. Vi hjälper dig att hitta nästa steg.','users'],['order','Beställ utrustning','Utforska sensorer och tjänster för din verksamhet.','file'],['support','Få hjälp och support','Anmäl ett problem med en sensor eller tjänst och följ återkopplingen.','help']].map(([id,label,description,icon])=>`<article class="card cs-action"><span class="cs-icon">${P.icon(icon)}</span><h2>${label}</h2><p>${description}</p>${button(id==='order'?'Visa utbudet':label,id==='order'?'data-go="customer-catalog"':'data-cs-new="'+id+'"')}</article>`).join('')}</div>
      <section class="card cs-agreements"><div class="cs-section-head"><div><span class="eyebrow">DIN ÖVERSIKT</span><h2>Avtal och tjänster</h2></div>${button('Visa avtalsdetaljer','data-go="customer-contracts"')}</div><div class="table-wrap"><table><thead><tr><th>Tjänst / avtal</th><th>Förvaltning och plats</th><th>Status</th><th>Kontakt</th><th></th></tr></thead><tbody>${agreements.map(c=>`<tr><td><strong>${e(c.name)}</strong><small class="ow-id">${e(c.id)}</small></td><td>${e(c.department)}<small class="ow-id">${e(c.place)}</small></td><td><span class="cs-active">Aktivt</span></td><td>${e(c.contact)}</td><td>${button('Nytt ärende','data-cs-create data-contract="'+e(c.id)+'"')}</td></tr>`).join('')}</tbody></table></div></section>
      ${caseList(true)}<section class="card cs-technical"><h2>Fakturor och energiförbrukning</h2><p>Dessa tjänster finns i den tekniska kundportalen. Länken läggs till inför pilot.</p></section><p class="cs-demo-note">Fiktiv kundorganisation och exempelavtal. Ärenden sparas i denna webbläsare.</p></div>`;
  }
  function chooseCase(contractId=''){
    if(!customer())return;
    P.openDialog('Skapa nytt kundärende','<div class="ow-form"><p>Vad vill du ha hjälp med?</p>'+Object.entries(types).map(([id,label])=>button(label,'data-cs-new="'+id+'" data-contract="'+e(contractId)+'"')).join('')+'</div>');
  }
  function agreementView(){
    return heading('Avtal & tjänster')+contracts.filter(visible).map(c=>'<section class="card"><span class="pill">Aktivt · demo</span><h2>'+e(c.name)+'</h2><p>'+e(c.id)+' · '+e(c.department)+' · '+e(c.place)+'</p><p>Start '+e(c.start)+' · '+e(c.term)+'</p><p>Kontakt hos Kraftringen: '+e(c.contact)+'</p><details><summary>Avtalsöversikt och utrustning</summary><p>Fiktivt avtalsunderlag för '+e(c.name)+'. Pris och fullständiga avtalsvillkor fastställs inför pilot.</p>'+sensors.filter(s=>s.contract===c.id).map(s=>'<p>'+e(s.id)+' · '+e(s.name)+' · '+e(s.place)+'</p>').join('')+'</details><div class="ow-actions">'+['dialog','order','support'].map(t=>button({dialog:'Boka dialog',order:'Beställ tillägg',support:'Skapa supportärende'}[t],'data-cs-new="'+t+'" data-contract="'+c.id+'"')).join('')+'</div></section>').join('')+'</div>';
  }
  function catalogView(){return heading('Beställ utrustning och tjänster')+'<p>Priser lämnas i offert. Ett inskickat önskemål följs av kontroll och bekräftelse.</p>'+catalog.map(c=>'<section class="card"><h2>'+e(c.name)+'</h2><p>'+e(c.use)+'</p><p>'+e(c.conditions)+'</p>'+button('Beställ / begär offert','data-cs-new="order" data-product="'+c.name+'"')+'</section>').join('')+'</div>';}
  function newCase(type,contractId='',product=''){
    if(!customer()||!types[type])return;
    const contract=contracts.find(c=>c.id===contractId&&visible(c));
    const depts=allDepartments()?departments:[department()];
    const common=select('department','Beställande förvaltning',depts,contract?.department||department())+field('owner','Verksamhetsägare',A.current().name)+field('manager','Förvaltare / ansvarig kontakt',A.current().name)+select('contract','Berört avtal',['Ej valt',...contracts.filter(visible).map(c=>c.id)],contract?.id);
    const fields=type==='dialog'?area('challenge','Vad vill ni förbättra? Beskriv utmaningen och nuläget')+area('today','Hur hanteras utmaningen i dag?')+area('outcome','Vilket resultat vill ni uppnå?')+field('meeting','Önskemål om mötestid och deltagare')+area('conditions','Övriga förutsättningar (skriv Inga om det saknas)'):
      type==='order'?select('sensor','Sensortyp',catalog.map(c=>c.name),product)+field('quantity','Antal','1','number')+field('place','Önskad placering')+area('purpose','Syfte och behov')+field('invoice','Fakturareferens')+field('payer','Betalningsansvarig'):
      select('sensor','Berörd sensor eller tjänst',['Annan tjänst',...sensors.filter(visible).map(s=>s.id+' · '+s.name+' · '+s.place)])+field('place','Placering')+select('issue','Typ av ärende',['Driftstörning','Kommunikationsproblem','Felaktiga mätvärden','Behörighetsproblem','Annat'])+area('problem','Beskriv problemet')+field('started','När uppstod problemet?','', 'datetime-local')+area('impact','Påverkan på verksamheten')+select('urgency','Brådska',['Normal','Hög','Akut verksamhetspåverkan'])+area('help','Önskad hjälp eller åtgärd');
    P.openDialog(types[type],'<form id="cs-form" class="ow-form"><div class="ow-grid">'+common+fields+area('benefit','Förväntad verksamhetsnytta')+'</div><p role="alert"></p><button class="btn btn-primary">Skicka in · demo</button></form>',()=>{
      const form=document.querySelector('#cs-form');
      form.onsubmit=event=>{
        event.preventDefault();const values=Object.fromEntries(new FormData(form));
        if(type==='order'&&(!Number.isInteger(Number(values.quantity))||Number(values.quantity)<1||Number(values.quantity)>10000)){form.querySelector('[role="alert"]').textContent='Ange ett helt antal mellan 1 och 10 000.';return;}
        const at=new Date().toISOString(),id='KUND-'+P.newId();
        const duplicate=type==='order'&&cases().some(r=>r.type==='order'&&r.department===values.department&&r.fields.sensor===values.sensor&&r.fields.place===values.place&&r.status!=='Avslutad');
        const flags=type==='order'?[...(Number(values.quantity)>20?['Fler än 20 sensorer – illustrativ granskningsgräns']:[]),...(duplicate?['Möjlig dubbelbeställning']:[])]:[];
        const row={id,type,department:values.department,createdBy:A.current().id,fields:values,status:flags.length?'Behöver granskas':stages[type][0],flags,next:flags.length?'Kraftringen granskar avvikelsen':type==='dialog'?'Kraftringen föreslår möte':type==='order'?'Kraftringens ordermottagning tar emot':'Kommunens handläggare bedömer och vidarebefordrar · demo',timeline:[{at,actor:A.current().name,text:'Ärendet inskickat. '+(type==='support'?'Simulerad registrering i kommunens Dynamics.':'')}],municipalRef:type==='support'?'DYN-DEMO-'+Date.now():'',supportRef:''};
        if(save(d=>d.cases.push(row))){P.closeDialog();P.go('customer-cases');P.toast('Ärendet sparat i demoflödet.');}
      };
    });
  }
  function detail(id){
    const row=cases().find(r=>r.id===id&&canSee(r));if(!row)return;
    P.openDialog(types[row.type]+' · '+row.status,'<div class="ow-form"><p>'+e(row.id)+' · '+e(row.department)+'</p><p><strong>Nästa steg</strong> '+e(row.next)+'</p>'+row.flags.map(f=>'<p class="ow-notice">'+e(f)+'</p>').join('')+(row.municipalRef?'<p>Kommunens referens: '+e(row.municipalRef)+' · Kraftringens referens: '+e(row.supportRef||'Inväntar vidarebefordran')+'</p>':'')+'<details><summary>Inskickade uppgifter</summary>'+Object.entries(row.fields).map(([key,value])=>'<p><strong>'+e(labels[key]||key)+'</strong> '+e(value)+'</p>').join('')+'</details><h3>Återkoppling och historik</h3><ol>'+row.timeline.map(t=>'<li>'+e(t.text)+'<br><small>'+e(t.actor)+' · '+e(new Date(t.at).toLocaleString('sv-SE'))+'</small></li>').join('')+'</ol><form id="cs-reply">'+area('message','Meddelande / komplettering')+(A.internal()?select('status','Status',stages[row.type],row.status)+field('next','Nästa steg och ansvarig',row.next)+field('meeting','Mötesinformation eller ansvarig handläggare','Ej bokat'):'')+'<button class="btn btn-primary">Spara återkoppling · demo</button></form></div>',()=>{
      document.querySelector('#cs-reply').onsubmit=event=>{
        event.preventDefault();const values=Object.fromEntries(new FormData(event.target));
        if(save(d=>{const r=d.cases.find(c=>c.id===id);r.timeline.push({at:new Date().toISOString(),actor:A.current().name,text:values.message+(values.meeting?' · '+values.meeting:'')});if(A.internal()){r.status=values.status;r.next=values.next;if(r.type==='support'&&r.status!=='Inskickat')r.supportRef=r.supportRef||'KF-DEMO-'+Date.now();}})){P.closeDialog();P.render();detail(id);}
      };
    });
  }
  P.register('customer-home',{render:()=>customer()?home():''});
  P.register('customer-contracts',{render:()=>customer()?agreementView():''});
  P.register('customer-catalog',{render:()=>customer()?catalogView():''});
  P.register('customer-cases',{render:()=>customer()||A.internal()?heading(A.internal()?'Kundärenden · handläggning':'Mina ärenden')+caseList()+'</div>':''});
  document.addEventListener('click',event=>{const b=event.target.closest('[data-cs-new],[data-cs-open],[data-cs-create]');if(!b)return;if(b.hasAttribute('data-cs-create'))return chooseCase(b.dataset.contract);if(b.dataset.csNew)newCase(b.dataset.csNew,b.dataset.contract,b.dataset.product);else detail(b.dataset.csOpen);});
})();
