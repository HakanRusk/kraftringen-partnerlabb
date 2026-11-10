(() => {
  'use strict';
  const P=window.Portal;
  if(!P||P.demoMode)return; // The separate resident demo keeps its own isolated state.
  const e=P.e, sessionKey='partnerlabb.demo-user.v1';
  const roles={admin:'Kraftringen · administratör',internal:'Kraftringen · handläggare',manager:'Partner · säljledare',seller:'Partner · säljare',customer:'Kund · användare',customer_manager:'Kund · förvaltningsansvarig',customer_admin:'Kund · administratör'};
  const seed=[{id:'demo-admin',name:'Kim Admin',email:'admin@kraftringen.example',role:'admin',partner:'',active:true},{id:'demo-internal',name:'Robin Handläggare',email:'handlaggare@kraftringen.example',role:'internal',partner:'',active:true},...['vast','syd'].flatMap(partner=>[
    {id:`demo-${partner}-manager`,name:partner==='vast'?'Alex Säljledare':'Sam Säljledare',email:`ledare@${partner}.example`,role:'manager',partner,active:true},
    ...['1','2','3'].map((n,i)=>({id:`demo-${partner}-seller-${n}`,name:['Charlie Exempel','Dani Exempel','Elli Exempel'][i],email:`saljare${n}@${partner}.example`,role:'seller',partner,active:true}))])];
  const customerSeeds=[
    {id:'demo-customer',name:'Alex Kund',email:'alex@exempelkommun.example',role:'customer',partner:'',department:'Utbildning',active:true},
    {id:'demo-customer-manager',name:'Sam Förvaltning',email:'sam@exempelkommun.example',role:'customer_manager',partner:'',department:'Utbildning',active:true},
    {id:'demo-customer-admin',name:'Robin Kundadmin',email:'robin@exempelkommun.example',role:'customer_admin',partner:'',department:'Alla förvaltningar',active:true}
  ];
  const baseUsers=()=>P.state.prototypeAccess===undefined?seed:Array.isArray(P.state.prototypeAccess?.users)?P.state.prototypeAccess.users:[];
  const users=()=>[...baseUsers(),...customerSeeds.filter(seed=>!baseUsers().some(user=>user.id===seed.id))];
  const isCustomer=()=>current()?.role.startsWith('customer');
  let externalUserChange=false;
  let userId='';try{userId=sessionStorage.getItem(sessionKey)||'';}catch{}
  const current=()=>externalUserChange?undefined:users().find(u=>u.id===userId&&u.active===true&&roles[u.role]&&(['admin','internal'].includes(u.role)||u.role.startsWith('customer')||P.getPartner(u.partner)));
  const internal=()=>['admin','internal'].includes(current()?.role);
  const admin=()=>current()?.role==='admin';
  const manageCustomerUsers=()=>current()?.role==='customer_admin';
  const canManage=()=>internal()||current()?.role==='manager';
  const commission=()=>['admin','internal','manager'].includes(current()?.role);
  const scope=partner=>!!current()&&(internal()||current().partner===partner);
  const staff=partner=>users().filter(u=>u.partner===partner&&['seller','manager'].includes(u.role));
  // Only the two known, explicitly fictional fixture packs have inferred demo owners.
  // All other historical orders remain unassigned until an authorised user assigns them.
  function owner(row){
    if(Object.hasOwn(row,'sellerId'))return row.sellerId||'';
    const n=row.examplePack==='flow2026'&&/^flow-2026-\d\d-\d\d$/.test(row.id)?Number(row.id.slice(-2)):
      row.events?.some(v=>v.text==='Fiktivt exempel för det nya orderförslaget.')&&new RegExp(`^order-demo-${row.partner}-\\d+$`).test(row.id)?Number(row.id.split('-').at(-1)):0;
    return n&&['vast','syd'].includes(row.partner)?`demo-${row.partner}-seller-${(n-1)%3+1}`:'';
  }
  const ownerName=row=>users().find(u=>u.id===owner(row))?.name||'Ej tilldelad';
  const canRead=row=>scope(row.partner)&&(current()?.role!=='seller'||owner(row)===current().id);
  const selections=new Map();
  const selected=row=>!selections.get(row.partner)?.length||selections.get(row.partner).includes(owner(row));
  const choices=(rows,value)=>rows.map(([id,label])=>`<option value="${e(id)}" ${id===value?'selected':''}>${e(label)}</option>`).join('');
  const error=message=>({ok:false,message});
  function saveUser(input,id){
    if(!admin()&&!manageCustomerUsers())return error('Du får inte ändra användare.');
    if(P.state.prototypeAccess!==undefined&&!Array.isArray(P.state.prototypeAccess?.users))return error('Användarunderlaget kan inte läsas. Inget har skrivits över.');
    const before=users().find(u=>u.id===id);
    if(id&&!before)return error('Användaren saknas.');
    const name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),role=input.role;
    if(manageCustomerUsers()&&(!role?.startsWith('customer')||before&&!before.role.startsWith('customer')))return error('Du får endast hantera kundorganisationens användare.');
    const partner=['manager','seller'].includes(role)?String(input.partner||''):'';
    if(!name||name.length>90||!roles[role])return error('Ange namn och välj roll.');
    if(!/^[^\s@]+@[^\s@]+\.example$/.test(email))return error('Använd en fiktiv e-postadress som slutar med .example i prototypen.');
    if(users().some(u=>u.id!==id&&u.email.toLowerCase()===email))return error('E-postadressen används redan.');
    if(partner&&!P.getPartner(partner)||['manager','seller'].includes(role)&&!partner)return error('Välj en partner.');
    const active=input.active!==false;
    if(before?.role==='admin'&&before.active&&(!active||role!=='admin')&&!users().some(u=>u.id!==id&&u.role==='admin'&&u.active))return error('Minst en aktiv administratör måste finnas kvar.');
    if(before&&before.partner!==partner&&P.orderWorkspace?.allOrders().some(r=>owner(r)===id))return error('Omfördela användarens ordrar innan du byter partner eller till en intern roll.');
    const value={id:before?.id||'user-'+P.newId(),name,email,role,partner,active,...(role.startsWith('customer')?{department:['Utbildning','Omsorg','Teknik & fastighet'].includes(input.department)?input.department:before?.department||'Utbildning'}:{})};
    const previous=P.state.prototypeAccess;
    P.state.prototypeAccess={version:1,users:users().filter(u=>u.id!==id).map(u=>({...u})).concat(value),audit:[{at:new Date().toISOString(),actor:current().id,userId:value.id,before:before?{...before}:null,after:{...value}},...(previous?.audit||[])]};
    if(!P.save()){if(previous===undefined)delete P.state.prototypeAccess;else P.state.prototypeAccess=previous;return error('Användaren kunde inte sparas. Tidigare uppgifter är kvar.');}
    return {ok:true,id:value.id};
  }
  function signIn(id){
    if(externalUserChange)return error('Användare har ändrats i en annan flik. Ladda om sidan innan du väljer konto.');
    const next=users().find(u=>u.id===id&&u.active);
    if(!next||!roles[next.role]||(['seller','manager'].includes(next.role)&&!P.getPartner(next.partner)))return error('Demokontot är inaktivt eller saknar partner.');
    userId=id;selections.clear();try{sessionStorage.setItem(sessionKey,id);}catch{P.toast('Demoinloggningen gäller tills sidan laddas om.');}
    P.closeDialog();P.orderWorkspace?.enable(true);P.role=internal()?'internal':'partner';P.partner=next.partner||P.partner;delete P.selectedPartnerId;P.go(isCustomer()?'customer-home':'overview');return {ok:true};
  }
  function signOut(){userId='';selections.clear();try{sessionStorage.removeItem(sessionKey);}catch{}P.closeDialog();P.go('demo-login');}
  const partnerPages=new Set(['overview','sales-partner-overview','order-list','order-customers','products','product-facts','academy','academy-library','support']);
  function allowed(page){
    if(['demo-login','test-users','portal-contact'].includes(page))return true;
    if(!current())return false;
    if(manageCustomerUsers()&&page==='user-admin')return true;
    if(isCustomer())return ['customer-home','customer-contracts','customer-cases','customer-catalog'].includes(page);
    if(['user-admin','product-access','settings'].includes(page))return admin();
    if(internal())return true;
    if(partnerPages.has(page))return true;
    if(current().role==='manager'&&['order-commission','crm','crm-customers','crm-pipeline','crm-activities'].includes(page))return true;
    // Non-sales partners retain their own existing workflows, never other partners' views.
    return current().role==='manager'&&P.getPartner(current().partner)?.type==='property'&&['property-partnership','property-default','property-overview','movein','property-registrations','property-intake','property-manual','property-import','property-results'].includes(page);
  }
  function enforce(){if(!current()){if(!allowed(P.page))P.page='demo-login';return;}if(!internal()){P.role='partner';P.partner=current().partner;delete P.selectedPartnerId;}if(!allowed(P.page))P.page=isCustomer()?'customer-home':'overview';}
  const originalGo=P.go,originalRender=P.render,originalPreview=P.previewPartner,originalReturn=P.returnInternal;
  P.go=P.navigate=(page,options)=>{enforce();return originalGo(allowed(page)?page:!current()?'demo-login':isCustomer()?'customer-home':'overview',options);};
  P.render=()=>{enforce();originalRender();decorate();};
  P.previewPartner=id=>{if(scope(id))originalPreview(id);};
  P.returnInternal=()=>{if(internal())originalReturn();};
  const oldReset=P.resetScope;P.resetScope=(...args)=>admin()?oldReset(...args):Promise.resolve(false);
  const oldSetupOpen=P.partnerSetup.open;P.partnerSetup.open=(...args)=>{if(admin())oldSetupOpen(...args);else P.toast('Endast administratören får ändra partners.');};
  function decorate(){
    const u=current();document.body.classList.toggle('pu-logged-out',!u);
    document.querySelector('.role-picker').hidden=!internal();
    document.querySelectorAll('[data-ow-legacy],[data-ow-entry],[data-ow-login]').forEach(n=>n.hidden=true);
    document.querySelector('#return-internal').hidden=!internal()||P.role==='internal';
    document.querySelectorAll('.profile strong,.sidebar-user strong').forEach(n=>n.textContent=u?.name||'Välkommen');
    document.querySelector('#profile-role').textContent=u?roles[u.role]:'Lokal prototyp';
    document.querySelector('#sidebar-view-label').textContent=u?roles[u.role]:'Inte demoinloggad';
    document.querySelectorAll('[data-go]').forEach(n=>{if(!allowed(n.dataset.go))n.hidden=true;});
    document.querySelector('#notifications').hidden=!internal();
    document.querySelectorAll('[data-partner-create],[data-partner-edit],#new-partner,[data-partner-setup],#partner-settings,#partner-setup-new').forEach(n=>n.hidden=!admin());
    let button=document.querySelector('#pu-account');if(!button){button=document.createElement('button');button.id='pu-account';button.className='btn btn-secondary';document.querySelector('.top-actions').prepend(button);}
    button.textContent=u?'Logga ut':'Logga in';button.onclick=signOut;
    const banner=document.querySelector('.demo-badge');if(banner)banner.textContent='PROTOTYP · LOKAL DEMOINLOGGNING';
    if(admin()||manageCustomerUsers()){const n=document.createElement('button');n.className='nav-button'+(P.page==='user-admin'?' active':'');n.dataset.go='user-admin';n.setAttribute('aria-current',P.page==='user-admin'?'page':'false');n.innerHTML=P.icon('users')+'<span>Användare & roller</span>';document.querySelector('#nav').append(n);}
    if(isCustomer()){
      document.querySelector('#nav').innerHTML=[['customer-home','Min kundportal'],['customer-contracts','Avtal & tjänster'],['customer-catalog','Beställ'],['customer-cases','Mina ärenden'],...(manageCustomerUsers()?[['user-admin','Användare']]:[])].map(([id,label])=>`<button class="nav-button" data-go="${id}">${e(label)}</button>`).join('');
      document.querySelector('#current-page').textContent='Exempelköpings kommun';
      document.querySelector('.sidebar-support').hidden=true;
    }else document.querySelector('.sidebar-support').hidden=false;
    if(internal()){const n=document.createElement('button');n.className='nav-button';n.dataset.go='customer-cases';n.textContent='Kundärenden · demo';document.querySelector('#nav').append(n);}
    if(!u){document.querySelector('#nav').innerHTML='';document.querySelectorAll('.ow-tabs').forEach(n=>n.remove());}
    if(P.page==='user-admin')document.querySelector('#current-page').textContent='Användare & roller';
    document.querySelectorAll('.profile .avatar,.sidebar-user .avatar').forEach(n=>n.textContent=u?u.name.split(/\s+/).slice(0,2).map(x=>x[0]).join(''):'DE');
  }
  function testUsersView(){if(externalUserChange)return '<div class="pu-login"><h1>Demokonton har uppdaterats.</h1><p>En annan flik har ändrat användare eller roller. Ladda om sidan för att använda aktuella konton.</p><button class="btn btn-primary" data-pu-reload>Ladda om</button></div>';return `<div class="pu-login"><span class="eyebrow">KRAFTRINGEN PARTNERLABB / PROTOTYP</span><button class="text-button" data-go="demo-login">← Till inloggningen</button><h1>Testanvändare</h1><p>Prova portalen som handläggare, administratör, säljledare eller säljare. Ingen anslutning till Microsoft eller e-post görs.</p><div class="pu-login-grid">${users().filter(u=>u.active).map(u=>`<button type="button" class="card pu-login-card" data-pu-login="${e(u.id)}"><span class="pill">${e(roles[u.role])}</span><strong>${e(u.name)}</strong><span>${e(u.role.startsWith('customer')?'Exempelköpings kommun':P.getPartner(u.partner)?.name||'Kraftringen')}</span><small>${e(u.email)}</small><span class="pu-enter">Öppna demokonto →</span></button>`).join('')}</div><p class="ow-notice">Enbart fiktiva testuppgifter. Konton och ändringar sparas i denna webbläsare. Kontoväljaren simulerar roller och är ingen säker inloggning. Portalens privata åtkomst ligger kvar separat.</p></div>`;}
  function loginView(){
    if(externalUserChange)return testUsersView();
    return `<div class="pu-entry"><section class="pu-entry-hero"><img src="assets/brand/logo-white.png" alt="Kraftringen" width="234" height="40"><span class="eyebrow">PARTNER- OCH KUNDPORTAL</span><h1>Tillsammans gör vi mer möjligt.</h1><p>En samlad plats för samarbeten, kundärenden och tjänster. Logga in för att fortsätta arbetet.</p><a href="#partnerprogram">Läs om vårt partnerprogram ↓</a></section><section class="card pu-entry-form"><span class="eyebrow">VÄLKOMMEN TILLBAKA</span><h2>Logga in</h2><p id="pu-login-help">Demoinloggning: använd en testanvändares e-postadress och lösenordet <strong>demo</strong>. Använd aldrig ditt riktiga lösenord här.</p><form id="pu-login-form"><label class="ow-field">E-postadress<input name="email" type="email" required autocomplete="off" placeholder="alex@exempelkommun.example"></label><label class="ow-field">Demolösenord<input name="password" type="password" required autocomplete="off" aria-describedby="pu-login-help"></label><p role="alert" tabindex="-1"></p><button class="btn btn-primary" type="submit">Logga in</button></form><button class="text-button" data-go="test-users">Testanvändare →</button><hr><h3>Saknar du konto?</h3><p>Kontakta Kraftringen för att ansöka om tillgång. Berätta vilken organisation du tillhör och vilken roll du behöver.</p><button class="btn btn-secondary" data-entry-contact="Kontoansökan">Ansök om konto</button></section><section id="partnerprogram" class="card pu-partner-program"><span class="eyebrow">VÄX MED OSS</span><h2>Bli partner till Kraftringen</h2><p>Vi vill göra det enkelt att samarbeta kring energi och tjänster. Portalen samlar stöd för säljpartners, fastighetsbolag och arbetsgivare med personalerbjudanden.</p><div class="pu-program-grid"><div><h3>Sälj och följ upp</h3><p>Ta del av produkter och utbildning, skapa ordrar och följ resultaten.</p></div><div><h3>Förenkla vardagen</h3><p>Samla underlag och kontakter kring fastigheter och inflyttning.</p></div><div><h3>Utveckla samarbetet</h3><p>Beskriv ert behov så undersöker vi tillsammans vilken samarbetsform som passar.</p></div></div><p>Första steget är en intresseanmälan. Upplägg, tillgång och villkor bestäms i dialog med Kraftringen.</p><button class="btn btn-primary" data-entry-contact="Partnerskap">Kontakta oss om partnerskap</button></section><p class="pu-entry-note">Proof of concept · Inloggningen simulerar roller. Testdata sparas i denna webbläsare. Portalens privata åtkomst gäller separat.</p></div>`;
  }
  let contactType='Kontoansökan';
  function contactView(){return `<div class="pu-login pu-contact"><button class="text-button" data-go="demo-login">← Till inloggningen</button><h1>Kontakta Kraftringen</h1><p>Ansök om ett konto eller anmäl intresse för ett partnerskap.</p><p class="ow-notice">Demoformulär: endast fiktiva uppgifter. Förfrågan sparas lokalt och visas för administratörens testkonto i samma webbläsare. Inget mejl skickas och ingen återkoppling sker utanför demon.</p><form id="pu-contact-form" class="card ow-form"><label class="ow-field">Vad gäller din förfrågan?<select name="type">${choices(['Kontoansökan','Partnerskap'].map(v=>[v,v]),contactType)}</select></label><label class="ow-field">Namn<input name="name" required maxlength="90"></label><label class="ow-field">Organisation<input name="organisation" required maxlength="120"></label><label class="ow-field">Fiktiv e-postadress<input name="email" type="email" required placeholder="namn@organisation.example"></label><label class="ow-field">Beskriv behov och önskad roll<textarea name="message" required maxlength="2000"></textarea></label><p role="alert" tabindex="-1"></p><button class="btn btn-primary" type="submit">Spara förfrågan · demo</button></form></div>`;}
  function enquiriesView(){return !admin()?'':`<section class="card ow-rule"><h2>Konto- och partnerförfrågningar · demo</h2><p>Lokalt sparade kontaktformulär. Inga mejl har skickats.</p>${(P.state.portalEnquiries||[]).map(r=>`<details><summary>${e(r.type)} · ${e(r.organisation)} · ${e(r.name)}</summary><p>${e(r.email)} · ${e(r.at)}</p><p style="white-space:pre-wrap">${e(r.message)}</p></details>`).join('')||'<p>Inga förfrågningar ännu.</p>'}</section>`;}
  document.addEventListener('click',ev=>{const b=ev.target.closest('[data-entry-contact]');if(b){contactType=b.dataset.entryContact;P.go('portal-contact');}});
  document.addEventListener('submit',ev=>{
    const form=ev.target;if(!['pu-login-form','pu-contact-form'].includes(form.id))return;ev.preventDefault();
    const data=Object.fromEntries(new FormData(form)),alert=form.querySelector('[role="alert"]');
    const fail=message=>{alert.textContent=message;alert.focus();};
    if(form.id==='pu-login-form'){
      const user=users().find(u=>u.active&&u.email.toLowerCase()===data.email.trim().toLowerCase());
      if(!user||data.password!=='demo'){fail('Kontrollera testadressen och demolösenordet demo. Alla konton finns under Testanvändare.');return;}
      const result=signIn(user.id);if(!result.ok)fail(result.message);return;
    }
    if(!/^[^\s@]+@[^\s@]+\.example$/.test(data.email)||!data.name.trim()||!data.organisation.trim()||!data.message.trim()){fail('Fyll i alla fält och använd en fiktiv e-postadress som slutar med .example.');return;}
    const previous=P.state.portalEnquiries;P.state.portalEnquiries=[{...data,id:P.newId(),at:new Date().toISOString()},...(previous||[])];
    if(!P.save()){if(previous===undefined)delete P.state.portalEnquiries;else P.state.portalEnquiries=previous;fail('Förfrågan kunde inte sparas. Försök igen efter att du laddat om sidan.');return;}
    form.innerHTML='<h2 tabindex="-1">Din demoförfrågan är sparad</h2><p>Den finns under Användare & roller för Kraftringens administratör i samma webbläsare. Inget har skickats till Kraftringen.</p><button type="button" class="btn btn-secondary" data-go="demo-login">Till inloggningen</button>';form.querySelector('h2').focus();
  });
  function adminView(){return `<div class="ow-page"><span class="eyebrow">KRAFTRINGEN / ADMINISTRATION</span><div class="page-head"><h1>Användare & roller</h1><div class="ow-actions"><button class="btn btn-primary" data-pu-new>Ny användare</button><button class="btn btn-secondary" data-pu-partner>Ny partner</button></div></div><p>Fiktiva demokonton i denna webbläsare. Inaktivering behåller ordrar och historik. Inga inbjudningar eller e-postmeddelanden skickas.</p><section class="card table-wrap"><table><thead><tr><th>Användare</th><th>Roll</th><th>Partner</th><th>Status</th><th>Åtgärd</th></tr></thead><tbody>${users().filter(u=>admin()||u.role.startsWith('customer')).map(u=>`<tr><td><strong>${e(u.name)}</strong><small class="ow-id">${e(u.email)}</small></td><td>${e(roles[u.role]||'Okänd roll')}</td><td>${e(u.role.startsWith('customer')?'Exempelköpings kommun':P.getPartner(u.partner)?.name||'Kraftringen')}</td><td>${u.active?'Aktiv':'Inaktiv'}</td><td><button class="text-button" data-pu-edit="${e(u.id)}">Redigera</button></td></tr>`).join('')}</tbody></table></section><details class="card ow-rule"><summary>Ändringshistorik för användare</summary><ul>${(P.state.prototypeAccess?.audit||[]).map(a=>`<li>${e(a.at)} · ${e(a.after?.name)} · ${e(roles[a.after?.role])} · ${a.after?.active?'aktiv':'inaktiv'} · av ${e(users().find(u=>u.id===a.actor)?.name||a.actor)}</li>`).join('')||'<li>Inga lokala ändringar ännu.</li>'}</ul></details></div>`;}
  function editUser(id){if(!admin()&&!manageCustomerUsers())return;const u=users().find(x=>x.id===id)||{active:true,role:'seller',partner:'vast'};
    P.openDialog(id?'Redigera demokonto':'Nytt demokonto',`<form id="pu-user-form" class="ow-form"><div role="alert" tabindex="-1"></div><div class="ow-grid"><label class="ow-field">Namn<input name="name" required maxlength="90" value="${e(u.name||'')}"></label><label class="ow-field">Fiktiv e-postadress<input name="email" type="email" required value="${e(u.email||'')}" placeholder="namn@partner.example"></label><label class="ow-field">Roll<select name="role">${choices(Object.entries(roles).filter(([role])=>admin()||role.startsWith('customer')),u.role)}</select></label><label class="ow-field">Förvaltning för kundanvändare<select name="department">${choices(['Utbildning','Omsorg','Teknik & fastighet'].map(v=>[v,v]),u.department||'Utbildning')}</select></label><label class="ow-field" id="pu-partner-field">Partner<select name="partner">${choices(P.partnerRegistry.map(p=>[p.id,p.name]),u.partner)}</select></label></div><label><input type="checkbox" name="active" ${u.active?'checked':''}> Aktivt demokonto</label><p>Inaktivering tar inte bort tilldelade ordrar. Endast aktiv säljare eller säljledare hos samma partner kan få en ny tilldelning.</p><div class="ow-actions"><button class="btn btn-primary">Spara lokalt</button><button type="button" class="btn btn-secondary" data-ow-cancel>Avbryt</button></div></form>`,()=>{const form=document.querySelector('#pu-user-form');const update=()=>document.querySelector('#pu-partner-field').hidden=['admin','internal'].includes(form.elements.role.value);form.elements.role.onchange=update;update();form.onsubmit=ev=>{ev.preventDefault();const result=saveUser({...Object.fromEntries(new FormData(form)),active:form.elements.active.checked},id);if(!result.ok){const alert=form.querySelector('[role="alert"]');alert.textContent=result.message;alert.focus();return;}P.closeDialog();P.go('user-admin');P.toast('Demokontot har sparats lokalt.');};});
  }
  function sellerFilter(){if(!canManage())return '';const values=selections.get(P.partner)||[];return `<fieldset class="pu-seller-filter"><legend>Visa resultat och ordrar för</legend><button class="text-button" type="button" data-pu-all>Alla säljare</button>${[...staff(P.partner).map(u=>[u.id,u.name+(u.active?'':' (inaktiv)')]),['','Ej tilldelade']].map(([id,name])=>`<label><input type="checkbox" data-pu-seller="${e(id)}" ${values.includes(id)?'checked':''}> ${e(name)}</label>`).join('')}<small>${values.length?values.length+' valda':'Alla säljare, även inaktiva och ej tilldelade'}. Urvalet påverkar inte partnerns provisionsavräkning.</small></fieldset>`;}
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm'}).format(new Date());
  const dateOK=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  function bindingDate(r){const dates=[r.confirmedAt,...(r.statusHistory||[]).filter(h=>h.status==='confirmed').map(h=>h.at?.slice(0,10))].filter(dateOK);return dates.sort()[0]||'';}
  const resultPeriods=new Map();
  function resultPeriod(){if(!resultPeriods.has(P.partner))resultPeriods.set(P.partner,{mode:'month',day:today()});return resultPeriods.get(P.partner);}
  function bounds(f){const start=new Date(f.day+'T12:00:00Z'),end=new Date(start);if(!dateOK(f.day))return null;if(f.mode==='week'){start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);}if(f.mode==='month'){start.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()+1,0);}if(f.mode==='year'){start.setUTCMonth(0,1);end.setUTCMonth(11,31);}return [start.toISOString().slice(0,10),end.toISOString().slice(0,10)];}
  function salesStats(rows,f){if(f.multi?.[f.mode]?.length){const values=P.periodSet.unique(f.multi[f.mode]),points=values.map(key=>({key,count:rows.filter(r=>P.periodSet.matches(bindingDate(r),f.mode,[key])).length}));return {points,count:rows.filter(r=>P.periodSet.matches(bindingDate(r),f.mode,values)).length,range:values,unknown:rows.filter(r=>P.orderWorkspace.reached(r,'confirmed')&&!bindingDate(r)).length};}if(f.mode==='month'&&f.months?.length>1){const year=f.day.slice(0,4),keys=[...new Set(f.months)].sort().map(m=>year+'-'+m),points=keys.map(key=>({key,count:rows.filter(r=>bindingDate(r).startsWith(key)).length}));return {points,count:points.reduce((sum,p)=>sum+p.count,0),range:keys,unknown:rows.filter(r=>P.orderWorkspace.reached(r,'confirmed')&&!bindingDate(r)).length};}const range=bounds(f);if(!range)return {points:[],count:0,unknown:0,range:[]};const [start,end]=range,points=[];const d=new Date(start+'T12:00:00Z');while(d.toISOString().slice(0,10)<=end){const key=d.toISOString().slice(0,f.mode==='year'?7:10);points.push({key,count:0});if(f.mode==='year')d.setUTCMonth(d.getUTCMonth()+1);else d.setUTCDate(d.getUTCDate()+1);}let count=0;for(const row of rows){const date=bindingDate(row);if(date>=start&&date<=end){points.find(p=>p.key===date.slice(0,f.mode==='year'?7:10)).count++;count++;}}return {points,count,range,unknown:rows.filter(r=>P.orderWorkspace.reached(r,'confirmed')&&!bindingDate(r)).length};}
  function weekValue(day){
    const date=new Date(day+'T12:00:00Z');
    date.setUTCDate(date.getUTCDate()+3-(date.getUTCDay()+6)%7);
    const year=date.getUTCFullYear(),first=new Date(Date.UTC(year,0,4,12));
    return year+'-W'+String(1+Math.round((date-first)/604800000)).padStart(2,'0');
  }
  function periodPicker(f){
    if(f.mode!=='month'){const v=f.mode==='year'?f.day.slice(0,4):f.mode==='week'?weekValue(f.day):f.day;return P.periodSet.render('sales',f.mode,f.multi?.[f.mode]||[v],values=>{(f.multi||={})[f.mode]=values;f.day=P.periodSet.range(f.mode,values[0])[0];});}
    if(f.mode==='month')return `<label>År<input type="number" data-pu-year value="${e(f.day.slice(0,4))}" min="2000" max="2100" required></label>`+P.orderWorkspace.monthPicker(f.day.slice(0,4),f.months?.length?f.months:[f.day.slice(5,7)],'pu');
    const settings={day:['Datum','date',f.day],week:['Vecka','week',weekValue(f.day)],month:['Månad','month',f.day.slice(0,7)],year:['År','number',f.day.slice(0,4)]};
    const [label,type,value]=settings[f.mode];
    return `<label>${label}<input type="${type}" data-pu-period="day" value="${e(value)}" ${f.mode==='year'?'min="1000" max="9999" step="1"':''} required></label>`;
  }
  function periodDay(value,mode){
    if(mode==='month')return /^\d{4}-\d{2}$/.test(value)?value+'-01':'';
    if(mode==='year')return /^[1-9]\d{3}$/.test(value)?value+'-01-01':'';
    if(mode==='week'){
      if(!/^\d{4}-W\d{2}$/.test(value))return '';
      const date=new Date(Date.UTC(Number(value.slice(0,4)),0,4,12));
      date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7+(Number(value.slice(6))-1)*7);
      const day=date.toISOString().slice(0,10);
      return weekValue(day)===value?day:'';
    }
    return value;
  }
  function results(rows){const f=resultPeriod(),s=salesStats(rows,f),max=Math.max(1,...s.points.map(p=>p.count));const x=i=>30+i*(640/Math.max(1,s.points.length-1)),y=n=>150-n/max*115;return `<section class="card pu-results"><span class="eyebrow">${current()?.role==='seller'?'MIN FÖRSÄLJNING':'PARTNERNS FÖRSÄLJNING'}</span><div class="pu-result-head"><div><h2>Tecknade avtal</h2></div><div class="pu-period"><label>Period<select data-pu-period="mode">${choices([['day','Dag'],['week','Vecka'],['month','Månad'],['year','År']],f.mode)}</select></label>${periodPicker(f)}</div></div><div><strong class="pu-total">${s.count}</strong><span> bindande avtal under perioden</span></div><p>Period: ${f.multi?.[f.mode]?.length?e(f.multi[f.mode].map(v=>P.periodSet.label(f.mode,v)).join(', ')):f.mode==='month'?e(P.orderWorkspace.monthLabel(f.day.slice(0,4),f.months?.length?f.months:[f.day.slice(5,7)])):s.range.join(' – ')} · Räknat på dagen avtalet blev bindande. Ordrarnas registreringsperiod väljs separat nedan.</p>${(f.multi?.[f.mode]?.length>1||f.mode==='month'&&f.months?.length>1)?'<p>Kurvan visar en punkt per vald period. Ej valda perioder ingår inte.</p>':''}<svg viewBox="0 0 700 200" role="img" aria-label="Antal bindande avtal över vald period. Exakta tal finns i tabellen nedan."><path d="M30 25V150H680" fill="none" stroke="var(--kf-navy-20)"/><text x="4" y="40">${max}</text><text x="12" y="155">0</text><polyline points="${s.points.map((p,i)=>`${x(i)},${y(p.count)}`).join(' ')}" fill="none" stroke="var(--kf-navy)" stroke-width="3"/>${s.points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.count)}" r="4" fill="var(--kf-orange)"><title>${p.key}: ${p.count} avtal</title></circle>`).join('')}<text x="30" y="183">${s.points[0]?.key||''}</text><text x="670" y="183" text-anchor="end">${s.points.length>1?s.points.at(-1).key:''}</text></svg>${s.count?'':'<p>Inga bindande avtal med känt datum i valt urval. Face2face har exempelutfall juli–oktober 2026.</p>'}${s.unknown?`<p>${s.unknown} bindande avtal saknar bindandedatum och kan inte placeras i kurvan.</p>`:''}<details><summary>Så räknas resultatet och exakta tal</summary><p>Varje order räknas en gång på sitt första sparade bindandedatum, även om avtalet senare avslutas. Saknade datum gissas inte. Resultatet följer nuvarande ansvarig säljare; en omfördelning flyttar därför också försäljningsresultatet. Partnerns totala provision ändras inte av säljarurvalet.</p><div class="table-wrap"><table><thead><tr><th>Datum / månad</th><th>Bindande avtal</th></tr></thead><tbody>${s.points.map(p=>`<tr><td>${p.key}</td><td>${p.count}</td></tr>`).join('')}</tbody></table></div></details></section>`;}
  function assignment(row){if(!canManage()||!canRead(row))return;P.openDialog('Omfördela order',`<form id="pu-assign" class="ow-form"><p>${e(row.id)} · Nuvarande ansvarig: ${e(ownerName(row))}. Orderns resultat följer den nya ansvariga säljaren. Status och provisionsunderlag bevaras.</p><label class="ow-field">Ny ansvarig<select name="sellerId" required><option value="">Välj säljare</option>${choices(staff(row.partner).filter(u=>u.active).map(u=>[u.id,u.name]),owner(row))}</select></label><label class="ow-field">Orsak<textarea name="reason" required maxlength="500"></textarea></label><p role="alert" tabindex="-1"></p><button class="btn btn-primary">Spara tilldelning</button></form>`,()=>{const form=document.querySelector('#pu-assign');form.onsubmit=ev=>{ev.preventDefault();const result=P.orderWorkspace.assignOrder(row.id,form.elements.sellerId.value,form.elements.reason.value);if(!result.ok){form.querySelector('[role="alert"]').textContent=result.message;return;}P.closeDialog();P.render();P.toast('Ordern har omfördelats och ändringen loggats.');};});}
  P.prototypeUsers={current,users,roles,admin,internal,canManage,commission,scope,owner,ownerName,canRead,selected,staff,saveUser,signIn,signOut,allowed,results,salesStats,bindingDate,sellerFilter,login:signOut,assignment};
  P.register('demo-login',{render:loginView});P.register('test-users',{render:testUsersView});P.register('portal-contact',{render:contactView});P.register('user-admin',{render:()=>admin()||manageCustomerUsers()?adminView()+enquiriesView():''});
  document.addEventListener('click',ev=>{const b=ev.target.closest('[data-pu-login],[data-pu-new],[data-pu-edit],[data-pu-partner],[data-pu-assign],[data-pu-all],[data-pu-reload]');if(!b)return;if(b.hasAttribute('data-pu-reload')){location.reload();return;}if(b.hasAttribute('data-pu-login')){const r=signIn(b.dataset.puLogin);if(!r.ok)P.toast(r.message);}if(b.hasAttribute('data-pu-new'))editUser();if(b.hasAttribute('data-pu-edit'))editUser(b.dataset.puEdit);if(b.hasAttribute('data-pu-partner')&&admin()){P.returnInternal();P.partnerSetup.open();}if(b.hasAttribute('data-pu-all')){selections.delete(P.partner);P.render();document.querySelector('[data-pu-all]')?.focus();}if(b.hasAttribute('data-pu-assign')){const row=P.orderWorkspace.orders().find(r=>r.id===b.dataset.puAssign);if(row)assignment(row);}});
  document.addEventListener('change',ev=>{const el=ev.target;if(el.matches('[data-pu-month]')){const f=resultPeriod(),m=el.dataset.puMonth,selected=f.months?.length?f.months:[f.day.slice(5,7)];if(!el.checked&&selected.length===1){el.checked=true;P.toast('Välj minst en månad.');return;}f.months=el.checked?[...new Set([...selected,m])].sort():selected.filter(v=>v!==m);f.day=f.day.slice(0,4)+'-'+f.months[0]+'-01';P.render();document.querySelector('[data-month-picker="pu"]').open=true;document.querySelector(`[data-pu-month="${m}"]`)?.focus();return;}if(el.matches('[data-pu-year]')){if(!/^(20\d{2}|2100)$/.test(el.value))return;const f=resultPeriod();f.day=el.value+'-'+f.day.slice(5,7)+'-01';P.render();document.querySelector('[data-pu-year]')?.focus();return;}if(el.matches('[data-pu-seller]')){selections.set(P.partner,[...document.querySelectorAll('[data-pu-seller]:checked')].map(n=>n.dataset.puSeller));const id=el.dataset.puSeller;P.render();[...document.querySelectorAll('[data-pu-seller]')].find(n=>n.dataset.puSeller===id)?.focus();}if(el.matches('[data-pu-period]')){const value=el.dataset.puPeriod==='day'?periodDay(el.value,resultPeriod().mode):el.value;if(el.dataset.puPeriod==='day'&&!dateOK(value))return;resultPeriod()[el.dataset.puPeriod]=value;if(el.dataset.puPeriod==='day')resultPeriod().months=[];P.render();document.querySelector(`[data-pu-period="${el.dataset.puPeriod}"]`)?.focus();}});
  window.addEventListener('storage',ev=>{if(ev.key!=='partnerlabb.portal.v2')return;try{const next=JSON.parse(ev.newValue);if(JSON.stringify(next?.prototypeAccess)!==JSON.stringify(P.state.prototypeAccess)){externalUserChange=true;P.closeDialog();P.go('demo-login');}}catch{}});
  P.orderWorkspace?.enable(true);
  document.addEventListener('DOMContentLoaded',()=>{enforce();P.render();});
})();
