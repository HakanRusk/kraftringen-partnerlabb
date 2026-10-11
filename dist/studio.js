(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const interests = {
    portfolio: { title: 'Portföljlösning', text: 'Samla kundens frågor om hur elinköpen kan hanteras över tid.', icon: 'chart' },
    hedge: { title: 'Prissäkring', text: 'Beskriv kundens behov av planering och hantering av prisrisk.', icon: 'shield' },
    contract: { title: 'Elavtal', text: 'Dokumentera kundens frågor inför en dialog om elavtal.', icon: 'bolt' }
  };
  const stepNames = ['Välj område', 'Beskriv behov', 'Välj kund', 'Granska & spara'];
  const documentNames = { authority: 'Fullmakt', agreement: 'Avtal', signing: 'Signering' };
  let step = 1;
  let activeDraft = freshDraft();
  let context = '';
  let agreementId = '';
  const esc = value => P.e(value);
  const icon = name => `<span class="studio-icon" aria-hidden="true">${P.icon(name)}</span>`;
  const moneyMissing = '<span class="studio-missing">Underlag saknas</span>';
  const isCalendarDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  const formatDate = value => value && Number.isFinite(new Date(value).getTime()) && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isCalendarDate(value)) ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Inte angivet';
  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
  function restoreObject(target, previous) {
    Object.keys(target).forEach(key => delete target[key]);
    Object.assign(target, previous);
  }
  function saveOrRollback(rollback) {
    try { if (P.save()) return true; } catch {}
    rollback();
    P.toast('Webbläsaren kunde inte spara. Ingen ändring genomfördes. Försök igen.');
    return false;
  }
  function freshDraft() {
    return { id: '', interest: '', need: '', volume: '', start: '', customerId: '', partner: P.partner || 'syd', note: '', documentSteps: {} };
  }
  function offers() {
    return (Array.isArray(P.state.offers) ? P.state.offers : []).filter(item => isObject(item) && (P.role === 'internal' || item.partner === P.partner));
  }
  function customer(draft) { return P.getRecords().find(record => record.id === draft.customerId); }
  function name(draft) { return customer(draft)?.company || draft.customerName || 'Kund saknas'; }
  function sharedEvent(draft, text) {
    const record = customer(draft);
    if (!record) return;
    if (typeof P.event === 'function') P.event(record, text, 'shared');
    else {
      record.events ||= [];
      record.events.unshift({ at: new Date().toISOString(), actor: P.role === 'internal' ? 'Internt team' : P.partners[record.partner], text, visibility: 'shared' });
    }
  }
  function canEdit(draft) {
    const record = customer(draft);
    if (!Array.isArray(P.state.offers) || (record && record.events != null && !Array.isArray(record.events)) || (draft.documentSteps != null && !isObject(draft.documentSteps))) {
      P.toast('Det äldre underlaget har ett okänt format. Ingen data ändrades. Exportera underlaget innan det rättas.');
      return false;
    }
    return true;
  }
  function syncDemoStage(draft) {
    const record = customer(draft);
    if (!record || record.stage === 'active') return;
    const steps = draft.documentSteps || {};
    record.stage = steps.agreement || steps.signing ? 'agreement' : steps.authority ? 'authority' : 'offer';
  }
  function currentContext() {
    const next = `${P.role}:${P.partner}`;
    if (next !== context) { context = next; activeDraft = freshDraft(); step = 1; agreementId = ''; }
  }
  function heading(title, text, actions = '') {
    return `<div class="page-head studio-page-head"><div><span class="studio-eyebrow">PARTNERNS ARBETSPLATS</span><h1>${title}</h1><p>${text}</p></div>${actions}</div>`;
  }
  function stepper() {
    return `<nav class="studio-steps" aria-label="Steg i offertstudion">${stepNames.map((label, index) => `<button type="button" class="studio-step ${step === index + 1 ? 'is-active' : ''} ${step > index + 1 ? 'is-complete' : ''}" data-studio-step="${index + 1}" ${step === index + 1 ? 'aria-current="step"' : ''}><span>${step > index + 1 ? icon('check') : index + 1}</span><b>${label}</b></button>`).join('')}</nav>`;
  }
  function options() {
    return `<aside class="card studio-options"><div class="studio-card-head"><span class="studio-eyebrow">1. INTRESSEOMRÅDE</span><h2>Elhandel</h2><p>Kundens behov styr samtalet.</p></div><div class="studio-option-list">${Object.entries(interests).map(([id, item]) => `<label class="studio-option ${activeDraft.interest === id ? 'is-selected' : ''}"><input type="radio" name="interest" value="${id}" ${activeDraft.interest === id ? 'checked' : ''} ${step === 1 ? 'required' : ''}><span class="studio-option-symbol">${icon(item.icon)}</span><span><strong>${item.title}</strong><small>${item.text}</small></span><span class="studio-radio-dot" aria-hidden="true"></span></label>`).join('')}</div><div class="studio-side-note">${icon('help')}<p>Områden för en behovsdialog. Produktval och villkor behöver eget underlag.</p></div></aside>`;
  }
  function mainStep() {
    if (step === 1) return `<div class="studio-card-head"><span class="studio-eyebrow">VÄLJ UTGÅNGSPUNKT</span><h2>Vad vill kunden prata om?</h2><p>Välj ett område till vänster för att börja.</p></div><div class="studio-step-content"><div class="studio-feature-icon">${icon(interests[activeDraft.interest]?.icon || 'bolt')}</div><h3>${interests[activeDraft.interest]?.title || 'En bra affär börjar med rätt frågor.'}</h3><p class="studio-body-copy">${interests[activeDraft.interest]?.text || 'Samla ett tydligt behov och ett kundunderlag. Här kan partnern förbereda en fortsatt dialog med Kraftringen.'}</p><div class="studio-checklist"><p>${icon('check')} Beskriv behov och önskad start</p><p>${icon('check')} Koppla underlaget till en exempelkund</p><p>${icon('check')} Granska och spara ett offertutkast</p></div><p class="studio-small-note">Priser, villkor och eventuell ersättning fylls i först när ni har lämnat godkänt underlag.</p></div>`;
    if (step === 2) return `<div class="studio-card-head"><span class="studio-eyebrow">2. BESKRIV BEHOVET</span><h2>${interests[activeDraft.interest]?.title || 'Elhandel'}</h2><p>Gör kundens frågeställning lätt att följa upp.</p></div><div class="studio-step-content studio-fields"><div class="field"><label for="studio-need">Vad behöver kunden hjälp med? <span aria-hidden="true">*</span></label><textarea id="studio-need" name="need" required maxlength="1000" rows="5" placeholder="Exempel: styrelsen vill förstå vilka underlag som behövs inför nästa elavtal.">${esc(activeDraft.need)}</textarea></div><div class="studio-field-grid"><div class="field"><label for="studio-volume">Årsförbrukning · exempel, kWh</label><input id="studio-volume" name="volume" type="number" min="1" max="1000000000000" step="1" inputmode="numeric" value="${esc(activeDraft.volume)}" placeholder="Ej angivet"></div><div class="field"><label for="studio-start">Önskad start · exempel</label><input id="studio-start" name="start" type="date" value="${esc(activeDraft.start)}"></div></div><p class="studio-small-note">Volym och start är valfria uppgifter för dialogen. De innebär inget leveranslöfte.</p><div class="field"><label for="studio-note">Frågor att ta vidare · valfritt</label><textarea id="studio-note" name="note" maxlength="800" rows="3" placeholder="Exempel: vilka förbrukningsuppgifter behöver vi samla in?">${esc(activeDraft.note)}</textarea></div></div>`;
    if (step === 3) {
      const records = P.getRecords();
      const selected = customer(activeDraft);
      return `<div class="studio-card-head"><span class="studio-eyebrow">3. KUNDUNDERLAG</span><h2>Vem gäller dialogen?</h2><p>Välj en registrerad exempelkund.</p></div><div class="studio-step-content studio-fields"><div class="field"><label for="studio-customer">Företag eller bostadsrättsförening <span aria-hidden="true">*</span></label><select id="studio-customer" name="customerId" required><option value="">Välj kund</option>${records.map(record => `<option value="${esc(record.id)}" ${record.id === activeDraft.customerId ? 'selected' : ''}>${esc(record.company)} · ${esc(record.kind)}</option>`).join('')}</select></div>${selected ? `<div class="studio-customer-detail"><span class="studio-customer-avatar">${icon('briefcase')}</span><div><strong>${esc(selected.company)}</strong><p>${esc(selected.kind)} · ${esc(selected.city || 'Ort inte angiven')}</p></div><dl><div><dt>Kontaktperson · exempel</dt><dd>${esc(selected.contact || 'Inte angivet')}</dd></div><div><dt>E-post · exempel</dt><dd>${esc(selected.email || 'Inte angivet')}</dd></div><div><dt>Exempelpartner</dt><dd>${esc(P.partners[selected.partner] || selected.partner)}</dd></div></dl></div>` : `<div class="studio-unselected">${icon('users')}<strong>Välj en kund för att se sammanfattningen.</strong><p>Alla kunder i listan är fiktiva.</p></div>`}<button type="button" class="btn btn-secondary btn-small" data-go="customers">${icon('plus')} Gå till kundöversikten</button><p class="studio-small-note">Kundvalet kopplar ihop lokalt testunderlag. Det ger ingen offertbefogenhet.</p></div>`;
    }
    return `<div class="studio-card-head"><span class="studio-eyebrow">4. GRANSKA & SPARA</span><h2>Redo att spara underlaget?</h2><p>Ett utkast som ni kan testa och arbeta vidare med.</p></div><div class="studio-step-content"><dl class="studio-review"><div><dt>Intresseområde</dt><dd>${esc(interests[activeDraft.interest]?.title || 'Inte valt')}</dd></div><div><dt>Kundens behov</dt><dd>${esc(activeDraft.need)}</dd></div><div><dt>Årsförbrukning · exempel</dt><dd>${activeDraft.volume ? `${Number(activeDraft.volume).toLocaleString('sv-SE')} kWh` : 'Inte angivet'}</dd></div><div><dt>Önskad start · exempel</dt><dd>${esc(formatDate(activeDraft.start))}</dd></div>${activeDraft.note ? `<div><dt>Frågor att ta vidare</dt><dd>${esc(activeDraft.note)}</dd></div>` : ''}</dl><div class="studio-info-panel">${icon('file')}<div><strong>Offertinnehåll återstår</strong><p>Godkända priser, villkor och rätt att lämna offert behöver beslutas. Det sparade utkastet är ett behovsunderlag.</p></div></div><label class="studio-confirm"><input type="checkbox" name="confirmed" required> Jag har kontrollerat underlaget och använder fiktiva uppgifter i testet.</label></div>`;
  }
  function summary() {
    const selected = customer(activeDraft);
    return `<aside class="card studio-summary"><div class="studio-card-head"><span class="studio-eyebrow">KUND & SAMMANFATTNING</span><h2>Ditt underlag</h2></div><div class="studio-summary-body"><div class="studio-customer-mini">${icon('briefcase')}<div><strong>${esc(selected?.company || 'Välj en exempelkund')}</strong><small>${esc(selected ? `${selected.kind} · ${selected.city || 'Ort inte angiven'}` : 'Steg 3 · kundunderlag')}</small></div></div><span class="studio-eyebrow">LÖSNINGSDIALOG</span><h3>${esc(interests[activeDraft.interest]?.title || 'Inget område valt')}</h3><dl class="studio-summary-list"><div><dt>Årsförbrukning</dt><dd>${activeDraft.volume ? `${Number(activeDraft.volume).toLocaleString('sv-SE')} kWh` : 'Inte angivet'}</dd></div><div><dt>Önskad start</dt><dd>${esc(formatDate(activeDraft.start))}</dd></div><div><dt>Pris & produktvillkor</dt><dd>${moneyMissing}</dd></div><div><dt>Offertbefogenhet</dt><dd><span class="studio-missing">Behöver beslutas</span></dd></div></dl><div class="studio-summary-bottom">${icon('shield')}<div><strong>Exempelunderlag</strong><p>Ingen prisberäkning eller kommersiell offert.</p></div></div></div></aside>`;
  }
  function offerList() {
    const items = offers().slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return `<section class="card studio-saved" aria-labelledby="studio-saved-title"><div class="studio-card-head studio-list-head"><div><span class="studio-eyebrow">LOKALT SPARADE</span><h2 id="studio-saved-title">Mina offertutkast</h2></div><span class="pill">${items.length} utkast</span></div>${items.length ? `<div class="studio-offer-table">${items.map(item => `<div class="studio-offer-row"><span class="studio-file-icon">${icon('file')}</span><div class="studio-offer-info"><strong>${esc(name(item))}</strong><small>${esc(interests[item.interest]?.title || 'Elhandel')} · ${esc(formatDate(item.updatedAt))}</small></div><span class="studio-tag ${item.simulatedSentAt ? 'is-teal' : ''}">${item.simulatedSentAt ? 'Skickat · simulerat' : 'Utkast'}</span><div class="studio-row-actions"><button type="button" class="btn btn-secondary btn-small" data-open-offer="${esc(item.id)}">Öppna</button><button type="button" class="studio-icon-button" data-export-offer="${esc(item.id)}" aria-label="Hämta demounderlag för ${esc(name(item))}" title="Hämta demounderlag">${icon('download')}</button><button type="button" class="btn btn-secondary btn-small" data-send-offer="${esc(item.id)}">Simulera skickat</button></div></div>`).join('')}</div>` : `<div class="studio-empty"><span class="studio-file-icon">${icon('file')}</span><div><strong>Ditt första utkast börjar här.</strong><p>Fyll i studions fyra steg. Det sparade underlaget syns sedan i denna lista.</p></div></div>`}<p class="studio-list-foot">Enbart lokal lagring i denna webbläsare. ”Simulera skickat” markerar ett demosteg; inget skickas.</p></section>`;
  }
  function renderOffers() {
    currentContext();
    return `${heading('Offert- & avtalsstudio', 'Bygg ett tydligt kundunderlag. Ta nästa steg i affären.', `<button type="button" class="btn btn-secondary" data-new-offer>${icon('plus')} Nytt utkast</button>`)}${stepper()}<form id="studio-form" novalidate><div class="studio-layout">${options()}<section class="card studio-work">${mainStep()}<div class="studio-work-actions"><button type="button" class="btn btn-secondary" data-previous-step ${step === 1 ? 'disabled' : ''}>Tillbaka</button><span class="studio-step-count">Steg ${step} av 4</span><button type="submit" class="btn btn-primary">${step === 4 ? `${icon('file')} Spara offertutkast` : `Nästa steg ${icon('arrow')}`}</button></div></section>${summary()}</div></form>${offerList()}<div class="studio-bottom-note">${icon('help')} <span>Detta flöde är ett förslag att testa. Produktvillkor, offertbefogenhet och dokumentkrav behöver ni fastställa.</span></div>`;
  }
  function capture() {
    const form = document.getElementById('studio-form');
    if (!form) return;
    const chosen = form.querySelector('input[name="interest"]:checked');
    activeDraft.interest = chosen?.value || '';
    for (const key of ['need', 'volume', 'start', 'note', 'customerId']) {
      const input = form.elements.namedItem(key);
      if (input) activeDraft[key] = String(input.value).trim();
    }
    const selected = customer(activeDraft);
    if (selected) { activeDraft.partner = selected.partner; activeDraft.customerName = selected.company; }
  }
  function validateStep(target = step, review = true) {
    capture();
    const form = document.getElementById('studio-form');
    const fieldError = (id, message) => {
      const input = document.getElementById(id);
      if (input) { input.setCustomValidity(message); input.reportValidity(); input.addEventListener('input', () => input.setCustomValidity(''), { once: true }); }
      else P.toast(message);
      return false;
    };
    if (!Object.hasOwn(interests, activeDraft.interest)) {
      if (step === 1) { form.querySelector('input[name="interest"]')?.reportValidity(); }
      else P.toast('Välj först ett intresseområde.');
      return false;
    }
    if (target >= 2 && !activeDraft.need) return fieldError('studio-need', 'Beskriv behovet med text, inte enbart blanksteg.');
    if (target >= 2 && activeDraft.volume && (!/^\d+$/.test(activeDraft.volume) || Number(activeDraft.volume) < 1 || Number(activeDraft.volume) > 1000000000000)) return fieldError('studio-volume', 'Ange en positiv hel årsvolym i kWh, eller lämna fältet tomt.');
    if (target >= 2 && activeDraft.start && !isCalendarDate(activeDraft.start)) return fieldError('studio-start', 'Ange ett giltigt datum, eller lämna fältet tomt.');
    if (target >= 3 && !customer(activeDraft)) return fieldError('studio-customer', 'Välj en exempelkund från listan.');
    if (target === 4 && review && !form.elements.namedItem('confirmed')?.checked) {
      form.elements.namedItem('confirmed')?.reportValidity();
      return false;
    }
    return true;
  }
  function rerenderStep(focusSelector = '') {
    P.render();
    if (focusSelector) document.querySelector(focusSelector)?.focus();
  }
  function textDocument(item) {
    const selected = customer(item);
    return [
      'DEMOUNDERLAG — FIKTIVA UPPGIFTER',
      'Detta är ett lokalt testunderlag. Ingen kommersiell offert, inget avtal eller juridisk fullmakt.',
      'Ingen verklig utskickning eller signering har skett.', '',
      `Utkast: ${item.id}`, `Kund: ${name(item)}`, `Kundtyp: ${selected?.kind || 'Inte angivet'}`,
      `Intresseområde: ${interests[item.interest]?.title || 'Elhandel'}`, '',
      'KUNDENS BEHOV', item.need, '', `Årsförbrukning — exempel: ${item.volume ? `${item.volume} kWh` : 'Inte angivet'}`,
      `Önskad start — exempel: ${item.start || 'Inte angivet'}`, '', 'FRÅGOR ATT TA VIDARE', item.note || 'Inte angivet', '',
      'SAKNAT BESLUTSUNDERLAG', 'Godkända priser och produktvillkor.', 'Partnerns rätt att lämna offerter och hantera dokument.',
      'Fullmakts- och avtalsmallar samt eventuell ersättningsmodell.', '',
      `Utskick: ${item.simulatedSentAt ? 'Simulerat i denna webbläsare. Inget skickades.' : 'Inget utskick gjort.'}`,
      ...Object.entries(documentNames).map(([key, label]) => `${label}: ${item.documentSteps?.[key] ? 'Demosteg genomfört. Ingen verklig åtgärd.' : 'Underlag/anslutning saknas.'}`), '',
      'Uppgifterna sparas endast i denna webbläsare och delas inte mellan datorer.'
    ].join('\n');
  }
  function exportOffer(id) {
    const item = offers().find(offer => offer.id === id);
    if (!item) return;
    P.download(`demounderlag-${item.id}.txt`, textDocument(item), 'text/plain;charset=utf-8');
    P.toast('Demounderlaget hämtat som text. Det är ingen offert eller juridiskt dokument.');
  }
  function saveOffer() {
    if (!validateStep(4)) return;
    if (!canEdit(activeDraft)) return;
    const previousOffers = P.state.offers.slice();
    const previousDraft = structuredClone(activeDraft);
    const selected = customer(activeDraft);
    const previousRecord = selected && structuredClone(selected);
    const now = new Date().toISOString();
    if (!activeDraft.id) { activeDraft.id = `utkast-${crypto.randomUUID().slice(0, 8)}`; activeDraft.createdAt = now; }
    activeDraft.updatedAt = now;
    const previous = offers().find(item => item.id === activeDraft.id);
    if (previous) { activeDraft.documentSteps = previous.documentSteps || {}; activeDraft.simulatedSentAt = previous.simulatedSentAt || ''; }
    const copy = JSON.parse(JSON.stringify(activeDraft));
    const index = P.state.offers.findIndex(item => isObject(item) && item.id === copy.id);
    if (index < 0) P.state.offers.unshift(copy); else P.state.offers[index] = copy;
    if (selected && (selected.stage === 'lead' || !selected.stage)) selected.stage = 'offer';
    if (selected && !Array.isArray(selected.events)) selected.events = [];
    sharedEvent(activeDraft, 'Offertutkast sparat som lokalt behovsunderlag i prototypen. Priser och villkor saknas.');
    if (!saveOrRollback(() => {
      P.state.offers.splice(0, P.state.offers.length, ...previousOffers);
      activeDraft = previousDraft;
      if (selected) restoreObject(selected, previousRecord);
    })) return;
    P.render(); P.toast('Offertutkastet sparat i denna webbläsare.');
    document.getElementById('studio-saved-title')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function confirmSend(id) {
    const item = offers().find(offer => offer.id === id);
    if (!item) return;
    P.openDialog('Simulera ett utskick', `<div class="studio-dialog-note">${icon('mail')}<p>Testa att markera <strong>${esc(name(item))}</strong> som skickat i prototypen. Inget meddelande skickas och inget erbjudande lämnas.</p></div><div class="modal-actions"><button type="button" class="btn btn-secondary" id="studio-cancel-send">Avbryt</button><button type="button" class="btn btn-primary" id="studio-confirm-send">Markera demosteg</button></div>`, () => {
      document.getElementById('studio-cancel-send').addEventListener('click', P.closeDialog);
      document.getElementById('studio-confirm-send').addEventListener('click', () => {
        if (!canEdit(item)) return;
        const previous = structuredClone(item), previousDraft = structuredClone(activeDraft);
        const record = customer(item), previousRecord = record && structuredClone(record);
        item.simulatedSentAt = new Date().toISOString(); item.updatedAt = item.simulatedSentAt;
        if (activeDraft.id === item.id) activeDraft.simulatedSentAt = item.simulatedSentAt;
        if (record && !Array.isArray(record.events)) record.events = [];
        sharedEvent(item, 'Utskick av offertutkast simulerat i prototypen. Inget skickades och ingen kommersiell offert lämnades.');
        if (!saveOrRollback(() => { restoreObject(item, previous); activeDraft = previousDraft; if (record) restoreObject(record, previousRecord); })) return;
        P.closeDialog(); P.render(); P.toast('Markerat som skickat i demot. Inget har skickats.');
      });
    });
  }
  function bindShared() {
    document.querySelectorAll('[data-export-offer]').forEach(button => button.addEventListener('click', () => exportOffer(button.dataset.exportOffer)));
    document.querySelectorAll('[data-send-offer]').forEach(button => button.addEventListener('click', () => confirmSend(button.dataset.sendOffer)));
    document.querySelectorAll('[data-open-offer]').forEach(button => button.addEventListener('click', () => {
      const item = offers().find(offer => offer.id === button.dataset.openOffer);
      if (!item) return;
      activeDraft = JSON.parse(JSON.stringify(item)); step = 4; context = `${P.role}:${P.partner}`; P.go('offers');
      document.querySelector('.studio-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }
  function bindOffers() {
    const form = document.getElementById('studio-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (step === 4) saveOffer();
      else if (validateStep()) { step += 1; rerenderStep(step === 2 ? '#studio-need' : step === 3 ? '#studio-customer' : '[name="confirmed"]'); }
    });
    form.querySelectorAll('input[name="interest"]').forEach(input => input.addEventListener('change', () => {
      capture(); rerenderStep(`input[name="interest"][value="${input.value}"]`);
    }));
    const customerInput = document.getElementById('studio-customer');
    customerInput?.addEventListener('change', () => { capture(); rerenderStep('#studio-customer'); });
    form.querySelectorAll('input[name="volume"], input[name="start"]').forEach(input => input.addEventListener('change', () => {
      capture();
      const box = document.querySelector('.studio-summary');
      if (box) box.outerHTML = summary();
    }));
    document.querySelectorAll('[data-studio-step]').forEach(button => button.addEventListener('click', () => {
      const target = Number(button.dataset.studioStep);
      capture();
      if (target > step && !validateStep(target - 1, false)) return;
      step = target; rerenderStep();
    }));
    document.querySelector('[data-previous-step]').addEventListener('click', () => { capture(); if (step > 1) { step -= 1; rerenderStep(); } });
    document.querySelector('[data-new-offer]').addEventListener('click', () => { activeDraft = freshDraft(); step = 1; rerenderStep('input[name="interest"]'); });
    bindShared();
  }
  function selectedAgreement() {
    const items = offers();
    if (!items.some(item => item.id === agreementId)) agreementId = items[0]?.id || '';
    return items.find(item => item.id === agreementId);
  }
  function renderAgreements() {
    currentContext();
    const items = offers();
    const item = selectedAgreement();
    return `${heading('Avtal & dokumentsteg', 'Följ dokumenten genom en tydlig, simulerad arbetsgång.')}<div class="studio-info-panel studio-wide-info">${icon('shield')}<div><strong>Dokumentflöde att testa</strong><p>Godkända mallar, signeringslösning och partnerns mandat återstår. Alla åtgärder på denna sida är lokala demosteg. Pipelinesteget uppdateras i demoflödet utifrån det valda utkastets demosteg. Kopplingen är ett testförslag; befintliga aktiva demokunder behåller sitt steg.</p></div></div>${item ? `<div class="studio-agreements-top"><div class="field"><label for="studio-agreement-select">Välj sparat kundunderlag</label><select id="studio-agreement-select">${items.map(offer => `<option value="${esc(offer.id)}" ${offer.id === item.id ? 'selected' : ''}>${esc(name(offer))} · ${esc(interests[offer.interest]?.title || 'Elhandel')}</option>`).join('')}</select></div><button type="button" class="btn btn-secondary" data-open-offer="${esc(item.id)}">${icon('edit')} Öppna offertutkast</button></div><div class="studio-document-grid">${Object.entries(documentNames).map(([key, label], index) => `<section class="card studio-document-card"><span class="studio-document-number">0${index + 1}</span><div class="studio-feature-icon">${icon(key === 'authority' ? 'shield' : key === 'agreement' ? 'file' : 'edit')}</div><h2>${label}</h2><p>${key === 'authority' ? 'Plats för godkänd fullmaktsmall och definierat uppdrag.' : key === 'agreement' ? 'Plats för godkända avtalsvillkor och dokumentmallar.' : 'Plats för den signeringslösning och identitetskontroll ni väljer.'}</p><span class="studio-tag ${item.documentSteps?.[key] ? 'is-teal' : ''}">${item.documentSteps?.[key] ? 'Demosteg genomfört' : 'Underlag / anslutning saknas'}</span><button type="button" class="btn ${item.documentSteps?.[key] ? 'btn-secondary' : 'btn-primary'}" data-document-step="${key}" data-document-id="${esc(item.id)}">${item.documentSteps?.[key] ? 'Återställ demosteg' : 'Simulera dokumentsteg'}</button><small>${key === 'signing' ? 'Ingen verklig signering sker.' : 'Inget juridiskt dokument skapas.'}</small></section>`).join('')}</div><section class="card studio-document-summary"><div>${icon('briefcase')}<div><strong>${esc(name(item))}</strong><p>${esc(interests[item.interest]?.title || 'Elhandel')} · fiktivt behovsunderlag</p></div></div><button type="button" class="btn btn-secondary" data-export-offer="${esc(item.id)}">${icon('download')} Hämta demounderlag</button></section>` : `<section class="card studio-empty studio-empty-large"><span class="studio-file-icon">${icon('file')}</span><div><h2>Börja med ett offertutkast.</h2><p>När du har sparat ett kundunderlag kan du testa fullmakts-, avtals- och signeringsstegen här.</p><button type="button" class="btn btn-primary" data-go="offers">Öppna offertstudion ${icon('arrow')}</button></div></section>`}`;
  }
  function bindAgreements() {
    document.getElementById('studio-agreement-select')?.addEventListener('change', event => { agreementId = event.target.value; P.render(); });
    document.querySelectorAll('[data-document-step]').forEach(button => button.addEventListener('click', () => {
      const item = offers().find(offer => offer.id === button.dataset.documentId);
      if (!item) return;
      const key = button.dataset.documentStep;
      if (!Object.hasOwn(documentNames, key) || !canEdit(item)) return;
      const previous = structuredClone(item), record = customer(item), previousRecord = record && structuredClone(record);
      item.documentSteps ||= {};
      item.documentSteps[key] = !item.documentSteps[key];
      item.updatedAt = new Date().toISOString();
      syncDemoStage(item);
      if (record && !Array.isArray(record.events)) record.events = [];
      sharedEvent(item, `${documentNames[key]}: demosteg ${item.documentSteps[key] ? 'genomfört' : 'återställt'} i prototypen. Inget juridiskt dokument skapades eller signerades.`);
      if (!saveOrRollback(() => { restoreObject(item, previous); if (record) restoreObject(record, previousRecord); })) return;
      P.render(); P.toast(item.documentSteps[key] ? 'Demosteg genomfört lokalt. Inget dokument skapades eller signerades.' : 'Demosteget återställt.');
    }));
    bindShared();
  }
  function renderDocuments() {
    currentContext();
    const items = offers();
    return `${heading('Dokument', 'Samla dina kundunderlag och se vad som återstår.')}<div class="studio-document-library"><section class="card studio-saved"><div class="studio-card-head studio-list-head"><div><span class="studio-eyebrow">DINA TESTUNDERLAG</span><h2>Offertutkast & demodokument</h2></div><span class="pill">${items.length} underlag</span></div>${items.length ? `<div class="studio-offer-table">${items.map(item => `<div class="studio-offer-row"><span class="studio-file-icon">${icon('file')}</span><div class="studio-offer-info"><strong>${esc(name(item))}</strong><small>Demounderlag · TXT · ${esc(formatDate(item.updatedAt))}</small></div><span class="studio-tag">Exempeldata</span><div class="studio-row-actions"><button type="button" class="btn btn-secondary btn-small" data-open-offer="${esc(item.id)}">Granska</button><button type="button" class="btn btn-primary btn-small" data-export-offer="${esc(item.id)}">${icon('download')} Hämta</button></div></div>`).join('')}</div>` : `<div class="studio-empty"><span class="studio-file-icon">${icon('file')}</span><div><strong>Inga sparade underlag ännu.</strong><p>Skapa ett utkast i offertstudion för att testa dokumentbiblioteket.</p><button type="button" class="btn btn-primary btn-small" data-go="offers">Skapa offertutkast</button></div></div>`}<p class="studio-list-foot">Textfilerna är demounderlag. De innehåller inga priser, bindande villkor eller juridiska avtals- eller fullmaktstexter.</p></section><aside class="card studio-template-list"><div class="studio-card-head"><span class="studio-eyebrow">ATT FYLLA MED ERT UNDERLAG</span><h2>Godkända mallar</h2></div>${['Offertmall & produktvillkor', 'Fullmaktsmall', 'Avtalsmall', 'Partnerns befogenheter'].map(title => `<div class="studio-template-row">${icon('file')}<div><strong>${title}</strong><small>Underlag saknas</small></div></div>`).join('')}<p class="studio-small-note">Material läggs till när ni lämnar godkänt underlag.</p></aside></div>`;
  }
  P.prepareBusinessOffer = recordId => {
    currentContext();
    const record = P.getRecords().find(item => item.id === recordId && item.partner === 'syd');
    if (!record) return;
    const detail = P.state.businessDetails?.[recordId] || {};
    activeDraft = {
      ...freshDraft(), partner: record.partner, customerId: record.id,
      interest: (Array.isArray(detail.topics) ? detail.topics : []).find(topic => Object.hasOwn(interests, topic)) || 'contract',
      need: detail.questions || record.need || '', volume: detail.annualVolume || '',
      start: detail.start || '', note: detail.facilities ? `Antal anläggningar i exempelunderlag: ${detail.facilities}.` : ''
    };
    step = 2;
    P.go('offers');
  };
  P.register('offers', { render: renderOffers, bind: bindOffers });
  P.register('agreements', { render: renderAgreements, bind: bindAgreements });
  P.register('documents', { render: renderDocuments, bind: bindShared });
})();
