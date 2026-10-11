(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const icon = P.icon;
  const heroes = {
    office: { label: 'Företag & fastighet', src: 'assets/office.jpg' },
    wind: { label: 'Energi & horisont', src: 'assets/wind.jpg' },
    solar: { label: 'Sol & framtid', src: 'assets/solar.jpg' }
  };
  let materialFilter = 'all';
  let selectedStep = 3;
  const uid = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  const partnerName = id => P.partners[id] || 'Exempelpartner';
  const visible = items => (Array.isArray(items) ? items : []).filter(item => item && typeof item === 'object' && !Array.isArray(item) && (P.role === 'internal' || item.partner === P.partner));
  const dateLabel = value => { const date = new Date(value); return typeof value === 'string' && value && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) : 'Datum saknas'; };
  const nonempty = (input, value) => {
    input.setCustomValidity(value.trim() ? '' : 'Skriv text, inte enbart blanksteg.');
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return input.reportValidity();
  };
  function initState() {
    if (!Array.isArray(P.state.sites)) P.state.sites = [];
    if (!P.state.journey || typeof P.state.journey !== 'object') P.state.journey = {};
    if (!Array.isArray(P.state.support)) P.state.support = [];
    if (!P.state.partnerModulesSeeded) {
      const records = (Array.isArray(P.state.records) ? P.state.records : []).filter(record => record && typeof record === 'object' && !Array.isArray(record));
      if (!P.state.sites.length) {
        ['syd', 'vast'].forEach(partner => records.filter(r => r.partner === partner).slice(0, partner === 'syd' ? 2 : 1).forEach((r, index) => {
          P.state.sites.push({ id: uid('sida'), partner, recordId: r.id, customer: r.company, title: `Välkommen, ${r.company}`, subtitle: r.kind === 'BRF' ? 'En samlad plats för er dialog om elhandel. Här kan styrelsen förbereda nästa samtal med sin partner.' : 'En samlad plats för er dialog om elhandel. Här kan ni förbereda nästa samtal med er partner.', hero: index ? 'wind' : 'office', cta: 'Boka ett samtal', created: '2026-10-07T09:00:00Z' });
        }));
      }
      P.state.partnerModulesSeeded = true;
      P.save();
    }
  }
  const pageHead = (eyebrow, title, text, action = '') => `<div class="page-head partner-page-head"><div><span class="partner-eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1><p class="muted">${e(text)}</p></div>${action}</div>`;
  const demoNote = text => `<p class="partner-demo-note">${icon('shield')}<span>${e(text)}</span></p>`;

  function renderSites() {
    initState();
    const sites = visible(P.state.sites);
    return `${pageHead('PARTNERANPASSAD KUNDDIALOG', 'Kundsidor', 'Ge varje kund en tydlig startpunkt för nästa steg.', `<button class="btn btn-primary" id="partner-create-site">${icon('plus')} Skapa kundsida</button>`)}
      <div class="partner-intro-banner"><div class="partner-banner-icon">${icon('link')}</div><div><h2>En sida som känns personlig.</h2><p>Välj kund, bild och budskap. Förhandsgranska sedan kundens upplevelse.</p></div><span class="pill">Lokala utkast</span></div>
      <div class="partner-section-line"><h2 class="section-title">Mina kundsidor <span class="partner-count">${sites.length}</span></h2><span class="muted">Fiktiva organisationer · företagskunder & BRF</span></div>
      <div class="partner-site-grid">${sites.length ? sites.map(site => `<article class="card partner-site-card"><div class="partner-site-picture"><img src="${e((heroes[site.hero] || heroes.office).src)}" alt=""><span class="partner-picture-tag">${e(partnerName(site.partner))}</span></div><div class="partner-site-body"><span class="partner-eyebrow">KUNDSIDA · DEMOUTKAST</span><h3>${e(site.customer)}</h3><p>${e(site.subtitle)}</p><div class="partner-site-meta">${icon('calendar')} Skapad ${dateLabel(site.created)}</div><div class="partner-card-actions"><button class="btn btn-primary btn-small" data-preview-site="${e(site.id)}">Förhandsgranska ${icon('arrow')}</button><button class="btn btn-secondary btn-small" data-edit-site="${e(site.id)}">${icon('edit')} Redigera</button></div></div></article>`).join('') : '<div class="card empty">Skapa din första kundsida med en fiktiv kund.</div>'}</div>
      ${demoNote('Kundsidorna sparas i denna webbläsare. Förhandsvisningen publiceras inte och skickar inga inbjudningar.')}
      <div class="card partner-how-card"><h2 class="section-title">Från kunddialog till tydligt nästa steg</h2><div class="partner-how-grid">${[['user','1. Välj kund','Utgå från en fiktiv företagskund eller BRF.'],['edit','2. Anpassa sidan','Sätt ett budskap och välj en bild som passar.'],['link','3. Testa upplevelsen','Öppna förhandsvisningen och prova kontaktvägen.']].map(([i,t,s]) => `<div>${icon(i)}<h3>${t}</h3><p>${s}</p></div>`).join('')}</div></div>`;
  }
  function siteForm(site) {
    const records = P.getRecords();
    if (!records.length) { P.toast('Registrera först en fiktiv kund i kundvyn.'); return; }
    const selected = site ? records.find(r => r.id === site.recordId) : records[0];
    const defaultTitle = site?.title || `Välkommen, ${selected?.company || 'exempelkund'}`;
    P.openDialog(site ? 'Redigera kundsida' : 'Skapa en kundsida', `<form id="partner-site-form" class="partner-form"><p class="muted">Anpassa ett lokalt demoutkast. Använd enbart fiktivt innehåll.</p><div class="field"><label for="partner-site-customer">Kund</label><select id="partner-site-customer" name="customer" required>${records.map(r => `<option value="${e(r.id)}"${r.id === selected?.id ? ' selected' : ''}>${e(r.company)} · ${e(r.kind)}</option>`).join('')}</select></div><div class="field"><label for="partner-site-title">Rubrik</label><input id="partner-site-title" name="title" required maxlength="140" value="${e(defaultTitle)}"></div><div class="field"><label for="partner-site-intro">Introduktion</label><textarea id="partner-site-intro" name="subtitle" required rows="3" maxlength="480">${e(site?.subtitle || 'En samlad plats för er dialog om elhandel. Här kan ni förbereda nästa samtal med er partner.')}</textarea></div><div class="form-grid"><div class="field"><label for="partner-site-hero">Bild</label><select id="partner-site-hero" name="hero">${Object.entries(heroes).map(([key,h]) => `<option value="${key}"${key === (site?.hero || 'office') ? ' selected' : ''}>${e(h.label)}</option>`).join('')}</select></div><div class="field"><label for="partner-site-cta">Kontaktknapp</label><select id="partner-site-cta" name="cta">${['Boka ett samtal','Be om återkoppling','Diskutera nästa steg'].map(label => `<option${label === site?.cta ? ' selected' : ''}>${label}</option>`).join('')}</select></div></div><div class="partner-choice-preview"><img id="partner-site-image-preview" src="${e((heroes[site?.hero] || heroes.office).src)}" alt="Vald bild för kundsidan"></div><div class="modal-actions"><button class="btn btn-secondary" type="button" id="partner-site-cancel">Avbryt</button><button class="btn btn-primary" type="submit">Spara lokalt utkast</button></div></form>`, () => {
      const form = document.querySelector('#partner-site-form');
      document.querySelector('#partner-site-cancel').onclick = () => P.closeDialog();
      form.elements.hero.onchange = () => { document.querySelector('#partner-site-image-preview').src = heroes[form.elements.hero.value].src; };
      form.elements.customer.onchange = () => { const r = records.find(item => item.id === form.elements.customer.value); form.elements.title.value = `Välkommen, ${r.company}`; };
      form.onsubmit = event => {
        event.preventDefault();
        if (!nonempty(form.elements.title, form.elements.title.value) || !nonempty(form.elements.subtitle, form.elements.subtitle.value)) return;
        const r = records.find(item => item.id === form.elements.customer.value);
        if (!r) { P.toast('Kunden finns inte längre i denna demovy.'); return; }
        const values = { recordId: r.id, customer: r.company, partner: r.partner, title: form.elements.title.value.trim(), subtitle: form.elements.subtitle.value.trim(), hero: form.elements.hero.value, cta: form.elements.cta.value };
        const previous = site ? { ...site } : null;
        if (site) Object.assign(site, values);
        else P.state.sites.unshift({ id: uid('sida'), created: new Date().toISOString(), ...values });
        if (!P.save()) { if (site) Object.assign(site, previous); else P.state.sites.shift(); P.toast('Kunde inte spara kundsidan. Din inmatning finns kvar; försök igen.'); return; }
        P.closeDialog(); P.render(); P.toast('Kundsidans demoutkast är sparat i denna webbläsare.');
      };
    });
  }
  function previewSite(id) {
    const site = visible(P.state.sites).find(item => item.id === id);
    if (!site) return;
    P.openDialog('Förhandsvisning av kundsida', `<div class="partner-customer-preview"><div class="partner-preview-bar"><span>${icon('link')} Lokal förhandsvisning</span><span class="pill">Exempeldata</span></div><header class="partner-preview-header"><strong>${e(partnerName(site.partner))}</strong><span>Din dialog om elhandel</span></header><div class="partner-preview-hero" style="background-image:linear-gradient(90deg,rgba(5,30,46,.91),rgba(5,30,46,.28)),url('${e((heroes[site.hero] || heroes.office).src)}')"><span class="partner-eyebrow">FÖRETAG & BOSTADSRÄTTSFÖRENINGAR</span><h2>${e(site.title)}</h2><p>${e(site.subtitle)}</p><button class="btn btn-primary" id="partner-preview-cta">${e(site.cta)} ${icon('arrow')}</button></div><div class="partner-preview-features">${[['bolt','Elhandel för er verksamhet','Samla frågor och behov inför dialogen om er elhandel.'],['file','Förbered nästa möte','Fundera på vad ni vill förstå och vilket underlag ni har till hands.'],['users','En kontaktväg framåt','Planera nästa samtal tillsammans med er säljpartner.']].map(([i,t,s]) => `<div>${icon(i)}<h3>${t}</h3><p>${s}</p></div>`).join('')}</div><section class="partner-preview-contact" id="partner-preview-contact"><h3>Vad vill ni prata om?</h3><p class="muted">Prova kontaktformuläret. Meddelandet visas endast i denna förhandsvisning.</p><form id="partner-preview-contact-form"><div class="field"><label for="partner-preview-message">Kundens frågeställning · exempel</label><textarea id="partner-preview-message" required rows="3" maxlength="500" placeholder="Exempel: vi vill planera en dialog inför nästa avtalsperiod."></textarea></div><button class="btn btn-primary" type="submit">Testa kontaktförfrågan ${icon('arrow')}</button></form><div class="partner-preview-success" id="partner-preview-success" hidden role="status"></div></section><footer class="partner-preview-footer">Demoutkast · Inga produktvillkor, priser eller erbjudanden anges på denna sida.</footer></div>`, () => {
      document.querySelector('#partner-preview-cta').onclick = () => { document.querySelector('#partner-preview-contact').scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('#partner-preview-message').focus({ preventScroll: true }); };
      document.querySelector('#partner-preview-contact-form').onsubmit = event => {
        event.preventDefault();
        const input = document.querySelector('#partner-preview-message');
        if (!nonempty(input, input.value)) return;
        const success = document.querySelector('#partner-preview-success');
        success.innerHTML = `${icon('check')}<div><strong>Kontaktvägen har testats.</strong><p>${e(input.value.trim())}</p><span>Inget meddelande har skickats.</span></div>`;
        success.hidden = false;
        document.querySelector('#partner-preview-contact-form').hidden = true;
      };
    });
  }
  P.register('sites', { render: renderSites, bind: () => {
    document.querySelector('#partner-create-site').onclick = () => siteForm();
    document.querySelectorAll('[data-preview-site]').forEach(button => { button.onclick = () => previewSite(button.dataset.previewSite); });
    document.querySelectorAll('[data-edit-site]').forEach(button => { button.onclick = () => siteForm(visible(P.state.sites).find(item => item.id === button.dataset.editSite)); });
  } });

  const materials = [
    { id:'meeting', category:'sales', icon:'briefcase', title:'Checklista inför kundmötet', intro:'En enkel struktur för frågor, underlag och nästa steg.', format:'TXT · 1 sida', content:'CHECKLISTA INFÖR KUNDMÖTET\nDEMO – strukturförslag, inte godkänt produktmaterial.\n\n1. Beskriv den fiktiva kunden: företag eller BRF, ort och kontakt.\n2. Vilka frågor vill kunden diskutera om sin elhandel?\n3. Vilka befintliga uppgifter finns och vilka behöver klargöras?\n4. Vem behöver delta i nästa samtal?\n5. Dokumentera överenskommet nästa steg och ett förslag på datum.\n\nInga priser, villkor eller befogenheter fastställs av denna checklista. Använd endast exempeldata i prototypen.\n' },
    { id:'pagebrief', category:'pages', icon:'link', title:'Brief för en personlig kundsida', intro:'Förbered budskap, bildval och kontaktväg för en kundsida.', format:'TXT · 1 sida', content:'BRIEF FÖR KUNDSIDA\nDEMO – strukturförslag, inte godkänt marknadsmaterial.\n\nKund: [Fiktivt företag eller BRF]\nPartner: [Exempelpartner]\nSyfte: Vad ska kunden kunna förstå eller göra?\nRubrik: Ett tydligt välkomnande.\nIntroduktion: Kundens frågeställning och nästa steg.\nBild: Välj en bild ur prototypens bildbibliotek.\nKontaktknapp: Vilken kontaktväg ska demonstreras?\n\nPublicering, mottagarurval och eventuella erbjudanden behöver beslutas och förankras separat. Lägg inte in priser, rabatter eller avtalsvillkor utan faktiskt underlag.\n' },
    { id:'conversation', category:'sales', icon:'users', title:'Samtalsguide för behovsdialog', intro:'Håll fokus på kundens verksamhet och frågor.', format:'TXT · 1 sida', content:'SAMTALSGUIDE FÖR BEHOVSDIALOG\nDEMO – diskussionsstöd, inte en beslutad säljprocess.\n\n• Vad vill ni få ut av dialogen om er elhandel?\n• Vilka personer behöver delta?\n• Hur ser er planering inför kommande avtalsperiod ut?\n• Finns det frågor om elavtal, prissäkring eller portföljlösningar som ni vill ta vidare?\n• Vilket nästa steg passar er?\n\nGuiden ger inga produktrekommendationer eller kommersiella utfästelser. Partnerns mandat behöver bestämmas separat. Använd enbart fiktiva uppgifter i prototypen.\n' },
    { id:'followup', category:'sales', icon:'file', title:'Mall för mötesuppföljning', intro:'Sammanfatta vad ni diskuterat och vad som händer härnäst.', format:'TXT · 1 sida', content:'MALL FÖR MÖTESUPPFÖLJNING\nDEMO – textmall för test, inte godkänt kundutskick.\n\nHej [fiktiv kontakt],\nTack för samtalet. Vi diskuterade [kundens frågor].\nNästa steg som vi vill stämma av är [aktivitet], med [deltagare].\nFörslag på tid: [datum].\nÅterkom gärna med kompletterande frågor inför nästa samtal.\n\n[Exempelpartner]\n\nIngen offert, prisuppgift eller avtalsbekräftelse ingår i denna textmall. Inget skickas från prototypen.\n' }
  ];
  function renderMaterial() {
    const shown = materials.filter(m => materialFilter === 'all' || m.category === materialFilter);
    return `${pageHead('STÖD FÖR KUNDDIALOGEN', 'Material & kampanjer', 'Samla det som hjälper dig förbereda, möta och följa upp kunden.')}
      <div class="partner-material-hero" style="background-image:linear-gradient(90deg,rgba(7,40,51,.96),rgba(7,40,51,.32)),url('assets/office.jpg')"><span class="partner-eyebrow">SÄLJSTÖD I VARDAGEN</span><h2>Samma budskap.<br>Bättre kundmöten.</h2><p>Börja med ett tydligt behov och en bra plan för nästa samtal.</p><button class="btn btn-primary" id="partner-browse-material" type="button">Utforska demomaterial ${icon('arrow')}</button></div>
      <div class="partner-section-line" id="partner-material-library"><h2 class="section-title">Materialbibliotek</h2><span class="pill">Demomallar</span></div><div class="partner-tabs" aria-label="Filtrera material">${[['all','Allt material'],['sales','Säljstöd'],['pages','Kundsidor']].map(([key,label]) => `<button class="btn btn-secondary btn-small${materialFilter === key ? ' partner-tab-active' : ''}" data-material-filter="${key}" aria-pressed="${materialFilter === key}">${label}</button>`).join('')}</div>
      <div class="partner-material-grid">${shown.map(m => `<article class="card partner-material-card"><span class="partner-material-icon">${icon(m.icon)}</span><span class="partner-eyebrow">${m.category === 'pages' ? 'KUNDSIDOR' : 'SÄLJSTÖD'} · DEMO</span><h3>${e(m.title)}</h3><p>${e(m.intro)}</p><span class="partner-file-format">${m.format}</span><div class="partner-card-actions"><button class="btn btn-secondary btn-small" data-read-material="${m.id}">Förhandsvisa</button><button class="btn btn-primary btn-small" data-download-material="${m.id}">${icon('download')} Ladda ned</button></div></article>`).join('')}</div>
      <div class="partner-section-line"><h2 class="section-title">Kampanjyta att utveckla</h2><span class="muted">Innehållsexempel</span></div><article class="card partner-campaign-card"><img src="assets/wind.jpg" alt=""><div><span class="partner-eyebrow">FÖRSLAG PÅ TEMA</span><h3>Planera nästa kunddialog</h3><p>En samlad yta för framtida kampanjbudskap, målgrupp och godkänt material. Testa hur en kampanjbrief kan hjälpa partnern förbereda sina möten.</p><button class="btn btn-secondary btn-small" id="partner-campaign-brief">Visa exempelbrief ${icon('arrow')}</button></div><span class="pill">Ej beslutad kampanj</span></article>
      ${demoNote('Biblioteket visar struktur och nedladdningsbara demomallar. Godkänt säljmaterial, produktinformation och kampanjvillkor behöver lämnas av er.')}`;
  }
  function showMaterial(id) {
    const m = materials.find(item => item.id === id);
    if (!m) return;
    P.openDialog(m.title, `<div class="partner-document-preview"><span class="pill">Demomall</span><pre>${e(m.content)}</pre><div class="modal-actions"><button class="btn btn-primary" id="partner-modal-download">${icon('download')} Ladda ned demomall</button></div></div>`, () => { document.querySelector('#partner-modal-download').onclick = () => { P.download(`demo-${m.id}.txt`, m.content, 'text/plain;charset=utf-8'); P.toast('Demomallen är nedladdad.'); }; });
  }
  P.register('material', { render: renderMaterial, bind: () => {
    document.querySelector('#partner-browse-material').onclick = () => document.querySelector('#partner-material-library').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('[data-material-filter]').forEach(button => { button.onclick = () => { materialFilter = button.dataset.materialFilter; P.render(); }; });
    document.querySelectorAll('[data-read-material]').forEach(button => { button.onclick = () => showMaterial(button.dataset.readMaterial); });
    document.querySelectorAll('[data-download-material]').forEach(button => { button.onclick = () => { const m = materials.find(item => item.id === button.dataset.downloadMaterial); P.download(`demo-${m.id}.txt`, m.content, 'text/plain;charset=utf-8'); P.toast('Demomallen är nedladdad.'); }; });
    document.querySelector('#partner-campaign-brief').onclick = () => P.openDialog('Exempel på kampanjbrief', `<div class="partner-brief"><span class="pill">Testförslag</span><h3>Planera nästa kunddialog</h3><dl><dt>Målgrupp att testa</dt><dd>Fiktiva företagskunder och BRF:er med frågor inför sin nästa dialog om elhandel.</dd><dt>Budskap att diskutera</dt><dd>Förbered era frågor och planera nästa samtal tillsammans med er partner.</dd><dt>Stöd till partnern</dt><dd>Checklista inför kundmötet och mall för mötesuppföljning.</dd><dt>Behöver förankras</dt><dd>Syfte, mottagare, innehåll, tidsperiod och partnerns mandat innan en verklig kampanj används.</dd></dl><p class="partner-demo-note">Ingen kampanj är aktiverad. Inga kundutskick görs.</p></div>`);
  } });

  const steps = [
    { title:'Rekrytera', icon:'users', intro:'Utforska hur ett partnerskap kan skapa värde för båda parter.', activities:['Beskriva partnerföretagets inriktning','Stämma av målgrupp och geografisk närvaro','Samla frågor inför en första dialog'], support:['Exempel på partnerpresentation','Frågor att diskutera inför samarbete'], value:'En tydlig bild av vad parterna vill uppnå tillsammans.' },
    { title:'Onboarda', icon:'briefcase', intro:'Ge partnern en enkel start och tydliga kontaktvägar.', activities:['Bekanta sig med portalens demovyer','Presentera deltagare i partnerteamet','Samla frågor om roller och arbetssätt'], support:['Introduktion till portalens funktioner','Förslag på kontakt- och ansvarskarta'], value:'En gemensam förståelse för hur samarbetet kan fungera.' },
    { title:'Certifiera', icon:'book', intro:'Testa hur kunskapsstöd och utbildningar kan stärka kunddialogen.', activities:['Öppna en demoutbildning i Academy','Prova en kunskapsfråga','Diskutera vilka kunskapskrav som behövs'], support:['Partner Academy med exempelmoduler','Frågor om framtida certifieringsupplägg'], value:'Trygghet i samtalen med kunden och ett sätt att följa lärandet.' },
    { title:'Aktivera', icon:'bolt', intro:'Förbered partnerns första kunddialog med rätt stöd.', activities:['Ladda ned en möteschecklista','Skapa en kundsida för en exempelkund','Planera ett första nästa steg'], support:['Demomallar i materialbiblioteket','Lokala kundsidor och kundöversikt'], value:'Verktyg som gör det lättare att komma igång med säljarbetet.' },
    { title:'Sälja', icon:'chart', intro:'Arbeta vidare med kundens behov och gör nästa steg tydligt.', activities:['Registrera en fiktiv affär','Dokumentera senaste aktivitet och nästa steg','Testa ett offertutkast i studion'], support:['Pipeline och aktivitetshistorik','Offertstudio med lokala demoutkast'], value:'En sammanhängande överblick över kunddialog och affär.' },
    { title:'Leverera', icon:'check', intro:'Utforska hur överlämning och uppföljning kan hänga ihop.', activities:['Beskriva vilken överlämningsinformation som behövs','Identifiera frågor kunden behöver få svar på','Föreslå en aktivitet för uppföljning'], support:['Förslag på överlämningschecklista','Samlad dialog och dokumentöversikt'], value:'Ett tydligt nästa steg även efter säljarbetet.' },
    { title:'Utveckla', icon:'target', intro:'Lär av kunddialoger och förbättra samarbetet tillsammans.', activities:['Samla feedback från ett demokundmöte','Identifiera en förbättring i portalen','Föreslå ett gemensamt utvecklingsmöte'], support:['Exempel på uppföljningsvyer','Plats för återkoppling och förbättringsförslag'], value:'Ett partnerskap som utvecklas med erfarenheter och kundbehov.' },
    { title:'Behålla', icon:'leaf', intro:'Utforska hur ett långsiktigt samarbete kan hållas relevant.', activities:['Reflektera över vad som fungerat i testet','Samla önskemål inför nästa period','Diskutera mål för fortsatt samarbete'], support:['Förslag på gemensam uppföljning','Kunskapsstöd och förbättringsdialog'], value:'Ett gemensamt underlag för att fortsätta och förbättra samarbetet.' }
  ];
  function journeyProgress() {
    initState();
    const key = P.partner || 'syd';
    if (!Array.isArray(P.state.journey[key])) P.state.journey[key] = [];
    return P.state.journey[key];
  }
  function renderJourney() {
    const completed = journeyProgress();
    const step = steps[selectedStep];
    const total = steps.reduce((sum,s) => sum + s.activities.length, 0);
    const percent = Math.round(completed.length / total * 100);
    return `${pageHead('ETT SAMMANHÅLLET PARTNERSKAP', 'Partnerresan', 'Utforska momenten från första kontakt till fortsatt utveckling.')}
      <div class="partner-journey-intro"><div><h2>En gemensam riktning.<br>Ett steg i taget.</h2><p>Välj ett steg och testa möjliga aktiviteter. Upplägget är ett diskussionsunderlag för er partnerverksamhet.</p></div><div class="partner-journey-progress"><div class="partner-progress-ring" style="--partner-progress:${percent}%"><strong>${percent}%</strong></div><div><strong>Mina demomoment</strong><span>${completed.length} av ${total} markerade</span><small>${e(partnerName(P.partner))}</small></div></div></div>
      <nav class="partner-journey-nav" aria-label="Partnerresans steg">${steps.map((s,index) => `<button type="button" class="partner-step${index === selectedStep ? ' partner-step-active' : ''}" data-journey-step="${index}" aria-current="${index === selectedStep ? 'step' : 'false'}"><span class="partner-step-number">${index + 1}</span>${icon(s.icon)}<strong>${s.title}</strong><span>${completed.filter(id => id.startsWith(`${index}-`)).length}/${s.activities.length}</span></button>`).join('')}</nav>
      <div class="partner-journey-layout"><article class="card partner-journey-detail"><div class="partner-journey-detail-head"><span class="partner-material-icon">${icon(step.icon)}</span><div><span class="partner-eyebrow">STEG ${selectedStep + 1} AV 8 · TESTFÖRSLAG</span><h2>${step.title}</h2></div></div><p class="partner-journey-description">${step.intro}</p><h3>Partnerns möjliga aktiviteter</h3><p class="muted">Markera de moment du har provat i prototypen.</p><div class="partner-journey-checklist">${step.activities.map((text,index) => `<label class="partner-activity${completed.includes(`${selectedStep}-${index}`) ? ' partner-activity-done' : ''}"><input type="checkbox" data-journey-activity="${selectedStep}-${index}"${completed.includes(`${selectedStep}-${index}`) ? ' checked' : ''}><span>${e(text)}</span><span class="partner-activity-label">Demomoment</span></label>`).join('')}</div><div class="partner-journey-detail-footer">${selectedStep > 0 ? '<button class="btn btn-secondary btn-small" id="partner-prev-step">← Föregående</button>' : '<span></span>'}${selectedStep < 7 ? '<button class="btn btn-primary btn-small" id="partner-next-step">Nästa steg →</button>' : '<span class="pill">Sista steget i översikten</span>'}</div></article><aside class="partner-journey-aside"><div class="card partner-support-card"><h3>${icon('briefcase')} Möjligt stöd & verktyg</h3><ul>${step.support.map(s => `<li>${icon('check')} ${e(s)}</li>`).join('')}</ul>${selectedStep === 2 ? '<button class="btn btn-secondary btn-small" data-go="academy">Öppna Academy →</button>' : selectedStep === 3 ? '<button class="btn btn-secondary btn-small" data-go="material">Öppna materialbiblioteket →</button>' : selectedStep === 4 ? '<button class="btn btn-secondary btn-small" data-go="pipeline">Öppna pipeline →</button>' : ''}</div><div class="card partner-value-card"><span class="partner-material-icon">${icon('leaf')}</span><h3>Värde att sikta mot</h3><p>${e(step.value)}</p></div></aside></div>
      ${demoNote('Stegen och aktiviteterna är testförslag, inte beslutade interna processer eller krav. Markeringarna sparas lokalt per exempelpartner.')}`;
  }
  P.register('journey', { render: renderJourney, bind: () => {
    document.querySelectorAll('[data-journey-step]').forEach(button => { button.onclick = () => { selectedStep = Number(button.dataset.journeyStep); P.render(); }; });
    document.querySelectorAll('[data-journey-activity]').forEach(input => { input.onchange = () => { const completed = journeyProgress(); const index = completed.indexOf(input.dataset.journeyActivity); if (input.checked && index < 0) completed.push(input.dataset.journeyActivity); if (!input.checked && index >= 0) completed.splice(index,1); if (!P.save()) { if (input.checked && index < 0) completed.pop(); else if (!input.checked && index >= 0) completed.splice(index,0,input.dataset.journeyActivity); input.checked = !input.checked; P.toast('Kunde inte spara demomomentet. Tidigare markering behålls.'); return; } P.render(); P.toast('Demomomentet är sparat i denna webbläsare.'); }; });
    document.querySelector('#partner-prev-step')?.addEventListener('click', () => { selectedStep--; P.render(); });
    document.querySelector('#partner-next-step')?.addEventListener('click', () => { selectedStep++; P.render(); });
  } });

  const faqs = [
    ['Vad kan jag testa i portalen?', 'Följ fiktiva resultat, kunder och avtal, läs Avtalsfakta och gå utbildningen. Fastighetspartners kan testa Excel eller manuell inflyttningsregistrering med fullmaktsbilagor. Säljpartnerns aktiva säljarbete sker utanför portalen.'],
    ['Ser andra mina ändringar?', 'Ändringarna sparas i den här webbläsaren. Två datorer delar ännu inte data. Växling mellan demovyer visar hur olika användarperspektiv kan fungera.'],
    ['Kan jag skicka en offert eller fullmakt?', 'Du kan testa och förhandsgranska lokala utkast. Inga dokument skickas för signering och inga avtal ingås i prototypen.'],
    ['Är priser och provision beslutade?', 'Nej. Kommersiella regler, produktvillkor och partnerns befogenheter behöver bygga på underlag som ni lämnar.'],
    ['Är materialet godkänt att använda med kunder?', 'Biblioteket innehåller demomallar och visar en möjlig struktur. Godkänt produkt- och marknadsmaterial behöver tillföras separat.']
  ];
  function renderSupport() {
    initState();
    const requests = visible(P.state.support);
    return `${pageHead('HJÄLP I SÄLJARBETET', 'Hjälp & support', 'Hitta svar och prova hur en kontaktväg för partnern kan fungera.')}
      <div class="partner-support-layout"><section class="card partner-support-form-card"><div class="partner-journey-detail-head"><span class="partner-material-icon">${icon('help')}</span><div><span class="partner-eyebrow">LOKALT TEST</span><h2>Vad behöver du hjälp med?</h2></div></div><p class="muted">Skapa en testförfrågan med fiktivt innehåll.</p><form id="partner-support-form"><div class="form-grid"><div class="field"><label for="partner-support-type">Område</label><select id="partner-support-type" name="type"><option>Portalfråga</option><option>Kunddialog</option><option>Material</option><option>Övrigt</option></select></div><div class="field"><label for="partner-support-customer">Kund · valfritt</label><select id="partner-support-customer" name="customer"><option value="">Ingen särskild kund</option>${P.getRecords().map(r => `<option value="${e(r.id)}">${e(r.company)}</option>`).join('')}</select></div></div><div class="field"><label for="partner-support-title">Rubrik</label><input id="partner-support-title" name="title" required maxlength="140" placeholder="Exempel: vilket underlag ska jag förbereda?"></div><div class="field"><label for="partner-support-message">Beskriv din fråga</label><textarea id="partner-support-message" name="message" required maxlength="1000" rows="5" placeholder="Beskriv vad du vill få hjälp med. Använd bara exempeldata."></textarea></div><button class="btn btn-primary" type="submit">${icon('plus')} Spara testförfrågan</button></form>${demoNote('Förfrågan sparas lokalt. Inget supportärende, mejl eller meddelande skickas till Kraftringen.')}</section><section class="card partner-faq-card"><h2 class="section-title">Vanliga frågor om prototypen</h2><div class="partner-faq-list">${faqs.map(([q,a],index) => `<details${index === 0 ? ' open' : ''}><summary>${e(q)}<span aria-hidden="true">+</span></summary><p>${e(a)}</p></details>`).join('')}</div><div class="partner-faq-callout">${icon('users')}<div><strong>Något att diskutera tillsammans?</strong><p>Samla era frågor här inför nästa byggpass med Ludwig och Håkan.</p></div></div></section></div>
      <div class="partner-section-line"><h2 class="section-title">Mina testförfrågningar <span class="partner-count">${requests.length}</span></h2><span class="muted">Sparade i denna webbläsare</span></div><div class="card partner-request-list">${requests.length ? requests.map(r => `<article class="partner-request"><span class="partner-material-icon">${icon('mail')}</span><div><span class="partner-eyebrow">${e(r.type)} · ${dateLabel(r.created)}</span><h3>${e(r.title)}</h3><p>${e(r.message)}</p>${r.customer ? `<span class="partner-request-customer">${e(r.customer)}</span>` : ''}${P.role === 'internal' ? `<span class="partner-request-customer">${e(partnerName(r.partner))}</span>` : ''}</div><span class="pill">Lokalt test</span></article>`).join('') : '<div class="empty">Inga testförfrågningar ännu. Prova formuläret ovan.</div>'}</div>`;
  }
  P.register('support', { render: renderSupport, bind: () => {
    const form = document.querySelector('#partner-support-form');
    form.onsubmit = event => {
      event.preventDefault();
      if (!nonempty(form.elements.title, form.elements.title.value) || !nonempty(form.elements.message, form.elements.message.value)) return;
      const customer = P.getRecords().find(r => r.id === form.elements.customer.value);
      const request = { id: uid('fraga'), partner: customer?.partner || P.partner, customer: customer?.company || '', type: form.elements.type.value, title: form.elements.title.value.trim(), message: form.elements.message.value.trim(), created: new Date().toISOString() };
      P.state.support.unshift(request);
      if (!P.save()) { P.state.support.splice(P.state.support.indexOf(request), 1); P.toast('Kunde inte spara testförfrågan. Din inmatning finns kvar; försök igen.'); return; }
      P.render(); P.toast('Testförfrågan är sparad lokalt. Inget har skickats.');
    };
  } });
})();
