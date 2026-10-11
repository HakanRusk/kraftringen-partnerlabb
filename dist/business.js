(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const icon = P.icon;
  const $ = selector => document.querySelector(selector);
  const number = value => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(value);
  const topics = [
    ['contract', 'Elavtal', 'Vilka avtalsfrågor vill kunden få hjälp med?'],
    ['portfolio', 'Portföljlösning', 'Hur vill kunden planera sina elinköp över tid?'],
    ['hedge', 'Prissäkring', 'Vilka frågor finns om budget och prisrisk?']
  ];
  const documentFields = [
    ['invoice', 'Faktura eller nuvarande avtal'],
    ['consumption', 'Förbrukningsunderlag'],
    ['mandate', 'Representation och eventuellt mandat']
  ];
  const documentOptions = { undiscussed: 'Inte diskuterat', followup: 'Att följa upp', example: 'Exempelunderlag finns' };
  let selectedId = '';
  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

  function init() {
    if (P.state.businessDetails === undefined) P.state.businessDetails = {};
    if (!isObject(P.state.businessDetails)) return;
    if (!P.state.businessDemoSeeded) {
      const samples = {
        'demo-001': { annualVolume: '185000', facilities: '2', start: '2027-01-01', contractEnd: '2026-12-31', topics: ['contract', 'hedge'], documents: { invoice: 'example', consumption: 'followup', mandate: 'undiscussed' } },
        'demo-002': { annualVolume: '620000', facilities: '3', start: '2027-04-01', contractEnd: '2027-03-31', topics: ['portfolio'], documents: { invoice: 'followup', consumption: 'example', mandate: 'undiscussed' } },
        'demo-003': { annualVolume: '95000', facilities: '1', start: '', contractEnd: '', topics: ['contract'], documents: { invoice: 'undiscussed', consumption: 'undiscussed', mandate: 'undiscussed' } }
      };
      Object.entries(samples).forEach(([id, sample]) => {
        if ((Array.isArray(P.state.records) ? P.state.records : []).some(record => isObject(record) && record.id === id && record.partner === 'syd') && !Object.hasOwn(P.state.businessDetails, id)) P.state.businessDetails[id] = sample;
      });
      P.state.businessDemoSeeded = true;
    }
  }
  P.initBusinessDemo = init;
  init();
  const records = () => P.getRecords().filter(record => record.partner === 'syd' && ['Företag', 'BRF'].includes(record.kind));
  const openRecords = () => records().filter(record => record.status !== 'avslutad' && record.stage !== 'active');
  function details(record) {
    const raw = isObject(P.state.businessDetails) ? P.state.businessDetails[record.id] : null;
    const stored = isObject(raw) ? raw : {};
    return {
      annualVolume: '', facilities: '', start: '', contractEnd: '', questions: record.need || '',
      next: record.next || '', nextDate: record.date || '', topics: [], documents: {}, ...stored,
      next: record.next ?? stored.next ?? '', nextDate: record.date ?? stored.nextDate ?? '',
      topics: Array.isArray(stored.topics) ? stored.topics : [], documents: isObject(stored.documents) ? stored.documents : {}
    };
  }
  function head(title, subtitle, action = '') {
    return `<div class="page-head business-head"><div><span class="eyebrow">SAVERA / ELHANDEL FÖR FÖRETAGSKUNDER</span><h1>${e(title)}</h1><p class="muted">${e(subtitle)}</p></div>${action}</div>`;
  }
  const note = text => `<p class="business-note">${icon('shield')}<span>${e(text)}</span></p>`;
  function briefButton(record, label = 'Öppna underlag', variant = 'text-button') {
    return `<button class="${variant}" data-business-record="${e(record.id)}">${e(label)} ${icon('arrow')}</button>`;
  }
  function bindBriefButtons() {
    document.querySelectorAll('[data-business-record]').forEach(button => button.onclick = () => P.openBusinessBrief(button.dataset.businessRecord));
  }
  function renderOverview() {
    init();
    const all = records();
    const open = openRecords();
    const drafts = (Array.isArray(P.state.offers) ? P.state.offers : []).filter(offer => isObject(offer) && offer.partner === 'syd');
    const volume = open.reduce((sum, record) => sum + (Number(details(record).annualVolume) || 0), 0);
    const withVolume = open.filter(record => Number(details(record).annualVolume) > 0).length;
    return `${head('Savera · företagsaffärer', 'Kunddialoger, affärsunderlag och planerade nästa steg.', `<button class="btn btn-primary" data-new-customer>${icon('plus')} Ny företagsdialog</button>`)}
      ${P.workbench?.render({limit:3}) || ''}
      <div class="business-kpis"><article class="card"><span class="business-kpi-icon">${icon('users')}</span><div><span>Öppna kunddialoger</span><strong>${open.length}</strong><small>${all.length} fiktiva kunder totalt</small></div></article><article class="card"><span class="business-kpi-icon">${icon('file')}</span><div><span>Offertutkast</span><strong>${drafts.length}</strong><small>Lokala behovsunderlag</small></div></article><article class="card"><span class="business-kpi-icon">${icon('bolt')}</span><div><span>Årsvolym i öppet underlag</span><strong>${number(volume)} <em>kWh</em></strong><small>${withVolume} dialoger med volym · inget utfall</small></div></article></div>
      <section class="business-hero business-hero-compact"><div class="business-hero-copy"><span class="business-eyebrow">ELHANDEL FÖR FÖRETAG & BRF</span><h2>Förbered nästa företagsdialog.</h2><p>Samla förbrukning, tidplan och kundens frågor inför den fortsatta affären.</p><div class="business-hero-actions"><button class="btn btn-primary" data-go="business-brief">Affärsunderlag ${icon('arrow')}</button><button class="btn business-hero-secondary" data-go="customers">Mina företagskunder</button></div></div><div class="business-hero-photo"><img src="assets/office.jpg" alt="Illustrationsbild av en företagsfastighet"><span>Kundens behov sätter riktningen.</span></div></section>
      <section class="card business-meeting-support"><div><span class="business-kpi-icon">${icon('book')}</span><div><h2>Stöd inför kundmötet</h2><p>Material och textmoment för företagsdialogen.</p></div></div><div class="business-meeting-support-actions"><button class="btn btn-secondary" data-go="material">Säljmaterial ${icon('arrow')}</button><button class="text-button" data-go="academy">Utbildning ${icon('arrow')}</button></div></section>
      <div class="support-strip">${icon('headphones')}<div><strong>En fråga att stämma av med Kraftringen?</strong><span>Samla det som behöver klargöras inför kundens nästa steg.</span></div><button class="text-button" data-go="support">Hjälp & support ${icon('arrow')}</button></div>${note('Alla kunduppgifter och volymer är fiktiva. Affärsunderlag och offertutkast skapar inget avtal eller ekonomiskt utfall.')}`;
  }
  P.openBusinessBrief = id => {
    const record = records().find(item => item.id === id);
    if (record) selectedId = record.id;
    P.go('business-brief');
  };
  P.register('business-overview', { render: renderOverview, bind: bindBriefButtons });

  function field(label, name, type, value, extra = '') {
    return `<label class="field" for="business-${name}">${label}<input id="business-${name}" name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
  }
  function renderBrief() {
    init();
    const all = records();
    const record = all.find(item => item.id === selectedId) || all[0];
    if (!record) return `${head('Affärsunderlag', 'Förbered kundens behov inför nästa dialog.')}<section class="card business-empty"><span class="business-kpi-icon">${icon('briefcase')}</span><h2>Börja med en kunddialog.</h2><p>Registrera en fiktiv företagskund eller BRF och samla sedan underlaget här.</p><button class="btn btn-primary" data-new-customer>${icon('plus')} Ny företagsdialog</button></section>`;
    selectedId = record.id;
    const data = details(record);
    return `${head('Affärsunderlag', 'En samlad bild av kundens behov, tidplan och frågor.', '<button class="btn btn-secondary" data-go="overview">Till översikten</button>')}
      <section class="card business-customer-selector"><label class="field" for="business-customer">Välj företagskund eller BRF<select id="business-customer">${all.map(item => `<option value="${e(item.id)}"${item.id === record.id ? ' selected' : ''}>${e(item.company)} · ${e(item.kind)}</option>`).join('')}</select></label><div class="business-customer-meta"><span class="business-kind">${e(record.kind)}</span><span>${e(record.city || 'Ort inte angiven')}</span><span>${e(record.contact || 'Kontakt inte angiven')}</span><button class="text-button" data-record="${e(record.id)}">Öppna kunddialog ${icon('arrow')}</button></div></section>
      <form id="business-brief-form"><div class="business-brief-layout"><div class="business-brief-main"><section class="card business-form-section"><div class="business-section-heading"><span>01</span><div><h2>Förbrukning & tidplan</h2><p>Samla det ni vet. Fälten kan lämnas tomma tills uppgifterna är klara.</p></div></div><div class="form-grid">${field('Beräknad årsvolym · kWh', 'annualVolume', 'number', data.annualVolume, 'min="1" max="1000000000000" step="1" inputmode="numeric" placeholder="Exempel: 185000"')}${field('Antal anläggningar', 'facilities', 'number', data.facilities, 'min="1" step="1" inputmode="numeric" placeholder="Exempel: 2"')}${field('Önskad avtalsstart', 'start', 'date', data.start)}${field('Nuvarande avtals slutdatum', 'contractEnd', 'date', data.contractEnd)}</div></section>
      <section class="card business-form-section"><div class="business-section-heading"><span>02</span><div><h2>Kundens behov</h2><p>Välj samtalsområden och formulera vad kunden vill förstå.</p></div></div><fieldset class="business-topic-fieldset"><legend class="sr-only">Samtalsområden · valfria</legend><div class="business-topics">${topics.map(([id, title, intro]) => `<label class="business-topic"><input type="checkbox" name="topics" value="${id}"${data.topics.includes(id) ? ' checked' : ''}><span><strong>${title}</strong><small>${intro}</small></span></label>`).join('')}</div></fieldset><label class="field" for="business-questions">Kundens frågor och behov<textarea id="business-questions" name="questions" rows="4" maxlength="1000" placeholder="Exempel: vilka frågor behöver ekonomiansvarig få svar på inför nästa avtalsperiod?">${e(data.questions)}</textarea></label><p class="business-form-hint">Områdena är samtalsstöd. Produktval, pris och villkor behöver godkänt underlag.</p></section>
      <section class="card business-form-section"><div class="business-section-heading"><span>03</span><div><h2>Underlag att diskutera</h2><p>Markera vad som har diskuterats i exemplet inför fortsatt dialog.</p></div></div><div class="business-document-fields">${documentFields.map(([id, title]) => `<label class="field" for="business-doc-${id}">${title}<select id="business-doc-${id}" name="doc-${id}">${Object.entries(documentOptions).map(([key, label]) => `<option value="${key}"${key === (data.documents[id] || 'undiscussed') ? ' selected' : ''}>${label}</option>`).join('')}</select></label>`).join('')}</div><p class="business-form-hint">Ingen dokumentuppladdning ingår. Markeringarna är samtalsstöd och ger inget mandat eller godkännande.</p></section>
      <section class="card business-form-section"><div class="business-section-heading"><span>04</span><div><h2>Nästa steg</h2><p>Gör det tydligt vad ni vill följa upp i kunddialogen.</p></div></div>${field('Nästa aktivitet', 'next', 'text', data.next, 'maxlength="180" placeholder="Exempel: stäm av förbrukningsunderlaget med kunden"')}${field('Planerat datum · valfritt', 'nextDate', 'date', data.nextDate)}<div class="business-form-actions"><span class="business-save-message" id="business-save-status" role="status" aria-live="polite"></span><button class="btn btn-primary" type="submit">${icon('check')} Spara affärsunderlag</button></div></section></div>
      <aside class="business-brief-sidebar"><section class="card business-summary"><span class="eyebrow">KUNDENS AFFÄR</span><h2>${e(record.company)}</h2><div id="business-live-summary"></div><p class="business-summary-note">Årsvolymen beskriver behov i kunddialogen. Den är inte avtalad försäljning.</p></section><section class="card business-next-card"><span class="business-kpi-icon">${icon('file')}</span><h3>Fortsätt med offertutkastet</h3><p>Spara först underlaget. Ta sedan med kunden och behovet till offertstudion.</p><button class="btn btn-secondary" type="button" data-business-offer="${e(record.id)}">Förbered offertutkast ${icon('arrow')}</button></section></aside></div></form>${note('Lokalt testunderlag med fiktiva uppgifter. Det uppdaterar kunddialogens nästa steg och skapar inga avtal, priser eller ekonomiska resultat.')}`;
  }
  function formValues(form) {
    const data = new FormData(form);
    return {
      annualVolume: data.get('annualVolume').trim(), facilities: data.get('facilities').trim(), start: data.get('start'), contractEnd: data.get('contractEnd'),
      questions: data.get('questions').trim(), next: data.get('next').trim(), nextDate: data.get('nextDate'), topics: data.getAll('topics').filter(id => topics.some(topic => topic[0] === id)),
      documents: Object.fromEntries(documentFields.map(([id]) => [id, documentOptions[data.get('doc-' + id)] ? data.get('doc-' + id) : 'undiscussed']))
    };
  }
  function updateSummary(form) {
    const data = formValues(form);
    const rows = [
      ['Årsvolym', data.annualVolume ? `${number(Number(data.annualVolume))} kWh` : 'Inte angiven'],
      ['Anläggningar', data.facilities || 'Inte angivet'],
      ['Önskad start', data.start ? P.date(data.start) : 'Inte angiven'],
      ['Nuvarande avtal slutar', data.contractEnd ? P.date(data.contractEnd) : 'Inte angivet']
    ];
    $('#business-live-summary').innerHTML = `<dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><div class="business-summary-topics">${data.topics.length ? data.topics.map(id => `<span class="pill">${e(topics.find(topic => topic[0] === id)[1])}</span>`).join('') : '<span class="muted">Samtalsområden inte valda</span>'}</div>`;
  }
  P.register('business-brief', { render: renderBrief, bind: () => {
    const select = $('#business-customer');
    if (!select) return;
    select.onchange = () => { selectedId = select.value; P.render(); $('#business-customer')?.focus(); };
    const form = $('#business-brief-form');
    updateSummary(form);
    document.querySelectorAll('[data-business-offer]').forEach(button => button.onclick = () => {
      if (P.prepareBusinessOffer) P.prepareBusinessOffer(button.dataset.businessOffer);
      else P.go('offers');
    });
    form.addEventListener('input', () => { updateSummary(form); $('#business-save-status').textContent = 'Ändringar är inte sparade än.'; });
    form.addEventListener('change', () => { updateSummary(form); $('#business-save-status').textContent = 'Ändringar är inte sparade än.'; });
    form.onsubmit = event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const record = records().find(item => item.id === selectedId);
      if (!record) { P.toast('Kunddialogen finns inte längre i denna demovy.'); return; }
      if (!isObject(P.state.businessDetails) || (Object.hasOwn(P.state.businessDetails, record.id) && !isObject(P.state.businessDetails[record.id])) || (record.events != null && !Array.isArray(record.events))) {
        P.toast('Det äldre affärsunderlaget har ett okänt format. Ingen data ändrades. Exportera underlaget innan det rättas.');
        return;
      }
      const previousRecord = structuredClone(record);
      const hadDetails = Object.hasOwn(P.state.businessDetails, record.id);
      const previousDetails = P.state.businessDetails[record.id];
      const data = formValues(form);
      P.state.businessDetails[record.id] = { ...P.state.businessDetails[record.id], ...data, updatedAt: new Date().toISOString() };
      record.next = data.next; record.date = data.nextDate;
      if (!Array.isArray(record.events)) record.events = [];
      P.event?.(record, 'Affärsunderlag uppdaterat i testmiljön.' + (data.next ? ` Nästa steg: ${data.next}.` : ''));
      let saved = false;
      try { saved = P.save(); } catch {}
      if (!saved) {
        Object.keys(record).forEach(key => delete record[key]); Object.assign(record, previousRecord);
        if (hadDetails) P.state.businessDetails[record.id] = previousDetails; else delete P.state.businessDetails[record.id];
      }
      $('#business-save-status').textContent = saved ? 'Sparat i denna webbläsare.' : 'Kunde inte sparas. Dina formulärändringar finns kvar så att du kan försöka igen.';
      P.toast(saved ? 'Affärsunderlaget och kundens nästa steg är sparade.' : 'Webbläsaren kunde inte spara. Kunddialogen och historiken har behållits. Försök igen.');
    };
  } });
})();
